import type { CalendarEvent } from "@/lib/types/calendar"

/**
 * Creates a test calendar event with default values.
 * Override any fields by passing them in the partial object.
 */
export function createMatchEvent(
  partial: Partial<CalendarEvent> = {}
): CalendarEvent {
  const now = new Date("2024-01-01T09:00:00")
  return {
    id: "test-event-1",
    type: "delivery",
    title: "Test Event",
    start_time: now,
    end_time: new Date("2024-01-01T10:00:00"),
    status: "scheduled",
    priority: "medium",
    day_date: now,
    sequence_number: 1,
    organization_id: "test-org",
    created_by: "test-user",
    created_at: now,
    updated_at: now,
    ...partial,
  }
}
