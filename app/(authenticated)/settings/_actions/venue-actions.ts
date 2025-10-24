"use server"

import { revalidatePath } from "next/cache"
import { createClient } from "@/lib/supabase/server"
import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
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

function normaliseNumber(value?: number | string | null): number | null {
  if (value === undefined || value === null) {
    return null
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null
  }

  const trimmed = value.trim()
  if (!trimmed) {
    return null
  }

  const asNumber = Number.parseFloat(trimmed)
  return Number.isFinite(asNumber) ? asNumber : null
}

/**
 * Fetch all venues that belong to the currently authenticated user.
 */
export async function getVenues(): Promise<Venue[]> {
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
    throw new Error("You must be logged in to view venues.")
  }

  const { data, error } = await supabase
    .from("venues")
    .select("*")
    .eq("owner_id", user.id)
    .order("name", { ascending: true })

  if (error) {
    console.error("[settings] Failed to load venues:", getErrorMessage(error))
    throw new Error("Failed to load venues. Please try again.")
  }

  return (data ?? []) as Venue[]
}

/**
 * Create a new venue within the user's library.
 */
export async function createVenue(venueData: CreateVenueInput): Promise<Venue> {
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
    throw new Error("You must be logged in to create a venue.")
  }

  const name = venueData.name?.trim()

  if (!name) {
    throw new Error("Venue name is required.")
  }

  const { data, error } = await supabase
    .from("venues")
    .insert({
      owner_id: user.id,
      name,
      city: normaliseNullable(venueData.city),
      country: normaliseNullable(venueData.country),
      latitude: normaliseNumber(venueData.latitude),
      longitude: normaliseNumber(venueData.longitude),
    })
    .select("*")
    .single()

  if (error || !data) {
    console.error("[settings] Failed to create venue:", getErrorMessage(error))
    throw new Error("Failed to create venue. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Venue
}

/**
 * Update an existing venue in the user's library.
 */
export async function updateVenue(
  venueId: string,
  updates: UpdateVenueInput
): Promise<Venue> {
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
    throw new Error("You must be logged in to update a venue.")
  }

  const payload: Record<string, string | number | null> = {}

  if (Object.hasOwn(updates, "name")) {
    const name = updates.name?.trim()
    if (!name) {
      throw new Error("Venue name is required.")
    }
    payload.name = name
  }

  if (Object.hasOwn(updates, "city")) {
    payload.city = normaliseNullable(updates.city)
  }

  if (Object.hasOwn(updates, "country")) {
    payload.country = normaliseNullable(updates.country)
  }

  if (Object.hasOwn(updates, "latitude")) {
    payload.latitude = normaliseNumber(updates.latitude)
  }

  if (Object.hasOwn(updates, "longitude")) {
    payload.longitude = normaliseNumber(updates.longitude)
  }

  if (Object.keys(payload).length === 0) {
    throw new Error("Nothing to update. Please modify at least one field.")
  }

  const { data, error } = await supabase
    .from("venues")
    .update(payload)
    .eq("id", venueId)
    .eq("owner_id", user.id)
    .select("*")
    .single()

  if (error || !data) {
    console.error("[settings] Failed to update venue:", getErrorMessage(error))
    throw new Error("Failed to update venue. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
  return data as Venue
}

/**
 * Delete a venue from the user's library.
 */
export async function deleteVenue(venueId: string): Promise<void> {
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
    throw new Error("You must be logged in to delete a venue.")
  }

  const { error } = await supabase
    .from("venues")
    .delete()
    .eq("id", venueId)
    .eq("owner_id", user.id)

  if (error) {
    console.error("[settings] Failed to delete venue:", getErrorMessage(error))
    throw new Error("Failed to delete venue. Please try again.")
  }

  revalidatePath(SETTINGS_PATH)
}
