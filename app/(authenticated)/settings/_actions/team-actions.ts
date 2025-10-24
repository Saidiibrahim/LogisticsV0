"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "@/lib/types/library"
import { getErrorMessage } from "@/lib/utils/errors"

const SETTINGS_PATH = "/settings"

function normaliseNullable(value?: string | null): string | null {
  if (typeof value !== "string") {
    return value ?? null
  }
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/**
 * Fetch all teams that belong to the currently authenticated user.
 */
export async function getTeams(): Promise<Team[]> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[settings] Failed to resolve user:", authError)
    throw new Error("Unable to resolve authenticated user.")
  }

  if (!user) {
    throw new Error("You must be logged in to view teams.")
  }

  const { data, error } = await supabase
    .from("teams")
    .select("*")
    .eq("owner_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    console.error("[settings] Failed to load teams:", getErrorMessage(error))
    throw new Error("Failed to load teams. Please try again.")
  }

  return (data ?? []) as Team[]
}

/**
 * Create a new team within the user's library.
 */
export async function createTeam(teamData: CreateTeamInput): Promise<Team> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[settings] Failed to resolve user:", authError)
    throw new Error("Unable to resolve authenticated user.")
  }

  if (!user) {
    throw new Error("You must be logged in to create a team.")
  }

  const name = teamData.name?.trim()

  if (!name) {
    throw new Error("Team name is required.")
  }

  const { data, error } = await supabase
    .from("teams")
    .insert({
      owner_id: user.id,
      name,
      short_name: normaliseNullable(teamData.short_name),
      division: normaliseNullable(teamData.division),
      color_primary: normaliseNullable(teamData.color_primary),
      color_secondary: normaliseNullable(teamData.color_secondary),
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error("[settings] Failed to create team:", getErrorMessage(error))
    throw new Error("Failed to create team. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Team
}

/**
 * Update an existing team in the user's library.
 */
export async function updateTeam(
  teamId: string,
  updates: UpdateTeamInput
): Promise<Team> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[settings] Failed to resolve user:", authError)
    throw new Error("Unable to resolve authenticated user.")
  }

  if (!user) {
    throw new Error("You must be logged in to update a team.")
  }

  const payload: Record<string, string | null> = {}

  if (Object.hasOwn(updates, "name")) {
    const name = updates.name?.trim()
    if (!name) {
      throw new Error("Team name is required.")
    }
    payload.name = name
  }

  if (Object.hasOwn(updates, "short_name")) {
    payload.short_name = normaliseNullable(updates.short_name)
  }

  if (Object.hasOwn(updates, "division")) {
    payload.division = normaliseNullable(updates.division)
  }

  if (Object.hasOwn(updates, "color_primary")) {
    payload.color_primary = normaliseNullable(updates.color_primary)
  }

  if (Object.hasOwn(updates, "color_secondary")) {
    payload.color_secondary = normaliseNullable(updates.color_secondary)
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nothing to update. Please modify at least one field.")
  }

  const { data, error } = await supabase
    .from("teams")
    .update(payload)
    .eq("id", teamId)
    .eq("owner_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[settings] Failed to update team:", getErrorMessage(error))
    throw new Error("Failed to update team. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Team
}

/**
 * Delete a team from the user's library.
 */
export async function deleteTeam(teamId: string): Promise<void> {
  const supabase = await createClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError) {
    console.error("[settings] Failed to resolve user:", authError)
    throw new Error("Unable to resolve authenticated user.")
  }

  if (!user) {
    throw new Error("You must be logged in to delete a team.")
  }

  const { error } = await supabase
    .from("teams")
    .delete()
    .eq("id", teamId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("[settings] Failed to delete team:", getErrorMessage(error))
    throw new Error("Failed to delete team. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
}
