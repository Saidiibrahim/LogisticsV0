"use server"

import { createClient } from "@/lib/supabase/server"
import type {
  DashboardData,
  DashboardQuickStats,
  DashboardRecentRoster,
  DashboardUpcomingShift,
  GetDashboardDataOptions,
} from "@/lib/types/dashboard"
import { getErrorMessage } from "@/lib/utils/errors"
import { addDays, format, startOfWeek } from "date-fns"

const DEFAULT_UPCOMING_LIMIT = 10
const DEFAULT_RECENT_LIMIT = 5

/**
 * Get the start of the current week (Monday).
 */
function getCurrentWeekStart(): string {
  const now = new Date()
  const weekStart = startOfWeek(now, { weekStartsOn: 1 })
  return format(weekStart, "yyyy-MM-dd")
}

/**
 * Fetch comprehensive dashboard data including quick stats,
 * upcoming driver shifts, and recent roster activity.
 *
 * @param options - Configuration for data fetching.
 * @returns Dashboard data or error.
 */
export async function getDashboardData(
  options: GetDashboardDataOptions = {}
): Promise<{ data: DashboardData | null; error: string | null }> {
  const upcomingLimit = options.upcomingLimit ?? DEFAULT_UPCOMING_LIMIT
  const recentLimit = options.recentLimit ?? DEFAULT_RECENT_LIMIT

  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[dashboard] Auth error:", getErrorMessage(authError))
      return { data: null, error: "Authentication error" }
    }

    if (!user) {
      return { data: null, error: "Unauthorized" }
    }

    console.log("[dashboard] Fetching logistics dashboard data", {
      userId: user.id,
      upcomingLimit,
      recentLimit,
    })

    const weekStart = getCurrentWeekStart()
    const today = format(new Date(), "yyyy-MM-dd")

    // Get user's organization for filtering
    const { data: userData, error: userDataError } = await supabase
      .from("users")
      .select("organization_id")
      .eq("id", user.id)
      .single()

    if (userDataError || !userData?.organization_id) {
      console.error("[dashboard] Failed to get organization", userDataError)
      return { data: null, error: "Failed to load user organization" }
    }

    const orgId = userData.organization_id

    // Fetch quick stats
    const [activeDriversResult, vehiclesResult, weekRosterResult] =
      await Promise.all([
        supabase
          .from("users")
          .select("id", { count: "exact", head: true })
          .eq("role", "driver")
          .eq("is_active", true)
          .eq("organization_id", orgId),
        supabase
          .from("vehicles")
          .select("id", { count: "exact", head: true })
          .eq("organization_id", orgId),
        supabase
          .from("roster_assignments")
          .select("id, week_start_date, assignments")
          .eq("organization_id", orgId)
          .gte("week_start_date", weekStart)
          .limit(10),
      ])

    if (activeDriversResult.error) {
      console.error("[dashboard] activeDrivers error:", activeDriversResult.error)
      return { data: null, error: "Failed to load dashboard data" }
    }

    if (vehiclesResult.error) {
      console.error("[dashboard] vehicles error:", vehiclesResult.error)
      return { data: null, error: "Failed to load dashboard data" }
    }

    if (weekRosterResult.error) {
      console.error("[dashboard] weekRoster error:", weekRosterResult.error)
      return { data: null, error: "Failed to load dashboard data" }
    }

    const activeDrivers = activeDriversResult.count ?? 0
    const totalVehicles = vehiclesResult.count ?? 0

    // Count total assignments for this week across all rosters
    let scheduledShiftsThisWeek = 0
    for (const roster of weekRosterResult.data ?? []) {
      const assignments = Array.isArray(roster.assignments) ? roster.assignments : []
      scheduledShiftsThisWeek += assignments.length
    }

    const quickStats: DashboardQuickStats = {
      activeDrivers,
      scheduledShiftsThisWeek,
      totalVehicles,
      upcomingRosters: weekRosterResult.data?.length ?? 0,
    }

    // Fetch upcoming shifts for next few days from roster assignments
    const nextWeekEnd = format(addDays(new Date(), 7), "yyyy-MM-dd")

    const { data: upcomingRostersData, error: upcomingError } = await supabase
      .from("roster_assignments")
      .select("week_start_date, assignments")
      .eq("organization_id", orgId)
      .gte("week_start_date", weekStart)
      .lte("week_start_date", nextWeekEnd)
      .order("week_start_date", { ascending: true })

    if (upcomingError) {
      console.error("[dashboard] upcomingShifts error:", upcomingError)
    }

    // Flatten assignments and filter for upcoming dates
    const upcomingShifts: DashboardUpcomingShift[] = []
    for (const roster of upcomingRostersData ?? []) {
      const assignments = Array.isArray(roster.assignments) ? roster.assignments : []
      for (const assignment of assignments) {
        if (assignment.date >= today && upcomingShifts.length < upcomingLimit) {
          // Fetch driver details
          const { data: driver } = await supabase
            .from("users")
            .select("id, full_name, vehicle_id, vehicles:vehicle_id(registration_number, make, model)")
            .eq("id", assignment.driverId)
            .single()

          if (driver) {
            // Cast vehicles to the correct type (Supabase returns single object for foreign key, not array)
            const vehicle = driver.vehicles as any
            upcomingShifts.push({
              id: `${assignment.date}-${assignment.driverId}`,
              date: assignment.date,
              driverName: driver.full_name ?? "Unknown Driver",
              vanName: vehicle
                ? `${vehicle.make || ""} ${vehicle.model || ""}`.trim() ||
                  vehicle.registration_number ||
                  null
                : null,
            })
          }
        }
      }
    }

    // Sort by date and limit
    upcomingShifts.sort((a, b) => a.date.localeCompare(b.date))
    upcomingShifts.splice(upcomingLimit)

    // Fetch recent rosters
    const { data: recentRostersData, error: recentError } = await supabase
      .from("roster_assignments")
      .select("id, week_start_date, status, version, last_modified_at, assignments")
      .eq("organization_id", orgId)
      .order("week_start_date", { ascending: false })
      .limit(recentLimit)

    if (recentError) {
      console.error("[dashboard] recentRosters error:", recentError)
    }

    const recentRosters: DashboardRecentRoster[] = (
      recentRostersData ?? []
    ).map((roster: any) => ({
      id: roster.id,
      weekStart: roster.week_start_date,
      status: roster.status,
      assignmentsCount: Array.isArray(roster.assignments) ? roster.assignments.length : 0,
      lastUpdated: roster.last_modified_at,
    }))

    const dashboardData: DashboardData = {
      quickStats,
      upcomingShifts,
      recentRosters,
    }

    console.log("[dashboard] Dashboard data prepared", {
      quickStats,
      upcomingShiftsCount: upcomingShifts.length,
      recentRostersCount: recentRosters.length,
    })

    return { data: dashboardData, error: null }
  } catch (error) {
    console.error("[dashboard] Unexpected error:", error)
    return { data: null, error: getErrorMessage(error) }
  }
}
