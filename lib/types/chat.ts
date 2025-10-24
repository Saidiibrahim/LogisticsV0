/**
 * Chat Types
 *
 * Type definitions for the AI-powered chat interface. This module defines
 * the structure for widget-based responses that are displayed in the split-view
 * layout when the AI assistant invokes tools.
 *
 * @module lib/types/chat
 */

/**
 * Available widget types that can be rendered in the chat interface.
 *
 * Each widget type corresponds to a specific visualization component:
 * - `calendar`: Displays upcoming matches, training sessions, and events
 * - `match-stats`: Shows statistics and performance metrics from matches
 * - `training-summary`: Displays training session data and workload summaries
 * - `performance-chart`: Renders performance trends and analytics (future)
 *
 * @see {@link WidgetConfig} for widget configuration structure
 */
export type WidgetType =
  | "calendar"
  | "match-stats"
  | "training-summary"
  | "performance-chart"

/**
 * Layout modes for the chat interface.
 *
 * - `centered`: Default mode with messages displayed in a centered column
 * - `split`: Two-column layout with chat on left and widget panel on right
 *
 * The layout automatically switches to `split` when a widget is activated.
 *
 * @see {@link ChatStore} for layout state management
 */
export type ChatLayoutMode = "centered" | "split"

/**
 * Configuration for rendering a widget in the side panel.
 *
 * This interface defines the complete widget state including its type,
 * data payload, and optional display title.
 *
 * @property {WidgetType} type - The widget type identifier
 * @property {WidgetData} data - Type-safe data payload for the widget
 * @property {string} [title] - Optional display title (falls back to default if not provided)
 *
 * @example
 * ```typescript
 * const widget: WidgetConfig = {
 *   type: "calendar",
 *   data: { events: [...] },
 *   title: "Upcoming Events"
 * }
 * ```
 */
export interface WidgetConfig {
  type: WidgetType
  data: WidgetData
  title?: string
}

/**
 * Calendar widget data structure.
 *
 * Contains an array of upcoming events including matches, training sessions,
 * and coaching appointments. Events are typically filtered by date range
 * and event type on the server side.
 *
 * @property {Array} events - List of calendar events
 *
 * @example
 * ```typescript
 * const calendarData: CalendarWidgetData = {
 *   events: [
 *     {
 *       id: "evt-1",
 *       title: "Premier League: Arsenal vs Chelsea",
 *       type: "match",
 *       date: "2025-10-15T00:00:00Z",
 *       time: "15:00",
 *       location: "Emirates Stadium"
 *     }
 *   ]
 * }
 * ```
 */
export interface CalendarWidgetData {
  events: Array<{
    /** Unique event identifier */
    id: string
    /** Event title/description */
    title: string
    /** Event category */
    type: "match" | "training" | "coaching"
    /** ISO date string */
    date: string
    /** Time in HH:MM format */
    time: string
    /** Optional venue/location */
    location?: string
  }>
}

/**
 * Match statistics widget data structure.
 *
 * Contains performance metrics and statistics from officiating matches.
 * Stats can be for a specific match or aggregated across multiple matches.
 *
 * @property {Array} stats - List of labeled statistics
 * @property {string} [matchId] - Optional specific match identifier
 *
 * @example
 * ```typescript
 * const matchStats: MatchStatsWidgetData = {
 *   stats: [
 *     { label: "Matches Officiated", value: 24 },
 *     { label: "Correct Decisions", value: "95%" }
 *   ],
 *   matchId: "match-123"
 * }
 * ```
 */
export interface MatchStatsWidgetData {
  /** Array of labeled statistics (supports both numeric and string values) */
  stats: Array<{
    label: string
    value: string | number
  }>
  /** Optional match identifier for match-specific stats */
  matchId?: string
}

/**
 * Training summary widget data structure.
 *
 * Displays training workload summary including completed sessions,
 * total duration, average intensity, and details of recent training sessions.
 *
 * @property {Object} weeklySummary - Aggregated weekly training metrics
 * @property {Array} recentSessions - List of recent individual training sessions
 *
 * @example
 * ```typescript
 * const trainingData: TrainingSummaryWidgetData = {
 *   weeklySummary: {
 *     sessionsCompleted: 5,
 *     totalDuration: "450 mins",
 *     avgIntensity: 7.8
 *   },
 *   recentSessions: [
 *     { name: "Interval Sprints", duration: "45 mins", intensity: 8 }
 *   ]
 * }
 * ```
 */
export interface TrainingSummaryWidgetData {
  /** Summary of weekly training metrics */
  weeklySummary: {
    /** Number of completed training sessions */
    sessionsCompleted: number
    /** Total training duration as a formatted string */
    totalDuration: string
    /** Average intensity score (typically 1-10 scale) */
    avgIntensity: number
  }
  /** Recent individual training sessions */
  recentSessions: Array<{
    /** Training session name/type */
    name: string
    /** Session duration as a formatted string */
    duration: string
    /** Intensity score for this session (typically 1-10 scale) */
    intensity: number
  }>
}

/**
 * Union type for all possible widget data payloads.
 *
 * This type ensures type safety when handling different widget data structures.
 * The `null` option represents a widget with no data (loading state or error).
 *
 * @see {@link CalendarWidgetData}
 * @see {@link MatchStatsWidgetData}
 * @see {@link TrainingSummaryWidgetData}
 */
export type WidgetData =
  | CalendarWidgetData
  | MatchStatsWidgetData
  | TrainingSummaryWidgetData
  | null

/**
 * Tool result data structure returned by AI SDK tool execution.
 *
 * This interface defines the structure that AI SDK tools must return when
 * they want to display a widget in the chat interface. The result is extracted
 * from the tool's `output` property in the message parts array.
 *
 * **Important**: This structure must match the return type of tool `execute`
 * functions in the API route (`app/api/chat/route.ts`).
 *
 * @property {WidgetType} widgetType - Type of widget to render
 * @property {WidgetData} widgetData - Data payload for the widget
 * @property {string} [displayText] - Optional text to display in the chat message
 *
 * @example
 * ```typescript
 * // In API route tool definition:
 * execute: async () => {
 *   return {
 *     widgetType: "calendar",
 *     widgetData: { events: [...] },
 *     displayText: "Here is your schedule for the next 14 days."
 *   }
 * }
 * ```
 *
 * @see {@link https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling|AI SDK Tool Calling}
 */
export interface WidgetToolResult {
  widgetType: WidgetType
  widgetData: WidgetData
  displayText?: string
}
