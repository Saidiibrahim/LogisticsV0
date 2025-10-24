/**
 * Calendar event categories used as discriminators across the union.
 */
export type EventType = "shift" | "training" | "coaching"

/**
 * Status options shared by all calendar event types.
 */
export type EventStatus =
  | "scheduled" // For shifts and coaching sessions
  | "in_progress" // For active shifts
  | "completed" // For completed shifts
  | "canceled" // For canceled shifts
  | "planned" // For planned training/coaching
  | "active" // For active training
  | "ended" // For ended training
  | "aborted" // For aborted training


/**
 * Enumerates the workout kinds stored in `workout_sessions`.
 */
export type TrainingKind =
  | "outdoorRun"
  | "outdoorWalk"
  | "indoorRun"
  | "indoorCycle"
  | "strength"
  | "mobility"
  | "driverTraining"
  | "custom"

/**
 * Coaching session formats supported by the application.
 */
export type CoachingSessionType =
  | "video_review"
  | "presentation"
  | "discussion"
  | "workshop"
  | "other"

/**
 * Base fields shared by all calendar events, regardless of source table.
 */
export interface BaseCalendarEvent {
  id: string
  type: EventType
  title: string
  start: Date
  end: Date
  status: EventStatus
  location?: string
  notes?: string
  owner_id: string
}

/**
 * Calendar representation of driver shifts.
 */
export interface ShiftEvent extends BaseCalendarEvent {
  type: "shift"
  driver_name?: string
  vehicle_id?: string
  route_name?: string
  // Reference to source table
  shift_id?: string
}

/**
 * Training session pulled from the `workout_sessions` table.
 */
export interface TrainingEvent extends BaseCalendarEvent {
  type: "training"
  trainingKind: TrainingKind
  perceived_exertion?: number
  preset_id?: string
  metadata?: Record<string, unknown>
  summary?: Record<string, unknown>
  // Reference to source table
  workout_session_id: string
}

/**
 * Coaching session sourced from the `coaching_sessions` table.
 */
export interface CoachingEvent extends BaseCalendarEvent {
  type: "coaching"
  sessionType: CoachingSessionType
  facilitator?: string
  max_attendees?: number
  // Reference to source table
  coaching_session_id: string
}

/**
 * Discriminated union that describes every possible calendar event variant.
 */
export type CalendarEvent = ShiftEvent | TrainingEvent | CoachingEvent

/**
 * Store representation of calendar filtering options.
 */
export interface CalendarFilters {
  eventTypes: EventType[]
  eventStatuses: EventStatus[]
  searchQuery: string
}

// Helper type guards
/**
 * Narrow a calendar event to the shift variant.
 */
export function isShiftEvent(event: CalendarEvent): event is ShiftEvent {
  return event.type === "shift"
}

/**
 * Narrow a calendar event to the training variant.
 */
export function isTrainingEvent(event: CalendarEvent): event is TrainingEvent {
  return event.type === "training"
}

/**
 * Narrow a calendar event to the coaching variant.
 */
export function isCoachingEvent(event: CalendarEvent): event is CoachingEvent {
  return event.type === "coaching"
}

/**
 * Utility map that controls the accent color for each event type.
 */
export const eventTypeColors: Record<EventType, string> = {
  shift: "bg-blue-500",
  training: "bg-green-500",
  coaching: "bg-purple-500",
}

/**
 * Style and label map for status pills used throughout the calendar UI.
 */
export const eventStatusStyles: Record<
  EventStatus,
  { className: string; label: string }
> = {
  scheduled: { className: "border-2", label: "Scheduled" },
  in_progress: { className: "animate-pulse", label: "In Progress" },
  completed: { className: "opacity-60", label: "Completed" },
  canceled: { className: "line-through opacity-50", label: "Canceled" },
  planned: { className: "border-2", label: "Planned" },
  active: { className: "animate-pulse", label: "Active" },
  ended: { className: "opacity-60", label: "Ended" },
  aborted: { className: "line-through opacity-50", label: "Aborted" },
}
