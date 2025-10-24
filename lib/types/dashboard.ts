/**
 * Quick overview metrics displayed at the top of the logistics dashboard.
 */
export interface DashboardQuickStats {
  activeDrivers: number
  scheduledShiftsThisWeek: number
  totalVehicles: number
  upcomingRosters: number
}

/**
 * Compact representation of an upcoming driver shift/roster assignment.
 */
export interface DashboardUpcomingShift {
  id: string
  date: string
  driverName: string
  vanName: string | null
}

/**
 * Compact representation of recent roster activity.
 */
export interface DashboardRecentRoster {
  id: string
  weekStart: string
  status: string
  assignmentsCount: number
  lastUpdated: string
}

/**
 * Complete dashboard data payload returned by the server action.
 */
export interface DashboardData {
  quickStats: DashboardQuickStats
  upcomingShifts: DashboardUpcomingShift[]
  recentRosters: DashboardRecentRoster[]
}

/**
 * Options for fetching dashboard data via the server action.
 */
export interface GetDashboardDataOptions {
  upcomingLimit?: number
  recentLimit?: number
}
