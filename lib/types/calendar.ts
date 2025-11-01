/**
 * Calendar event categories used as discriminators across the union.
 * Matches the event_type column in the calendar_events table.
 */
export type EventType =
  | "delivery"
  | "pickup"
  | "meeting"
  | "break"
  | "maintenance"
  | "collection"
  | "retail"

/**
 * Status options shared by all calendar event types.
 * Matches the status column in the calendar_events table.
 */
export type EventStatus =
  | "scheduled" // Event is scheduled but not started
  | "in-progress" // Event is currently active
  | "completed" // Event has been completed
  | "cancelled" // Event has been cancelled

/**
 * Resolution values captured when an event reaches a terminal state.
 */
export type EventResolutionType = "done" | "wont_do"

/**
 * Calendar event interface matching the calendar_events table structure.
 * All event types (delivery, pickup, meeting, etc.) use this single interface.
 */
export interface CalendarEvent {
  id: string
  type: EventType
  title: string
  description?: string
  start_time: Date
  end_time: Date
  status: EventStatus
  priority: "low" | "medium" | "high" | "urgent"
  assigned_driver_id?: string
  driver_name?: string
  location_name?: string
  location_address?: string
  location_coordinates?: {
    lat: number
    lng: number
  }
  site_id?: string
  delivery_id?: string
  order_type?: "sales_order" | "purchase_order" | "courier_request"
  order_number?: string
  day_date: Date
  sequence_number: number
  tags?: string[]
  custom_fields?: Record<string, unknown>
  organization_id: string
  created_by: string
  created_at: Date
  updated_at: Date
  resolution_type?: EventResolutionType
  resolution_notes?: string | null
  resolved_at?: Date | null
}

/**
 * Store representation of calendar filtering options.
 */
export interface CalendarFilters {
  eventTypes: EventType[]
  eventStatuses: EventStatus[]
  searchQuery: string
  driverIds: string[] // Filter by assigned driver IDs (empty means show all)
}

/**
 * Utility map that controls the accent color for each event type.
 */
export const eventTypeColors: Record<EventType, string> = {
  delivery: "bg-blue-500",
  pickup: "bg-indigo-500",
  meeting: "bg-purple-500",
  break: "bg-gray-500",
  maintenance: "bg-orange-500",
  collection: "bg-teal-500",
  retail: "bg-pink-500",
}

/**
 * Style and label map for status pills used throughout the calendar UI.
 */
export const eventStatusStyles: Record<
  EventStatus,
  { className: string; label: string }
> = {
  scheduled: { className: "border-2", label: "Scheduled" },
  "in-progress": { className: "animate-pulse", label: "In Progress" },
  completed: { className: "opacity-60", label: "Completed" },
  cancelled: { className: "line-through opacity-50", label: "Cancelled" },
}
