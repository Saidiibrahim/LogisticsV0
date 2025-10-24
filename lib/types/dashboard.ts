/**
 * Quick overview metrics displayed at the top of the dashboard.
 */
export interface DashboardQuickStats {
  matchesThisMonth: number
  upcomingMatchesCount: number
  recentAvgRating: number | null
  totalCardsLast30Days: number
}

/**
 * Compact representation of an upcoming scheduled match.
 */
export interface DashboardUpcomingMatch {
  id: string
  kickoffAt: string
  homeTeamName: string
  awayTeamName: string
  competitionName: string | null
  venueName: string | null
}

/**
 * Compact representation of a recently completed match.
 */
export interface DashboardRecentMatch {
  id: string
  startedAt: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number
  awayScore: number
  competitionName: string | null
  totalCards: number
  yellowCards: number
  redCards: number
  totalGoals: number
  rating: number | null
}

/**
 * Complete dashboard data payload returned by the server action.
 */
export interface DashboardData {
  quickStats: DashboardQuickStats
  upcomingMatches: DashboardUpcomingMatch[]
  recentMatches: DashboardRecentMatch[]
}

/**
 * Options for fetching dashboard data via the server action.
 */
export interface GetDashboardDataOptions {
  upcomingLimit?: number
  recentLimit?: number
}
