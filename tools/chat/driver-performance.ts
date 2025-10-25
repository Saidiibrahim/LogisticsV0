import { tool } from "ai"
import { z } from "zod"

import type {
  DriverPerformanceWidgetData,
  WidgetToolResult,
} from "@/lib/types/chat"
import type { ServerSupabaseClient } from "./types"

interface DriverPerformanceToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

interface RawDeliveryEvent {
  id: string
  title: string
  start_time: string
  end_time: string | null
  status: string
  scheduled_time: string | null
  location_name: string | null
  delivery_id: string | null
}

interface RawDelivery {
  id: string
  site_id: string | null
  scheduled_time: string | null
  delivered_at: string | null
  status: string
  sites: {
    name: string
  } | null | Array<{ name: string }>
}

const MAX_WEEKS = 4
const MAX_RECENT_DELIVERIES = 6

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

function formatTimeAgo(dateIso: string): string {
  const now = new Date()
  const date = new Date(dateIso)
  const diffMs = now.getTime() - date.getTime()
  const diffMinutes = Math.floor(diffMs / (60 * 1000))

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`
  }

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) {
    return `${diffHours}h ago`
  }

  const diffDays = Math.floor(diffHours / 24)
  return `${diffDays}d ago`
}

async function fetchDeliveryEvents(
  context: DriverPerformanceToolContext,
  weeks: number
): Promise<RawDeliveryEvent[]> {
  const { supabase, userId } = context
  const now = new Date()
  const rangeStart = new Date(now)
  rangeStart.setDate(rangeStart.getDate() - weeks * 7)

  const { data, error } = await supabase
    .from("calendar_events")
    .select(
      "id, title, start_time, end_time, status, location_name, delivery_id"
    )
    .eq("assigned_driver_id", userId)
    .in("event_type", ["delivery", "pickup"])
    .gte("start_time", rangeStart.toISOString())
    .order("start_time", { ascending: false })
    .limit(50)

  if (error) {
    console.error("[chat-tools] Error fetching delivery events:", error)
    return []
  }

  return (data ?? []).map((event) => event as RawDeliveryEvent)
}

async function fetchRecentDeliveries(
  context: DriverPerformanceToolContext,
  limit: number
): Promise<RawDelivery[]> {
  const { supabase, userId } = context

  const { data, error } = await supabase
    .from("deliveries")
    .select(
      `
      id,
      site_id,
      scheduled_time,
      delivered_at,
      status,
      sites (
        name
      )
    `
    )
    .eq("delivered_by", userId)
    .in("status", ["delivered", "failed"])
    .order("delivered_at", { ascending: false })
    .limit(limit)

  if (error) {
    console.error("[chat-tools] Error fetching recent deliveries:", error)
    return []
  }

  return (data ?? []).map((delivery) => delivery as RawDelivery)
}

function calculateOnTimeRate(
  deliveries: RawDelivery[]
): number {
  if (deliveries.length === 0) {
    return 0
  }

  const onTimeDeliveries = deliveries.filter((delivery) => {
    if (!delivery.scheduled_time || !delivery.delivered_at) {
      return false
    }

    const scheduled = new Date(delivery.scheduled_time)
    const delivered = new Date(delivery.delivered_at)

    // Consider on-time if delivered within 15 minutes of scheduled time
    const diffMinutes = (delivered.getTime() - scheduled.getTime()) / (60 * 1000)
    return Math.abs(diffMinutes) <= 15
  })

  return Number(((onTimeDeliveries.length / deliveries.length) * 100).toFixed(1))
}

function summariseDriverPerformance(
  events: RawDeliveryEvent[],
  recentDeliveries: RawDelivery[]
): DriverPerformanceWidgetData {
  if (events.length === 0) {
    return {
      weeklySummary: {
        deliveriesCompleted: 0,
        totalHours: "0h",
        onTimeRate: 0,
      },
      recentDeliveries: [],
    }
  }

  const completedEvents = events.filter(
    (event) => event.status === "completed"
  )

  const totalMinutes = Math.round(
    completedEvents.reduce(
      (total, event) =>
        total + minutesBetween(event.start_time, event.end_time),
      0
    )
  )

  const onTimeRate = calculateOnTimeRate(recentDeliveries)

  const recentDeliveryItems = recentDeliveries
    .slice(0, MAX_RECENT_DELIVERIES)
    .map((delivery) => {
      const siteName = Array.isArray(delivery.sites)
        ? delivery.sites[0]?.name ?? "Unknown Site"
        : delivery.sites?.name ?? "Unknown Site"

      return {
        siteName,
        completedAt: delivery.delivered_at
          ? formatTimeAgo(delivery.delivered_at)
          : "N/A",
        status: delivery.status === "delivered" ? ("delivered" as const) : ("failed" as const),
      }
    })

  return {
    weeklySummary: {
      deliveriesCompleted: completedEvents.length,
      totalHours: formatDuration(totalMinutes),
      onTimeRate,
    },
    recentDeliveries: recentDeliveryItems,
  }
}

export function createShowDriverPerformanceTool(
  context: DriverPerformanceToolContext
) {
  return tool({
    description:
      "Summarise driver performance including completed deliveries, total hours worked, and on-time delivery rate.",
    inputSchema: z.object({
      weeks: z
        .number()
        .min(1)
        .max(MAX_WEEKS)
        .default(1)
        .describe("Number of weeks to analyse (maximum of 4)."),
    }),
    /**
     * Executes the driver performance tool by aggregating the driver's delivery events.
     *
     * The summary includes total completed deliveries, total hours worked,
     * on-time delivery rate, and a list of recent deliveries with their status.
     */
    execute: async ({ weeks }): Promise<WidgetToolResult> => {
      const clampedWeeks = clampWeeks(weeks)
      const [events, recentDeliveries] = await Promise.all([
        fetchDeliveryEvents(context, clampedWeeks),
        fetchRecentDeliveries(context, MAX_RECENT_DELIVERIES),
      ])
      const widgetData = summariseDriverPerformance(events, recentDeliveries)

      const displayText =
        events.length === 0
          ? `I couldn't find any delivery events in the last ${clampedWeeks} week${
              clampedWeeks > 1 ? "s" : ""
            }.`
          : `Summarised your performance for the last ${clampedWeeks} week${
              clampedWeeks > 1 ? "s" : ""
            }.`

      return {
        widgetType: "driver-performance",
        displayText,
        widgetData,
      }
    },
  })
}
