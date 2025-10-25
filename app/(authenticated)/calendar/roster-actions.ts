"use server"

import { randomUUID } from "node:crypto"
import { createClient } from "@/lib/supabase/server"
import { listActiveDrivers } from "@/lib/supabase/queries/drivers"
import { getRosterByWeek, upsertRosterWithAssignments } from "@/lib/supabase/queries/roster"
import type { Roster, RosterAssignment, RosterStatus } from "@/lib/types/roster"
import { sendRosterNotification, sendRosterChangeNotification } from "@/lib/actions/email-actions"

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

  // Send email notifications if roster is being published
  if (status === "published" || status === "modified") {
    try {
      // Get all drivers to match IDs with emails
      const drivers = await listActiveDrivers(supabase as any)
      const driverMap = new Map(drivers.map((d) => [d.id, d]))

      // Group assignments by driver
      const assignmentsByDriver = new Map<string, string[]>()
      for (const assignment of assignments) {
        const driverDates = assignmentsByDriver.get(assignment.driverId) || []
        driverDates.push(assignment.date)
        assignmentsByDriver.set(assignment.driverId, driverDates)
      }

      // Track assignments that were successfully notified
      const updatedAssignments: RosterAssignment[] = []
      const notificationTimestamp = new Date().toISOString()

      // Track notification results to surface in UI
      type Failure = {
        driverId: string
        driverEmail?: string
        driverName?: string
        message: string
        dates: string[]
      }
      const failures: Failure[] = []
      let sentCount = 0

      // Send notifications to each driver
      for (const [driverId, dates] of assignmentsByDriver.entries()) {
        const driver = driverMap.get(driverId)
        if (!driver || !driver.email) {
          console.warn(`[roster] Driver ${driverId} has no email, skipping notification`)
          // Add assignments without notification timestamp
          for (const date of dates) {
            updatedAssignments.push({ date, driverId })
          }
          continue
        }

        // Determine if this is a change notification or new notification
        const existingAssignment = existing?.assignments.find(
          (a) => a.driverId === driverId && dates.includes(a.date)
        )
        const isChange = existing?.status === "published" && status === "modified"

        let notificationResult
        if (isChange) {
          // Send change notification for modified rosters
          notificationResult = await sendRosterChangeNotification(
            driver.email,
            driver.name,
            dates,
            weekStartISO
          )
        } else {
          // Send standard notification for new published rosters
          notificationResult = await sendRosterNotification(
            driver.email,
            driver.name,
            dates,
            weekStartISO
          )
        }

        if (notificationResult.success) {
          // Add assignments with notification data
          for (const date of dates) {
            updatedAssignments.push({
              date,
              driverId,
              notifiedAt: notificationTimestamp,
              notificationId: notificationResult.notificationId,
            })
          }
          console.log(`[roster] Sent ${isChange ? "change" : ""} notification to ${driver.email}`)
          sentCount += 1
        } else {
          console.error(`[roster] Failed to send notification to ${driver.email}:`, notificationResult.error)
          // Add assignments without notification timestamp (keep trying next time)
          for (const date of dates) {
            updatedAssignments.push({ date, driverId })
          }
          failures.push({
            driverId,
            driverEmail: driver.email,
            driverName: driver.name,
            message: notificationResult.error ?? "Unknown error",
            dates,
          })
        }
      }

      // Update roster with notification timestamps if any were sent successfully
      if (updatedAssignments.some((a) => a.notifiedAt)) {
        const updatedRoster: Omit<Roster, "id"> & { id?: string } = {
          ...next,
          id: saved.id,
          assignments: updatedAssignments,
        }
        const finalRoster = await upsertRosterWithAssignments(supabase as any, updatedRoster)
        if (finalRoster) {
          const notifications = {
            totalDrivers: assignmentsByDriver.size,
            sent: sentCount,
            failed: failures.length,
            failures,
          }
          return { success: true, roster: finalRoster, data: { notifications } }
        }
      }

      // If we reach here, either no notifications were sent successfully, or roster didn't need a second update
      const notifications = {
        totalDrivers: assignmentsByDriver.size,
        sent: sentCount,
        failed: failures.length,
        failures,
      }
      return { success: true, roster: saved, data: { notifications } }
    } catch (error) {
      console.error("[roster] Error sending email notifications:", error)
      // Don't fail the whole operation if emails fail - roster was already saved
      return { success: true, roster: saved, data: { notifications: { totalDrivers: 0, sent: 0, failed: 0, failures: [] } } }
    }
  }

  return { success: true, roster: saved }
}


