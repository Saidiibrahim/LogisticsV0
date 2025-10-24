import { tool } from "ai"
import { z } from "zod"

import type { EventType } from "@/lib/types/calendar"
import type { CalendarWidgetData, WidgetToolResult } from "@/lib/types/chat"
import type { ServerSupabaseClient } from "./types"

interface CalendarToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

// Test comment
interface RawScheduledMatch {
  id: string
  home_team_name: string
  away_team_name: string
  kickoff_at: string
  venue_name: string | null
  status: string | null
}

interface RawMatch {
  id: string
  home_team_name: string
  away_team_name: string
  started_at: string
  venue_name: string | null
  status: string | null
}

interface RawTrainingSession {
  id: string
  title: string | null
  kind: string | null
  started_at: string
  ended_at: string | null
}

interface RawCoachingSession {
  id: string
  title: string | null
  start_time: string
  location: string | null
}

const DATE_RANGE_LIMIT_DAYS = 60
const MAX_EVENTS = 12

function clampDaysAhead(daysAhead: number): number {
  return Math.min(Math.max(daysAhead, 1), DATE_RANGE_LIMIT_DAYS)
}

function formatTime(date: Date): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(date)
}

function mapToWidgetEvent(
  type: EventType,
  id: string,
  title: string,
  start: Date,
  location?: string | null
): CalendarWidgetData["events"][number] {
  return {
    id,
    title,
    type,
    date: start.toISOString(),
    time: formatTime(start),
    location: location ?? undefined,
  }
}

async function fetchCalendarEvents(
  context: CalendarToolContext,
  daysAhead: number,
  filterType: "all" | "matches" | "training"
): Promise<CalendarWidgetData["events"]> {
  const { supabase, userId } = context
  const now = new Date()
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  const requests: Array<PromiseLike<CalendarWidgetData["events"]>> = []

  if (filterType === "all" || filterType === "matches") {
    const scheduledMatchesPromise = supabase
      .from("scheduled_matches")
      .select(
        "id, home_team_name, away_team_name, kickoff_at, venue_name, status"
      )
      .eq("owner_id", userId)
      .gte("kickoff_at", now.toISOString())
      .lte("kickoff_at", endDate.toISOString())
      .order("kickoff_at", { ascending: true })
      .limit(MAX_EVENTS)
      .then(({ data, error }) => {
        if (error) {
          console.error("[chat-tools] Error fetching scheduled matches:", error)
          return []
        }

        return (data ?? []).map((match: RawScheduledMatch) =>
          mapToWidgetEvent(
            "match",
            `scheduled-${match.id}`,
            `${match.home_team_name} vs ${match.away_team_name}`,
            new Date(match.kickoff_at),
            match.venue_name
          )
        )
      })

    const liveMatchesPromise = supabase
      .from("matches")
      .select(
        "id, home_team_name, away_team_name, started_at, venue_name, status"
      )
      .eq("owner_id", userId)
      .neq("status", "completed")
      .gte("started_at", now.toISOString())
      .lte("started_at", endDate.toISOString())
      .order("started_at", { ascending: true })
      .limit(MAX_EVENTS)
      .then(({ data, error }) => {
        if (error) {
          console.error("[chat-tools] Error fetching active matches:", error)
          return []
        }

        return (data ?? []).map((match: RawMatch) =>
          mapToWidgetEvent(
            "match",
            `match-${match.id}`,
            `${match.home_team_name} vs ${match.away_team_name}`,
            new Date(match.started_at),
            match.venue_name
          )
        )
      })

    requests.push(scheduledMatchesPromise, liveMatchesPromise)
  }

  if (filterType === "all" || filterType === "training") {
    const trainingPromise = supabase
      .from("workout_sessions")
      .select("id, title, kind, started_at, ended_at")
      .eq("owner_id", userId)
      .gte("started_at", now.toISOString())
      .lte("started_at", endDate.toISOString())
      .order("started_at", { ascending: true })
      .limit(MAX_EVENTS)
      .then(({ data, error }) => {
        if (error) {
          console.error("[chat-tools] Error fetching training sessions:", error)
          return []
        }

        return (data ?? []).map((session: RawTrainingSession) =>
          mapToWidgetEvent(
            "training",
            `training-${session.id}`,
            session.title || session.kind || "Training Session",
            new Date(session.started_at),
            null
          )
        )
      })

    requests.push(trainingPromise)

    if (filterType === "all") {
      const coachingPromise = supabase
        .from("coaching_sessions")
        .select("id, title, start_time, location")
        .eq("owner_id", userId)
        .gte("start_time", now.toISOString())
        .lte("start_time", endDate.toISOString())
        .order("start_time", { ascending: true })
        .limit(MAX_EVENTS)
        .then(({ data, error }) => {
          if (error) {
            console.error(
              "[chat-tools] Error fetching coaching sessions:",
              error
            )
            return []
          }

          return (data ?? []).map((session: RawCoachingSession) =>
            mapToWidgetEvent(
              "coaching",
              `coaching-${session.id}`,
              session.title || "Coaching Session",
              new Date(session.start_time),
              session.location
            )
          )
        })

      requests.push(coachingPromise)
    }
  }

  const results = await Promise.all(requests)
  const merged = results.flat()

  return merged
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, MAX_EVENTS)
}

export function createShowCalendarTool(context: CalendarToolContext) {
  return tool({
    description:
      "Display upcoming matches, coaching sessions, and training sessions in a calendar widget.",
    inputSchema: z.object({
      filterType: z
        .enum(["all", "matches", "training"])
        .optional()
        .describe("Optional filter for narrowing events by type"),
      daysAhead: z
        .number()
        .min(1)
        .max(DATE_RANGE_LIMIT_DAYS)
        .default(14)
        .describe("Number of future days to include in the schedule (max 60)."),
    }),
    /**
     * Executes the calendar widget tool by querying the user's upcoming events.
     *
     * This function aggregates scheduled matches, live/in-progress matches,
     * planned training sessions, and coaching appointments into a unified list.
     * The results are mapped into the `CalendarWidgetData` format expected by
     * the chat widget renderer.
     */
    execute: async ({
      filterType = "all",
      daysAhead,
    }): Promise<WidgetToolResult> => {
      const clampedDays = clampDaysAhead(daysAhead)
      const events = await fetchCalendarEvents(context, clampedDays, filterType)

      const displayText =
        events.length === 0
          ? "I couldn't find any upcoming events in that time frame."
          : `Here is your schedule for the next ${clampedDays} day${clampedDays > 1 ? "s" : ""}${
              filterType !== "all" ? ` (${filterType})` : ""
            }.`

      const widgetData: CalendarWidgetData = {
        events,
      }

      return {
        widgetType: "calendar",
        displayText,
        widgetData,
      }
    },
  })
}
