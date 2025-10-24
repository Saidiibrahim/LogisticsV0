"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  DashboardData,
  DashboardQuickStats,
  DashboardRecentMatch,
  DashboardUpcomingMatch,
  GetDashboardDataOptions,
} from "@/lib/types/dashboard"
import { getErrorMessage } from "@/lib/utils/errors"

const DEFAULT_UPCOMING_LIMIT = 5
const DEFAULT_RECENT_LIMIT = 5

type RatingRow = {
  rating: number | null
}

type CardsRow = {
  total_cards: number | null
}

type UpcomingMatchRow = {
  id: string
  kickoff_at: string
  home_team_name: string
  away_team_name: string
  competition_name: string | null
  venue_name: string | null
}

type MatchMetricsRow = {
  total_cards: number | null
  yellow_cards: number | null
  red_cards: number | null
  total_goals: number | null
} | null

type MatchAssessmentRow = {
  rating: number | null
} | null

type RecentMatchRow = {
  id: string
  started_at: string
  home_team_name: string
  away_team_name: string
  home_score: number | null
  away_score: number | null
  competition_name: string | null
  match_metrics: MatchMetricsRow | MatchMetricsRow[] | null
  match_assessments: MatchAssessmentRow | MatchAssessmentRow[] | null
}

type DashboardQueryErrorContext =
  | "matchesThisMonth"
  | "upcomingMatchesCount"
  | "recentRatings"
  | "cardsLast30Days"
  | "upcomingMatches"
  | "recentMatches"

/**
 * Calculate the first day of the current month in ISO format.
 */
function getFirstDayOfCurrentMonth(): string {
  const now = new Date()
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
  return firstDay.toISOString()
}

/**
 * Calculate the date 30 days ago in ISO format.
 */
function get30DaysAgo(): string {
  const now = new Date()
  const thirtyDaysAgo = new Date(now)
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  return thirtyDaysAgo.toISOString()
}

/**
 * Normalize a Supabase relationship response that may be a single object or array.
 */
function normalizeSingle<T>(value: T | T[] | null): T | null {
  if (!value) {
    return null
  }

  return Array.isArray(value) ? (value[0] ?? null) : value
}

/**
 * Log a query-specific error and build user-facing error response.
 */
function handleQueryError(
  context: DashboardQueryErrorContext,
  error: unknown
): { data: null; error: string } {
  console.error(`[dashboard] ${context} query error:`, getErrorMessage(error))
  return { data: null, error: "Failed to load dashboard data" }
}

/**
 * Fetch comprehensive dashboard data including quick stats,
 * upcoming matches, and recent performance metrics.
 *
 * @param options - Configuration for data fetching.
 * @returns Dashboard data or error.
 */
