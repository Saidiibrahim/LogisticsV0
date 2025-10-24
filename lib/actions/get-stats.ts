"use server"

import { createClient } from "@/lib/supabase/server"
import type { GetStatsOptions, StatsData, StatsPeriod } from "@/lib/types/stats"
import { getErrorMessage } from "@/lib/utils/errors"
import {
  type AssessmentRow,
  buildAssessmentSummary,
  buildOverviewStats,
  calculatePeriodStart,
  type MatchRow,
  type MatchWithAssessmentsRow,
  mapRecentMatches,
} from "./stats-helpers"

const DEFAULT_PERIOD: StatsPeriod = "3m"
const DEFAULT_RECENT_MATCHES_LIMIT = 5

export async function getMatchStats(
  options: GetStatsOptions = {}
): Promise<{ data: StatsData | null; error: string | null }> {
  const period = options.period ?? DEFAULT_PERIOD
  const limit = options.limit ?? DEFAULT_RECENT_MATCHES_LIMIT
  const startDate = calculatePeriodStart(period)

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[stats] Auth error:", getErrorMessage(authError))
      return { data: null, error: "Authentication error" }
    }

    if (!user) {
      return { data: null, error: "Unauthorized" }
    }

    let matchesQuery = supabase
      .from("matches")
      .select(
        `
          id,
          started_at,
          home_team_name,
          away_team_name,
          home_score,
          away_score,
          competition_name,
          match_metrics (
            total_goals,
            total_cards,
            yellow_cards,
            red_cards,
            total_penalties,
            avg_added_time_seconds,
            home_cards,
            away_cards
          )
        `
      )
      .eq("owner_id", user.id)
      .eq("status", "completed")
      .order("started_at", { ascending: false })

    if (startDate) {
      matchesQuery = matchesQuery.gte("started_at", startDate)
    }

    const { data: matchesData, error: matchesError } = await matchesQuery

    if (matchesError) {
      console.error(
        "[stats] Matches query error:",
        getErrorMessage(matchesError)
      )
      return { data: null, error: "Failed to load match statistics" }
    }

    const matches = (matchesData ?? []) as MatchRow[]
    const { overview, trends, cardDistribution } = buildOverviewStats(matches)

    let assessmentsQuery = supabase
      .from("match_assessments")
      .select("rating, mood")
      .eq("owner_id", user.id)

    if (startDate) {
      assessmentsQuery = assessmentsQuery.gte("created_at", startDate)
    }

    const { data: assessmentData, error: assessmentError } =
      await assessmentsQuery

    if (assessmentError) {
      console.error(
        "[stats] Assessments query error:",
        getErrorMessage(assessmentError)
      )
    }

    const assessmentSummary = buildAssessmentSummary(
      (assessmentData ?? []) as AssessmentRow[]
    )

    const recentMatchesQuery = supabase
      .from("matches")
      .select(
        `
          id,
          started_at,
          home_team_name,
          away_team_name,
          home_score,
          away_score,
          competition_name,
          match_metrics (
            yellow_cards,
            red_cards
          ),
          match_assessments (
            rating
          )
        `
      )
      .eq("owner_id", user.id)
      .eq("status", "completed")
      .order("started_at", { ascending: false })
      .limit(limit)

    const { data: recentData, error: recentError } = await recentMatchesQuery

    if (recentError) {
      console.error(
        "[stats] Recent matches error:",
        getErrorMessage(recentError)
      )
    }

    const recentMatches = mapRecentMatches(
      (recentData ?? []) as MatchWithAssessmentsRow[]
    )

    const stats: StatsData = {
      overview,
      trends,
      cardDistribution,
      assessmentSummary,
      recentMatches,
    }

    return { data: stats, error: null }
  } catch (error) {
    console.error("[stats] Unexpected error:", error)
    return { data: null, error: getErrorMessage(error) }
  }
}
