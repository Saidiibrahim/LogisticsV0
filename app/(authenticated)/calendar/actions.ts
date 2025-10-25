"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import { getErrorMessage } from "@/lib/utils/errors"

/**
 * Minimal state object shared across our form actions so we can surface errors
 * in the client without bolting on additional client state.
 */
interface ActionState {
  error?: string
  success?: boolean
}

/**
 * Get the user's organization ID from their profile.
 */
async function getUserOrganizationId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<string | null> {
  const { data, error } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", userId)
    .single()

  if (error || !data) {
    console.error("[calendar] Error fetching user organization:", error)
    return null
  }

  return data.organization_id
}

// ============================================================================
// CALENDAR EVENT ACTIONS
// ============================================================================

/**
 * Create a calendar event in the calendar_events table.
 * Supports delivery, pickup, meeting, and other logistics event types.
 */
export async function createCalendarEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create an event." }
  }

  const organizationId = await getUserOrganizationId(supabase, user.id)
  if (!organizationId) {
    return { error: "Could not determine your organization." }
  }

  const title = formData.get("title")?.toString().trim() ?? ""
  const eventType = formData.get("event_type")?.toString().trim() ?? ""
  const startTimeRaw = formData.get("start_time")?.toString().trim() ?? ""
  const endTimeRaw = formData.get("end_time")?.toString().trim() ?? ""
  const locationName = formData.get("location_name")?.toString().trim() ?? ""
  const locationAddress =
    formData.get("location_address")?.toString().trim() ?? ""
  const description = formData.get("description")?.toString().trim() ?? ""
  const priority = formData.get("priority")?.toString().trim() ?? "medium"

  if (!title || !eventType || !startTimeRaw) {
    return {
      error: "Title, event type, and start time are required.",
    }
  }

  const startTime = new Date(startTimeRaw)
  if (Number.isNaN(startTime.getTime())) {
    return { error: "Start time is invalid. Please select a valid date." }
  }

  // Default end time to 1 hour after start if not provided
  let endTime = endTimeRaw
    ? new Date(endTimeRaw)
    : new Date(startTime.getTime() + 60 * 60 * 1000)

  if (Number.isNaN(endTime.getTime())) {
    endTime = new Date(startTime.getTime() + 60 * 60 * 1000)
  }

  if (endTime <= startTime) {
    return { error: "End time must be after start time." }
  }

  // Extract day date (without time) for grouping
  const dayDate = new Date(startTime)
  dayDate.setHours(0, 0, 0, 0)

  const { error } = await supabase.from("calendar_events").insert({
    id: randomUUID(),
    organization_id: organizationId,
    created_by: user.id,
    title,
    event_type: eventType,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    day_date: dayDate.toISOString().split("T")[0],
    location_name: locationName || null,
    location_address: locationAddress || null,
    description: description || null,
    priority: priority as "low" | "medium" | "high" | "urgent",
    status: "scheduled",
    sequence_number: 1,
  })

  if (error) {
    console.error("[calendar] Error creating event:", getErrorMessage(error))
    return { error: "Failed to create event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

// ============================================================================
// DELETE ACTIONS
// ============================================================================

/**
 * Delete a calendar event from the calendar_events table.
 */
export async function deleteEvent(eventId: string): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to delete events." }
  }

  const organizationId = await getUserOrganizationId(supabase, user.id)
  if (!organizationId) {
    return { error: "Could not determine your organization." }
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("organization_id", organizationId)

  if (error) {
    console.error("[calendar] Error deleting event:", getErrorMessage(error))
    return { error: "Failed to delete event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}
