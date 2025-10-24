/**
 * Calendar event categories used as discriminators across the union.
 */
export type EventType = "match" | "training" | "coaching"

/**
 * Status options shared by all calendar event types.
 */
export type EventStatus =
  | "scheduled" // For matches and coaching sessions
  | "in_progress" // For active matches
  | "completed" // For completed matches
  | "canceled" // For canceled matches
  | "planned" // For planned training/coaching
  | "active" // For active training
  | "ended" // For ended training
  | "aborted" // For aborted training

/**
 * Additional classification for match events, derived from competition data.
 */
export type MatchType = "league" | "cup" | "friendly" | "tournament"

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
  | "refereeDrill"
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
 * Calendar representation of both scheduled and historical matches.
 */
export interface MatchEvent extends BaseCalendarEvent {
  type: "match"
  matchType?: MatchType // Derived from competition or user preference
  competition_name?: string
  venue_name?: string
  teams: {
    home: string
    away: string
  }
  home_score?: number
  away_score?: number
  // Reference to source table
  scheduled_match_id?: string
  match_id?: string
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
export type CalendarEvent = MatchEvent | TrainingEvent | CoachingEvent

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
 * Narrow a calendar event to the match variant.
 */
export function isMatchEvent(event: CalendarEvent): event is MatchEvent {
  return event.type === "match"
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
  match: "bg-blue-500",
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
