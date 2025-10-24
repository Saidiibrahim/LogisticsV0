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

// ============================================================================
// MATCH ACTIONS
// ============================================================================

/**
 * Persist a scheduled match based on the calendar creation dialog submission.
 * The server action validates required fields, normalises dates, and triggers
 * a revalidation so the new event appears immediately.
 */
export async function createScheduledMatchFromCalendar(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a match." }
  }

  const homeTeamName = formData.get("home_team_name")?.toString().trim() ?? ""
  const awayTeamName = formData.get("away_team_name")?.toString().trim() ?? ""
  const kickoffAtRaw = formData.get("kickoff_at")?.toString().trim() ?? ""
  const competitionName =
    formData.get("competition_name")?.toString().trim() ?? ""
  const venueName = formData.get("venue_name")?.toString().trim() ?? ""
  const notes = formData.get("notes")?.toString().trim() ?? ""

  if (!homeTeamName || !awayTeamName || !kickoffAtRaw) {
    return {
      error: "Home team, away team, and kickoff time are required.",
    }
  }

  const kickoffDate = new Date(kickoffAtRaw)
  if (Number.isNaN(kickoffDate.getTime())) {
    return { error: "Kickoff time is invalid. Please select a valid date." }
  }

  const { error } = await supabase.from("scheduled_matches").insert({
    id: randomUUID(),
    owner_id: user.id,
    home_team_name: homeTeamName,
    away_team_name: awayTeamName,
    kickoff_at: kickoffDate.toISOString(),
    competition_name: competitionName || null,
    venue_name: venueName || null,
    notes: notes || null,
    status: "scheduled",
  })

  if (error) {
    console.error("[calendar] Error creating match:", getErrorMessage(error))
    return { error: "Failed to create match. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

// ============================================================================
// TRAINING SESSION ACTIONS
// ============================================================================

/**
 * Create a training session (workout) from the calendar dialog. Defaults the
 * end time to one hour after the start when the user leaves it blank.
 */
export async function createTrainingSession(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a training session." }
  }

  const title = formData.get("title")?.toString().trim() ?? ""
  const kind = formData.get("kind")?.toString().trim() ?? ""
  const startTimeRaw = formData.get("start_time")?.toString().trim() ?? ""
  const endTimeRaw = formData.get("end_time")?.toString().trim() ?? ""
  const notes = formData.get("notes")?.toString().trim() ?? ""

  if (!title || !kind || !startTimeRaw) {
    return {
      error: "Title, training type, and start time are required.",
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

  const { error } = await supabase.from("workout_sessions").insert({
    id: randomUUID(),
    owner_id: user.id,
    title,
    kind,
    started_at: startTime.toISOString(),
    ended_at: endTime.toISOString(),
    state: "planned",
    notes: notes || null,
  })

  if (error) {
    console.error(
      "[calendar] Error creating training session:",
      getErrorMessage(error)
    )
    return { error: "Failed to create training session. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

// ============================================================================
// COACHING SESSION ACTIONS
// ============================================================================

/**
 * Create a coaching session record. Validates that the end occurs after the
 * start and maps optional fields into nullable columns.
 */
export async function createCoachingSession(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to create a coaching session." }
  }

  const title = formData.get("title")?.toString().trim() ?? ""
  const sessionType = formData.get("session_type")?.toString().trim() ?? ""
  const startTimeRaw = formData.get("start_time")?.toString().trim() ?? ""
  const endTimeRaw = formData.get("end_time")?.toString().trim() ?? ""
  const location = formData.get("location")?.toString().trim() ?? ""
  const facilitator = formData.get("facilitator")?.toString().trim() ?? ""
  const maxAttendeesRaw = formData.get("max_attendees")?.toString().trim() ?? ""
  const notes = formData.get("notes")?.toString().trim() ?? ""

  if (!title || !sessionType || !startTimeRaw || !endTimeRaw) {
    return {
      error: "Title, session type, start time, and end time are required.",
    }
  }

  const startTime = new Date(startTimeRaw)
  const endTime = new Date(endTimeRaw)

  if (Number.isNaN(startTime.getTime()) || Number.isNaN(endTime.getTime())) {
    return { error: "Invalid date/time. Please select valid dates." }
  }

  if (endTime <= startTime) {
    return { error: "End time must be after start time." }
  }

  const maxAttendees = maxAttendeesRaw
    ? Number.parseInt(maxAttendeesRaw, 10)
    : null

  const { error } = await supabase.from("coaching_sessions").insert({
    owner_id: user.id,
    title,
    session_type: sessionType,
    start_time: startTime.toISOString(),
    end_time: endTime.toISOString(),
    location: location || null,
    facilitator: facilitator || null,
    max_attendees: maxAttendees,
    notes: notes || null,
  })

  if (error) {
    console.error(
      "[calendar] Error creating coaching session:",
      getErrorMessage(error)
    )
    return { error: "Failed to create coaching session. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}

// ============================================================================
// DELETE ACTIONS
// ============================================================================

/**
 * Delete any calendar event by routing the request to the appropriate table.
 * The action trusts the caller to provide a valid type and ID combination.
 */
export async function deleteEvent(
  eventType: "shift" | "training" | "coaching",
  eventId: string
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: "You must be logged in to delete events." }
  }

  let error = null

  switch (eventType) {
    case "shift": {
      // Delete shift from rosters or shifts table
      const { error: shiftError } = await supabase
        .from("rosters")
        .delete()
        .eq("id", eventId)
        .eq("owner_id", user.id)

      error = shiftError
      break
    }

    case "training": {
      const { error: trainingError } = await supabase
        .from("workout_sessions")
        .delete()
        .eq("id", eventId)
        .eq("owner_id", user.id)

      error = trainingError
      break
    }

    case "coaching": {
      const { error: coachingError } = await supabase
        .from("coaching_sessions")
        .delete()
        .eq("id", eventId)
        .eq("owner_id", user.id)

      error = coachingError
      break
    }
  }

  if (error) {
    console.error("[calendar] Error deleting event:", getErrorMessage(error))
    return { error: "Failed to delete event. Please try again." }
  }

  revalidatePath("/calendar")
  return { success: true }
}
