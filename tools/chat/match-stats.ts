import { tool } from "ai"
import { z } from "zod"

import { getMatchStats } from "@/lib/actions/get-stats"
import type { MatchStatsWidgetData, WidgetToolResult } from "@/lib/types/chat"
import { getErrorMessage } from "@/lib/utils/errors"
import type { ServerSupabaseClient } from "./types"

interface MatchStatsToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

type MatchMetricsRow = {
  total_goals: number | null
  total_cards: number | null
  yellow_cards: number | null
  red_cards: number | null
  total_penalties: number | null
  avg_added_time_seconds: number | null
}

type MatchAssessmentRow =
  | { rating: number | null }
  | Array<{ rating: number | null }>
  | null

interface RawMatchWithMetrics {
  id: string
  home_team_name: string
  away_team_name: string
  home_score: number | null
  away_score: number | null
  competition_name: string | null
  started_at: string
  match_metrics: MatchMetricsRow | MatchMetricsRow[] | null
  match_assessments: MatchAssessmentRow
}

function normalizeMetrics(
  raw: MatchMetricsRow | MatchMetricsRow[] | null
): MatchMetricsRow | null {
  if (!raw) {
    return null
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null
  }

  return raw
}

function extractAssessmentRating(
  assessment: MatchAssessmentRow
): number | null {
  if (!assessment) {
    return null
  }

  if (Array.isArray(assessment)) {
    return assessment[0]?.rating ?? null
  }

  return assessment.rating ?? null
}

async function fetchMatchSpecificStats(
  context: MatchStatsToolContext,
  matchId: string
): Promise<MatchStatsWidgetData | null> {
  const { supabase, userId } = context
  const { data, error } = await supabase
    .from("matches")
    .select(
      `
        id,
        home_team_name,
        away_team_name,
        home_score,
        away_score,
        competition_name,
        started_at,
        match_metrics (
          total_goals,
          total_cards,
          yellow_cards,
          red_cards,
          total_penalties,
          avg_added_time_seconds
        ),
        match_assessments (
          rating
        )
      `
    )
    .eq("owner_id", userId)
    .eq("id", matchId)
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error(
      "[chat-tools] Error fetching match stats:",
      getErrorMessage(error)
    )
    return null
  }

  if (!data) {
    return null
  }

  const match = data as RawMatchWithMetrics
  const metrics = normalizeMetrics(match.match_metrics)
  const rating = extractAssessmentRating(match.match_assessments)
  const avgAddedSeconds = metrics?.avg_added_time_seconds ?? null

  const stats: MatchStatsWidgetData["stats"] = [
    {
      label: "Final Score",
      value: `${match.home_team_name} ${match.home_score ?? 0} – ${
        match.away_score ?? 0
      } ${match.away_team_name}`,
    },
    {
      label: "Total Cards",
      value:
        metrics?.total_cards ??
        (metrics?.yellow_cards ?? 0) + (metrics?.red_cards ?? 0),
    },
    {
      label: "Yellow Cards",
      value: metrics?.yellow_cards ?? "—",
    },
    {
      label: "Red Cards",
      value: metrics?.red_cards ?? "—",
    },
    {
      label: "Penalties Awarded",
      value: metrics?.total_penalties ?? 0,
    },
    {
      label: "Avg Added Time (min)",
      value:
        avgAddedSeconds !== null && avgAddedSeconds !== undefined
          ? Number((avgAddedSeconds / 60).toFixed(1))
          : "—",
    },
  ]

  if (rating !== null) {
    stats.push({
      label: "Assessment Rating",
      value: rating,
    })
  }

  return {
    stats,
    matchId,
  }
}

function formatAggregateStats(
  widgetData: Awaited<ReturnType<typeof getMatchStats>>["data"]
): MatchStatsWidgetData {
  if (!widgetData) {
    return {
      stats: [],
    }
  }

  const { overview, assessmentSummary, cardDistribution } = widgetData

  const stats: MatchStatsWidgetData["stats"] = [
    {
      label: "Matches Officiated",
      value: overview.totalMatches,
    },
    {
      label: "Avg Cards / Match",
      value: overview.avgCardsPerMatch,
    },
    {
      label: "Avg Goals / Match",
      value: overview.avgGoalsPerMatch,
    },
    {
      label: "Avg Added Time (min)",
      value: overview.avgAddedTimeMinutes,
    },
    {
      label: "Total Yellow Cards",
      value: cardDistribution.yellowCards,
    },
    {
      label: "Total Red Cards",
      value: cardDistribution.redCards,
    },
  ]

  if (assessmentSummary) {
    stats.push({
      label: "Avg Assessment Rating",
      value: assessmentSummary.avgRating,
    })
  }

  return {
    stats,
  }
}

export function createShowMatchStatsTool(context: MatchStatsToolContext) {
  return tool({
    description:
      "Display officiating statistics. Optionally provide a specific match ID to drill into that game.",
    inputSchema: z.object({
      matchId: z
        .string()
        .optional()
        .describe("Optional match identifier to return detailed statistics"),
    }),
    /**
     * Executes the match statistics tool.
     *
     * When a match identifier is supplied, the handler fetches metrics for that
     * specific game (cards, penalties, added time, assessment rating).
     * Without a `matchId`, the tool returns aggregate statistics computed via
     * the existing stats action used throughout the analytics dashboard.
     */
    execute: async ({ matchId }): Promise<WidgetToolResult> => {
      if (matchId) {
        const widgetData = await fetchMatchSpecificStats(context, matchId)

        if (!widgetData) {
          return {
            widgetType: "match-stats",
            displayText:
              "I couldn't find statistics for that match. Double-check the match ID and try again.",
            widgetData: {
              stats: [],
              matchId,
            },
          }
        }

        return {
          widgetType: "match-stats",
          displayText: `Pulled the latest statistics for match ${matchId}.`,
          widgetData,
        }
      }

      const { data, error } = await getMatchStats({
        period: "3m",
        limit: 10,
      })

      if (error) {
        console.error(
          "[chat-tools] Error fetching aggregate match stats:",
          error
        )
        return {
          widgetType: "match-stats",
          displayText:
            "I encountered an issue loading your match statistics. Please try again shortly.",
          widgetData: {
            stats: [],
          },
        }
      }

      return {
        widgetType: "match-stats",
        displayText: "Here are your recent officiating statistics.",
        widgetData: formatAggregateStats(data),
      }
    },
  })
}
