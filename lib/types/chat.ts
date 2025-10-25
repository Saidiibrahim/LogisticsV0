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
 * - `calendar`: Displays upcoming deliveries, pickups, and scheduled events
 * - `driver-performance`: Displays driver performance metrics and recent delivery history
 * - `performance-chart`: Renders performance trends and analytics (future)
 *
 * @see {@link WidgetConfig} for widget configuration structure
 */
export type WidgetType =
  | "calendar"
  | "driver-performance"
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
 * Contains an array of upcoming events including deliveries, pickups,
 * and scheduled events. Events are typically filtered by date range
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
 *       title: "Downtown Site Delivery",
 *       type: "delivery",
 *       date: "2025-10-15T00:00:00Z",
 *       time: "08:00",
 *       location: "Downtown Depot"
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
    type: "delivery" | "pickup"
    /** ISO date string */
    date: string
    /** Time in HH:MM format */
    time: string
    /** Optional venue/location */
    location?: string
  }>
}


/**
 * Driver performance widget data structure.
 *
 * Displays driver performance summary including completed deliveries,
 * total hours worked, on-time delivery rate, and details of recent deliveries.
 *
 * @property {Object} weeklySummary - Aggregated weekly performance metrics
 * @property {Array} recentDeliveries - List of recent individual deliveries
 *
 * @example
 * ```typescript
 * const performanceData: DriverPerformanceWidgetData = {
 *   weeklySummary: {
 *     deliveriesCompleted: 24,
 *     totalHours: "32h 15m",
 *     onTimeRate: 91.7
 *   },
 *   recentDeliveries: [
 *     { siteName: "Downtown Depot", completedAt: "2h ago", status: "delivered" }
 *   ]
 * }
 * ```
 */
export interface DriverPerformanceWidgetData {
  /** Summary of weekly performance metrics */
  weeklySummary: {
    /** Number of completed deliveries */
    deliveriesCompleted: number
    /** Total hours worked as a formatted string */
    totalHours: string
    /** On-time delivery rate as a percentage (0-100) */
    onTimeRate: number
  }
  /** Recent individual deliveries */
  recentDeliveries: Array<{
    /** Delivery site name */
    siteName: string
    /** When the delivery was completed (formatted time ago) */
    completedAt: string
    /** Delivery status */
    status: "delivered" | "failed"
  }>
}

/**
 * Union type for all possible widget data payloads.
 *
 * This type ensures type safety when handling different widget data structures.
 * The `null` option represents a widget with no data (loading state or error).
 *
 * @see {@link CalendarWidgetData}
 * @see {@link DriverPerformanceWidgetData}
 */
export type WidgetData =
  | CalendarWidgetData
  | DriverPerformanceWidgetData
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
