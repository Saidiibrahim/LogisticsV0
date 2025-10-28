import type { SupabaseClient } from "@supabase/supabase-js"
import type { Roster } from "@/lib/types/roster"

type RosterAssignmentRow = {
  date: string
  driverId: string
  previousDriverId?: string | null
  notifiedAt?: string | null
  notificationId?: string | null
}

/**
 * Fetch a roster by week start date from the roster_assignments table.
 * Groups all assignments for a given week_start_date.
 */
export async function getRosterByWeek(
  client: SupabaseClient,
  weekStartISO: string
): Promise<Roster | null> {
  const { data, error } = await client
    .from("roster_assignments")
    .select("id, status, version, week_start_date, assignments")
    .eq("week_start_date", weekStartISO)
    .maybeSingle()

  if (error) {
    console.error("[roster] getRosterByWeek error", error)
    return null
  }

  if (!data) return null

  // Parse assignments from JSONB
  const assignmentsArray = Array.isArray(data.assignments)
    ? (data.assignments as RosterAssignmentRow[])
    : []

  return {
    id: data.id,
    weekStart: data.week_start_date,
    status: data.status,
    version: data.version,
    assignments: assignmentsArray.map((a) => ({
      date: a.date,
      driverId: a.driverId,
      previousDriverId: a.previousDriverId ?? undefined,
      notifiedAt: a.notifiedAt ?? undefined,
      notificationId: a.notificationId ?? undefined,
    })),
  }
}

/**
 * Upsert a roster with assignments in the roster_assignments table.
 * Uses the JSONB assignments column to store all driver assignments.
 * The upsert is keyed by (organization_id, week_start_date) unique constraint.
 */
export async function upsertRosterWithAssignments(
  client: SupabaseClient,
  roster: Omit<Roster, "id"> & { id?: string }
): Promise<Roster | null> {
  // Get current user for organization context
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user) {
    console.error("[roster] No authenticated user")
    return null
  }

  // Get user's organization_id
  const { data: userData, error: userError } = await client
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (userError || !userData?.organization_id) {
    console.error("[roster] Failed to get organization_id", userError)
    return null
  }

  // Prepare assignments JSONB array
  const assignmentsJson = roster.assignments.map((a) => ({
    date: a.date,
    driverId: a.driverId,
    previousDriverId: a.previousDriverId ?? null,
    notifiedAt: a.notifiedAt ?? null,
    notificationId: a.notificationId ?? null,
  }))

  const { data: rosterRow, error: rosterError } = await client
    .from("roster_assignments")
    .upsert(
      {
        id: roster.id,
        organization_id: userData.organization_id,
        week_start_date: roster.weekStart,
        status: roster.status,
        version: roster.version,
        assignments: assignmentsJson,
        last_modified_by: user.id,
        last_modified_at: new Date().toISOString(),
        ...(roster.status === "published" && {
          published_at: new Date().toISOString(),
          published_by: user.id,
        }),
      },
      { onConflict: "organization_id,week_start_date" }
    )
    .select("id, status, version, week_start_date, assignments")
    .single()

  if (rosterError) {
    console.error("[roster] upsert roster error", rosterError)
    return null
  }

  const assignmentsArray = Array.isArray(rosterRow.assignments)
    ? (rosterRow.assignments as RosterAssignmentRow[])
    : []

  return {
    id: rosterRow.id,
    status: rosterRow.status,
    version: rosterRow.version,
    weekStart: rosterRow.week_start_date,
    assignments: assignmentsArray.map((a) => ({
      date: a.date,
      driverId: a.driverId,
      previousDriverId: a.previousDriverId ?? undefined,
      notifiedAt: a.notifiedAt ?? undefined,
      notificationId: a.notificationId ?? undefined,
    })),
  }
}
