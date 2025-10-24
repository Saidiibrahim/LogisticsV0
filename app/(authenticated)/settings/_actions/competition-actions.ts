"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
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
 * Fetch all competitions that belong to the currently authenticated user.
 */
export async function getCompetitions(): Promise<Competition[]> {
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
    throw new Error("You must be logged in to view competitions.")
  }

  const { data, error } = await supabase
    .from("competitions")
    .select("*")
    .eq("owner_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    console.error(
      "[settings] Failed to load competitions:",
      getErrorMessage(error)
    )
    throw new Error("Failed to load competitions. Please try again.")
  }

  return (data ?? []) as Competition[]
}

/**
 * Create a new competition within the user's library.
 */
export async function createCompetition(
  competitionData: CreateCompetitionInput
): Promise<Competition> {
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
    throw new Error("You must be logged in to create a competition.")
  }

  const name = competitionData.name?.trim()

  if (!name) {
    throw new Error("Competition name is required.")
  }

  const { data, error } = await supabase
    .from("competitions")
    .insert({
      owner_id: user.id,
      name,
      level: normaliseNullable(competitionData.level),
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error(
      "[settings] Failed to create competition:",
      getErrorMessage(error)
    )
    throw new Error("Failed to create competition. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Competition
}

/**
 * Update an existing competition in the user's library.
 */
export async function updateCompetition(
  competitionId: string,
  updates: UpdateCompetitionInput
): Promise<Competition> {
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
    throw new Error("You must be logged in to update a competition.")
  }

  const payload: Record<string, string | null> = {}

  if (Object.hasOwn(updates, "name")) {
    const name = updates.name?.trim()
    if (!name) {
      throw new Error("Competition name is required.")
    }
    payload.name = name
  }

  if (Object.hasOwn(updates, "level")) {
    payload.level = normaliseNullable(updates.level)
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nothing to update. Please modify at least one field.")
  }

  const { data, error } = await supabase
    .from("competitions")
    .update(payload)
    .eq("id", competitionId)
    .eq("owner_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    console.error(
      "[settings] Failed to update competition:",
      getErrorMessage(error)
    )
    throw new Error("Failed to update competition. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Competition
}

/**
 * Delete a competition from the user's library.
 */
export async function deleteCompetition(competitionId: string): Promise<void> {
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
    throw new Error("You must be logged in to delete a competition.")
  }

  const { error } = await supabase
    .from("competitions")
    .delete()
    .eq("id", competitionId)
    .eq("owner_id", user.id)

  if (error) {
    console.error(
      "[settings] Failed to delete competition:",
      getErrorMessage(error)
    )
    throw new Error("Failed to delete competition. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
}
