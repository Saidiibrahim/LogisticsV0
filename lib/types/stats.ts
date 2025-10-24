export type StatsPeriod = "30d" | "3m" | "6m" | "all"

export interface OverviewStats {
  totalMatches: number
  totalYellowCards: number
  totalRedCards: number
  totalGoals: number
  totalPenalties: number
  avgCardsPerMatch: number
  avgGoalsPerMatch: number
  avgAddedTimeMinutes: number
}

export interface MonthlyTrend {
  month: string
  matchesCount: number
  goals: number
  yellowCards: number
  redCards: number
}

export interface CardDistribution {
  homeCards: number
  awayCards: number
  yellowCards: number
  redCards: number
}

export type AssessmentMood = "calm" | "focused" | "stressed" | "fatigued"

export interface AssessmentSummary {
  avgRating: number
  assessmentCount: number
  moodDistribution: Array<{
    mood: AssessmentMood
    count: number
  }>
}

export interface RecentMatch {
  id: string
  startedAt: string
  homeTeamName: string
  awayTeamName: string
  homeScore: number
  awayScore: number
  competitionName: string | null
  yellowCards: number
  redCards: number
  rating: number | null
}

export interface StatsData {
  overview: OverviewStats
  trends: MonthlyTrend[]
  cardDistribution: CardDistribution
  assessmentSummary: AssessmentSummary | null
  recentMatches: RecentMatch[]
}

export interface GetStatsOptions {
  period?: StatsPeriod
  limit?: number
}
