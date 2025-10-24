"use server"

import { randomUUID } from "node:crypto"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

import { createClient } from "@/lib/supabase/server"
import type { CreateScheduledMatchInput } from "@/lib/types/matches"
import { getErrorMessage } from "@/lib/utils/errors"

interface ActionState {
  error?: string
}

export async function createScheduledMatch(
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
  const homeTeamId = formData.get("home_team_id")?.toString().trim() ?? ""
  const awayTeamId = formData.get("away_team_id")?.toString().trim() ?? ""
  const competitionId = formData.get("competition_id")?.toString().trim() ?? ""
  const venueId = formData.get("venue_id")?.toString().trim() ?? ""
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

  if (kickoffDate <= new Date()) {
    return { error: "Kickoff time must be in the future." }
  }

  const scheduledMatchId = randomUUID()

  const matchData: CreateScheduledMatchInput & {
    owner_id: string
    status: "scheduled"
  } = {
    owner_id: user.id,
    home_team_id: homeTeamId || undefined,
    home_team_name: homeTeamName,
    away_team_id: awayTeamId || undefined,
    away_team_name: awayTeamName,
    kickoff_at: kickoffDate.toISOString(),
    competition_id: competitionId || undefined,
    competition_name: competitionName || undefined,
    venue_id: venueId || undefined,
    venue_name: venueName || undefined,
    notes: notes || undefined,
    status: "scheduled",
  }

  const { error } = await supabase.from("scheduled_matches").insert({
    id: scheduledMatchId,
    owner_id: matchData.owner_id,
    home_team_id: matchData.home_team_id ?? null,
    home_team_name: matchData.home_team_name,
    away_team_id: matchData.away_team_id ?? null,
    away_team_name: matchData.away_team_name,
    kickoff_at: matchData.kickoff_at,
    competition_id: matchData.competition_id ?? null,
    competition_name: matchData.competition_name ?? null,
    venue_id: matchData.venue_id ?? null,
    venue_name: matchData.venue_name ?? null,
    notes: matchData.notes ?? null,
    status: matchData.status,
  })

  if (error) {
    console.error(
      "[matches] Error creating scheduled match:",
      getErrorMessage(error),
      error
    )
    return { error: "Failed to create match. Please try again." }
  }

  revalidatePath("/matches")
  redirect("/matches")
}
