import { tool } from "ai"
import { z } from "zod"

import type { CalendarWidgetData, WidgetToolResult } from "@/lib/types/chat"
import type { ServerSupabaseClient } from "./types"

interface CalendarToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

interface RawCalendarEvent {
  id: string
  title: string | null
  event_type: string
  start_time: string
  location_name: string | null
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
  rawEvent: RawCalendarEvent
): CalendarWidgetData["events"][number] | null {
  // Only include delivery and pickup events
  if (rawEvent.event_type !== "delivery" && rawEvent.event_type !== "pickup") {
    return null
  }

  const start = new Date(rawEvent.start_time)

  return {
    id: rawEvent.id,
    title: rawEvent.title || `${rawEvent.event_type} event`,
    type: rawEvent.event_type as "delivery" | "pickup",
    date: start.toISOString(),
    time: formatTime(start),
    location: rawEvent.location_name ?? undefined,
  }
}

async function fetchCalendarEvents(
  context: CalendarToolContext,
  daysAhead: number
): Promise<CalendarWidgetData["events"]> {
  const { supabase, userId } = context
  const now = new Date()
  const endDate = new Date(now.getTime() + daysAhead * 24 * 60 * 60 * 1000)

  // Query calendar_events for delivery and pickup events
  const { data, error } = await supabase
    .from("calendar_events")
    .select("id, title, event_type, start_time, location_name")
    .eq("assigned_driver_id", userId)
    .in("event_type", ["delivery", "pickup"])
    .gte("start_time", now.toISOString())
    .lte("start_time", endDate.toISOString())
    .order("start_time", { ascending: true })
    .limit(MAX_EVENTS)

  if (error) {
    console.error("[chat-tools] Error fetching calendar events:", error)
    return []
  }

  return (data ?? [])
    .map((event: RawCalendarEvent) => mapToWidgetEvent(event))
    .filter((event): event is NonNullable<typeof event> => event !== null)
}

export function createShowCalendarTool(context: CalendarToolContext) {
  return tool({
    description:
      "Display upcoming delivery and pickup events in a calendar widget.",
    inputSchema: z.object({
      daysAhead: z
        .number()
        .min(1)
        .max(DATE_RANGE_LIMIT_DAYS)
        .default(14)
        .describe("Number of future days to include in the schedule (max 60)."),
    }),
    /**
     * Executes the calendar widget tool by querying the driver's upcoming events.
     *
     * This function fetches scheduled delivery and pickup events assigned to the
     * current driver. The results are mapped into the `CalendarWidgetData` format
     * expected by the chat widget renderer.
     */
    execute: async ({ daysAhead }): Promise<WidgetToolResult> => {
      const clampedDays = clampDaysAhead(daysAhead)
      const events = await fetchCalendarEvents(context, clampedDays)

      const displayText =
        events.length === 0
          ? "I couldn't find any upcoming delivery or pickup events in that time frame."
          : `Here is your delivery schedule for the next ${clampedDays} day${clampedDays > 1 ? "s" : ""}.`

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
