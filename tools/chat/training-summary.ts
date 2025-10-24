import { tool } from "ai"
import { z } from "zod"

import type {
  TrainingSummaryWidgetData,
  WidgetToolResult,
} from "@/lib/types/chat"
import type { ServerSupabaseClient } from "./types"

interface TrainingSummaryToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

interface RawWorkoutSession {
  id: string
  title: string | null
  kind: string | null
  started_at: string
  ended_at: string | null
  perceived_exertion: number | null
}

const MAX_WEEKS = 4
const MAX_RECENT_SESSIONS = 6

function clampWeeks(weeks: number): number {
  return Math.min(Math.max(weeks, 1), MAX_WEEKS)
}

function formatDuration(minutes: number): string {
  if (minutes <= 0) {
    return "0m"
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = Math.round(minutes % 60)

  if (hours === 0) {
    return `${remainingMinutes}m`
  }

  if (remainingMinutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${remainingMinutes}m`
}

function minutesBetween(startIso: string, endIso: string | null): number {
  const start = new Date(startIso)
  const end = endIso
    ? new Date(endIso)
    : new Date(start.getTime() + 60 * 60 * 1000)

  const diffMs = end.getTime() - start.getTime()
  const minutes = diffMs / (60 * 1000)
  return minutes > 0 ? minutes : 0
}

async function fetchTrainingSessions(
  context: TrainingSummaryToolContext,
  weeks: number
): Promise<RawWorkoutSession[]> {
  const { supabase, userId } = context
  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setDate(rangeStart.getDate() - weeks * 7)

  const { data, error } = await supabase
    .from("workout_sessions")
    .select("id, title, kind, started_at, ended_at, perceived_exertion")
    .eq("owner_id", userId)
    .gte("started_at", rangeStart.toISOString())
    .order("started_at", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[chat-tools] Error fetching training summary:", error)
    return []
  }

  return (data ?? []).map((session) => session as RawWorkoutSession)
}

function summariseTrainingSessions(
  sessions: RawWorkoutSession[]
): TrainingSummaryWidgetData {
  if (sessions.length === 0) {
    return {
      weeklySummary: {
        sessionsCompleted: 0,
        totalDuration: "0m",
        avgIntensity: 0,
      },
      recentSessions: [],
    }
  }

  const totalMinutes = Math.round(
    sessions.reduce(
      (total, session) =>
        total + minutesBetween(session.started_at, session.ended_at),
      0
    )
  )

  const intensities = sessions
    .map((session) => session.perceived_exertion)
    .filter((value): value is number => value !== null && value !== undefined)

  const avgIntensity =
    intensities.length > 0
      ? Number(
          (
            intensities.reduce((sum, value) => sum + value, 0) /
            intensities.length
          ).toFixed(1)
        )
      : 0

  const recentSessions = sessions
    .slice(0, MAX_RECENT_SESSIONS)
    .map((session) => {
      const durationMinutes = minutesBetween(
        session.started_at,
        session.ended_at
      )
      return {
        name: session.title || session.kind || "Training Session",
        duration: formatDuration(durationMinutes),
        intensity:
          session.perceived_exertion !== null &&
          session.perceived_exertion !== undefined
            ? session.perceived_exertion
            : 0,
      }
    })

  return {
    weeklySummary: {
      sessionsCompleted: sessions.length,
      totalDuration: formatDuration(totalMinutes),
      avgIntensity,
    },
    recentSessions,
  }
}

export function createShowTrainingSummaryTool(
  context: TrainingSummaryToolContext
) {
  return tool({
    description:
      "Summarise recent training workload including completed sessions, duration, and intensity.",
    inputSchema: z.object({
      weeks: z
        .number()
        .min(1)
        .max(MAX_WEEKS)
        .default(1)
        .describe("Number of weeks to analyse (maximum of 4)."),
    }),
    /**
     * Executes the training summary tool by aggregating the user's workouts.
     *
     * The summary mirrors the data presented in the training widgets across
     * the dashboard: total sessions, total duration, average perceived
     * exertion, and a breakdown of the most recent workouts.
     */
    execute: async ({ weeks }): Promise<WidgetToolResult> => {
      const clampedWeeks = clampWeeks(weeks)
      const sessions = await fetchTrainingSessions(context, clampedWeeks)
      const widgetData = summariseTrainingSessions(sessions)

      const displayText =
        sessions.length === 0
          ? `I couldn't find any training sessions in the last ${clampedWeeks} week${
              clampedWeeks > 1 ? "s" : ""
            }.`
          : `Summarised your last ${clampedWeeks} week${
              clampedWeeks > 1 ? "s" : ""
            } of training.`

      return {
        widgetType: "training-summary",
        displayText,
        widgetData,
      }
    },
  })
}
