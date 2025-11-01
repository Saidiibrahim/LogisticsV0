"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { requirePermission, type UserRole } from "@/lib/auth/permissions"
import { createClient } from "@/lib/supabase/server"
import type { EventResolutionType, EventStatus } from "@/lib/types/calendar"
import { getErrorMessage } from "@/lib/utils/errors"

/**
 * Minimal state object shared across our form actions so we can surface errors
 * in the client without bolting on additional client state.
 */
interface ActionState {
  error?: string
  success?: boolean
}

interface UserProfile {
  organizationId: string
  role: UserRole
}

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from("users")
    .select("organization_id, role")
    .eq("id", userId)
    .single()

  if (error || !data) {
    console.error("[calendar] Error fetching user profile:", error)
    return null
  }

  if (!data.organization_id) {
    console.error("[calendar] Missing organization for user:", userId)
    return null
  }

  const role = (
    typeof data.role === "string" ? data.role : "driver"
  ) as UserRole

  return {
    organizationId: data.organization_id,
    role,
  }
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

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: "Could not determine your organization." }
  }

  const permissionCheck = requirePermission(profile.role, "events.create")
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
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
  const assignedDriverId =
    formData.get("assigned_driver_id")?.toString().trim() ?? ""

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
    organization_id: profile.organizationId,
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
    assigned_driver_id:
      assignedDriverId && assignedDriverId !== "unassigned"
        ? assignedDriverId
        : null,
  })

  if (error) {
    console.error("[calendar] Error creating event:", getErrorMessage(error))
    return { error: "Failed to create event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

// ============================================================================
// UPDATE ACTIONS
// ============================================================================

/**
 * Update a calendar event in the calendar_events table.
 */
export async function updateCalendarEvent(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to update an event." }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: "Could not determine your organization." }
  }

  const permissionCheck = requirePermission(profile.role, "events.edit.any")
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
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
  const assignedDriverId =
    formData.get("assigned_driver_id")?.toString().trim() ?? ""

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

  const { error } = await supabase
    .from("calendar_events")
    .update({
      title,
      event_type: eventType,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
      day_date: dayDate.toISOString().split("T")[0],
      location_name: locationName || null,
      location_address: locationAddress || null,
      description: description || null,
      priority: priority as "low" | "medium" | "high" | "urgent",
      assigned_driver_id:
        assignedDriverId && assignedDriverId !== "unassigned"
          ? assignedDriverId
          : null,
    })
    .eq("id", eventId)
    .eq("organization_id", profile.organizationId)

  if (error) {
    console.error("[calendar] Error updating event:", getErrorMessage(error))
    return { error: "Failed to update event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

/**
 * Quick update event status action for rapid state changes
 */
export interface UpdateEventStatusOptions {
  resolutionType?: EventResolutionType
  resolutionNotes?: string
}

export async function updateEventStatus(
  eventId: string,
  newStatus: EventStatus,
  options?: UpdateEventStatusOptions
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to update events." }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: "Could not determine your organization." }
  }

  const anyStatus = requirePermission(profile.role, "events.status.update.any")
  if (!anyStatus.allowed) {
    const ownStatus = requirePermission(
      profile.role,
      "events.status.update.own"
    )

    if (!ownStatus.allowed) {
      return { error: ownStatus.error }
    }

    const { data: eventRecord, error: eventError } = await supabase
      .from("calendar_events")
      .select("assigned_driver_id")
      .eq("id", eventId)
      .eq("organization_id", profile.organizationId)
      .single()

    if (eventError || !eventRecord) {
      console.error("[calendar] Error verifying event ownership:", eventError)
      return {
        error: "Could not verify event assignment for this update.",
      }
    }

    if (eventRecord.assigned_driver_id !== user.id) {
      return {
        error: "You can only update the status for events assigned to you.",
      }
    }
  }

  const isTerminal = newStatus === "completed" || newStatus === "cancelled"
  if (isTerminal && !options?.resolutionType) {
    return {
      error:
        "Please select a resolution type before marking this event as resolved.",
    }
  }

  const { error } = await supabase
    .from("calendar_events")
    .update({
      status: newStatus,
      resolution_type: isTerminal ? (options?.resolutionType ?? null) : null,
      resolution_notes: isTerminal
        ? options?.resolutionNotes?.trim() || null
        : null,
      resolved_at: isTerminal ? new Date().toISOString() : null,
    })
    .eq("id", eventId)
    .eq("organization_id", profile.organizationId)

  if (error) {
    console.error(
      "[calendar] Error updating event status:",
      getErrorMessage(error)
    )
    return { error: "Failed to update event status. Please try again." }
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

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: "Could not determine your organization." }
  }

  const permissionCheck = requirePermission(profile.role, "events.delete")
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  const { error } = await supabase
    .from("calendar_events")
    .delete()
    .eq("id", eventId)
    .eq("organization_id", profile.organizationId)

  if (error) {
    console.error("[calendar] Error deleting event:", getErrorMessage(error))
    return { error: "Failed to delete event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}
