"use server"

import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { listActiveDrivers } from "@/lib/supabase/queries/drivers"
import { getRosterByWeek, upsertRosterWithAssignments } from "@/lib/supabase/queries/roster"
import type { Roster, RosterAssignment, RosterStatus } from "@/lib/types/roster"

interface ActionState<T = unknown> {
  success: boolean
  error?: string
  roster?: Roster
  drivers?: any[]
  data?: T
}

export async function loadRosterForWeek(weekStartISO: string): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  const [drivers, roster] = await Promise.all([
    listActiveDrivers(supabase as any),
    getRosterByWeek(supabase as any, weekStartISO),
  ])

  const finalRoster: Roster =
    roster ?? {
      id: randomUUID(),
      weekStart: weekStartISO,
      status: "draft",
      version: 1,
      assignments: [],
    }

  return { success: true, drivers, roster: finalRoster }
}

/**
 * Save a roster with assignments. Supports empty drafts.
 * @param weekStartISO - ISO date string for the week start (Monday)
 * @param status - Roster status (draft/published/modified)
 * @param assignments - Array of roster assignments
 * @param rosterId - Optional existing roster ID
 */
export async function saveRoster(
  weekStartISO: string,
  status: RosterStatus,
  assignments: RosterAssignment[],
  rosterId?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: "Not authenticated" }

  // Support empty drafts - no need to reject
  const existing = await getRosterByWeek(supabase as any, weekStartISO)
  const next: Omit<Roster, "id"> & { id?: string } = {
    id: rosterId ?? existing?.id,
    weekStart: weekStartISO,
    status,
    version: existing ? existing.version + 1 : 1,
    assignments,
  }
  const saved = await upsertRosterWithAssignments(supabase as any, next)
  if (!saved) return { success: false, error: "Failed to save roster" }
  return { success: true, roster: saved }
}