export async function getDashboardData(
  options: GetDashboardDataOptions = {}
): Promise<{ data: DashboardData | null; error: string | null }> {
  const upcomingLimit = options.upcomingLimit ?? DEFAULT_UPCOMING_LIMIT
  const recentLimit = options.recentLimit ?? DEFAULT_RECENT_LIMIT

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[dashboard] Auth error:", getErrorMessage(authError))
      return { data: null, error: "Authentication error" }
    }

    if (!user) {
      return { data: null, error: "Unauthorized" }
    }

    console.log("[dashboard] Fetching dashboard data", {
      userId: user.id,
      upcomingLimit,
      recentLimit,
    })

    const firstDayOfMonth = getFirstDayOfCurrentMonth()
    const thirtyDaysAgo = get30DaysAgo()
    const now = new Date().toISOString()

    const [
      matchesThisMonthResult,
      upcomingMatchesResult,
      recentRatingsResult,
      cardsLast30DaysResult,
      upcomingMatchesData,
      recentMatchesData,
    ] = await Promise.all([
      supabase
        .from("matches")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("status", "completed")
        .gte("started_at", firstDayOfMonth),
      supabase
        .from("scheduled_matches")
        .select("id", { count: "exact", head: true })
        .eq("owner_id", user.id)
        .eq("status", "scheduled")
        .gte("kickoff_at", now),
      supabase
        .from("match_assessments")
        .select("rating")
        .eq("owner_id", user.id)
        .gte("created_at", thirtyDaysAgo)
        .not("rating", "is", null),
      supabase
        .from("match_metrics")
        .select("total_cards")
        .eq("owner_id", user.id)
        .gte("generated_at", thirtyDaysAgo),
      supabase
        .from("scheduled_matches")
        .select(
          `
          id,
          kickoff_at,
          home_team_name,
          away_team_name,
          competition_name,
          venue_name
        `
        )
        .eq("owner_id", user.id)
        .eq("status", "scheduled")
        .gte("kickoff_at", now)
        .order("kickoff_at", { ascending: true })
        .limit(upcomingLimit),
      supabase
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
            total_cards,
            yellow_cards,
            red_cards,
            total_goals
          ),
          match_assessments (
            rating
          )
        `
        )
        .eq("owner_id", user.id)
        .eq("status", "completed")
        .order("started_at", { ascending: false })
        .limit(recentLimit),
    ])

    if (matchesThisMonthResult.error) {
      return handleQueryError("matchesThisMonth", matchesThisMonthResult.error)
    }

    if (upcomingMatchesResult.error) {
      return handleQueryError(
        "upcomingMatchesCount",
        upcomingMatchesResult.error
      )
    }

    if (recentRatingsResult.error) {
      return handleQueryError("recentRatings", recentRatingsResult.error)
    }

    if (cardsLast30DaysResult.error) {
      return handleQueryError("cardsLast30Days", cardsLast30DaysResult.error)
    }

    if (upcomingMatchesData.error) {
      return handleQueryError("upcomingMatches", upcomingMatchesData.error)
    }

    if (recentMatchesData.error) {
      return handleQueryError("recentMatches", recentMatchesData.error)
    }

    const matchesThisMonth = matchesThisMonthResult.count ?? 0
    const upcomingMatchesCount = upcomingMatchesResult.count ?? 0

    const ratings = ((recentRatingsResult.data ?? []) as RatingRow[])
      .map((assessment) => assessment.rating)
      .filter((rating): rating is number => rating !== null)

    const recentAvgRating =
      ratings.length > 0
        ? Number(
            (
              ratings.reduce((sum, rating) => sum + rating, 0) / ratings.length
            ).toFixed(1)
          )
        : null

    const totalCardsLast30Days = (
      (cardsLast30DaysResult.data ?? []) as CardsRow[]
    ).reduce((sum, row) => sum + (row.total_cards ?? 0), 0)

    const quickStats: DashboardQuickStats = {
      matchesThisMonth,
      upcomingMatchesCount,
      recentAvgRating,
      totalCardsLast30Days,
    }

    const upcomingMatches: DashboardUpcomingMatch[] = (
      upcomingMatchesData.data ?? []
    ).map((match) => {
      const scheduled = match as UpcomingMatchRow
      return {
        id: scheduled.id,
        kickoffAt: scheduled.kickoff_at,
        homeTeamName: scheduled.home_team_name,
        awayTeamName: scheduled.away_team_name,
        competitionName: scheduled.competition_name,
        venueName: scheduled.venue_name,
      }
    })

    const recentMatches: DashboardRecentMatch[] = (
      recentMatchesData.data ?? []
    ).map((match) => {
      const typedMatch = match as RecentMatchRow
      const metrics = normalizeSingle<MatchMetricsRow>(typedMatch.match_metrics)
      const assessment = normalizeSingle<MatchAssessmentRow>(
        typedMatch.match_assessments
      )

      return {
        id: typedMatch.id,
        startedAt: typedMatch.started_at,
        homeTeamName: typedMatch.home_team_name,
        awayTeamName: typedMatch.away_team_name,
        homeScore: typedMatch.home_score ?? 0,
        awayScore: typedMatch.away_score ?? 0,
        competitionName: typedMatch.competition_name,
        totalCards: metrics?.total_cards ?? 0,
        yellowCards: metrics?.yellow_cards ?? 0,
        redCards: metrics?.red_cards ?? 0,
        totalGoals: metrics?.total_goals ?? 0,
        rating: assessment?.rating ?? null,
      }
    })

    const dashboardData: DashboardData = {
      quickStats,
      upcomingMatches,
      recentMatches,
    }

    console.log("[dashboard] Dashboard data prepared", {
      quickStats,
      upcomingMatchesCount: upcomingMatches.length,
      recentMatchesCount: recentMatches.length,
    })

    return { data: dashboardData, error: null }
  } catch (error) {
    console.error("[dashboard] Unexpected error:", error)
    return { data: null, error: getErrorMessage(error) }
  }
}
