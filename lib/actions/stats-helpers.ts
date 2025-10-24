import type {
  AssessmentSummary,
  CardDistribution,
  MonthlyTrend,
  OverviewStats,
  RecentMatch,
  StatsPeriod,
} from "@/lib/types/stats"

export const PERIOD_TO_MONTHS: Record<
  Exclude<StatsPeriod, "30d" | "all">,
  number
> = {
  "3m": 3,
  "6m": 6,
}

export type MatchMetricsRow = {
  total_goals: number | null
  total_cards: number | null
  yellow_cards: number | null
  red_cards: number | null
  total_penalties: number | null
  avg_added_time_seconds: number | null
  home_cards: number | null
  away_cards: number | null
}

export type MatchRow = {
  id: string
  started_at: string
  home_team_name: string
  away_team_name: string
  home_score: number
  away_score: number
  competition_name: string | null
  match_metrics: MatchMetricsRow[] | MatchMetricsRow | null
}

export type MatchWithAssessmentsRow = MatchRow & {
  match_assessments:
    | { rating: number | null }[]
    | { rating: number | null }
    | null
}

export type AssessmentRow = {
  rating: number | null
  mood: AssessmentSummary["moodDistribution"][number]["mood"] | null
}

export function calculatePeriodStart(
  period: StatsPeriod,
  referenceDate: Date = new Date()
): string | null {
  const now = new Date(referenceDate)

  if (period === "all") {
    return null
  }

  if (period === "30d") {
    const start = new Date(now)
    start.setDate(start.getDate() - 30)
    return start.toISOString()
  }

  const months = PERIOD_TO_MONTHS[period as keyof typeof PERIOD_TO_MONTHS]
  if (!months) {
    return null
  }

  const start = new Date(now)
  start.setMonth(start.getMonth() - months)
  return start.toISOString()
}

export function extractMetrics(
  raw: MatchRow["match_metrics"]
): MatchMetricsRow | null {
  if (!raw) {
    return null
  }

  if (Array.isArray(raw)) {
    return raw[0] ?? null
  }

  return raw
}

export function formatMonthlyKey(isoDate: string): string {
  const date = new Date(isoDate)
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${year}-${month}-01`
}

export function buildOverviewStats(matches: MatchRow[]): {
  overview: OverviewStats
  trends: MonthlyTrend[]
  cardDistribution: CardDistribution
} {
  let totalYellowCards = 0
  let totalRedCards = 0
  let totalCards = 0
  let totalGoals = 0
  let totalPenalties = 0
  let totalAddedTimeSeconds = 0
  let totalHomeCards = 0
  let totalAwayCards = 0

  const monthlyMap = new Map<
    string,
    {
      matchesCount: number
      goals: number
      yellowCards: number
      redCards: number
    }
  >()

  matches.forEach((match) => {
    const metrics = extractMetrics(match.match_metrics)
    const goals = metrics?.total_goals ?? 0
    const yellowCards = metrics?.yellow_cards ?? 0
    const redCards = metrics?.red_cards ?? 0
    const totalMatchCards = metrics?.total_cards ?? yellowCards + redCards
    const penalties = metrics?.total_penalties ?? 0
    const addedTimeSeconds = metrics?.avg_added_time_seconds ?? 0
    const homeCards = metrics?.home_cards ?? 0
    const awayCards = metrics?.away_cards ?? 0

    totalGoals += goals
    totalYellowCards += yellowCards
    totalRedCards += redCards
    totalCards += totalMatchCards
    totalPenalties += penalties
    totalAddedTimeSeconds += addedTimeSeconds
    totalHomeCards += homeCards
    totalAwayCards += awayCards

    const monthKey = formatMonthlyKey(match.started_at)
    const existing = monthlyMap.get(monthKey) ?? {
      matchesCount: 0,
      goals: 0,
      yellowCards: 0,
      redCards: 0,
    }

    existing.matchesCount += 1
    existing.goals += goals
    existing.yellowCards += yellowCards
    existing.redCards += redCards

    monthlyMap.set(monthKey, existing)
  })

  const totalMatches = matches.length
  const avgCardsPerMatch =
    totalMatches > 0 ? Number((totalCards / totalMatches).toFixed(2)) : 0
  const avgGoalsPerMatch =
    totalMatches > 0 ? Number((totalGoals / totalMatches).toFixed(2)) : 0
  const avgAddedTimeMinutes =
    totalMatches > 0
      ? Number((totalAddedTimeSeconds / totalMatches / 60).toFixed(1))
      : 0

  const trends = Array.from(monthlyMap.entries())
    .sort(([a], [b]) => (a > b ? 1 : -1))
    .map(([month, values]) => ({
      month,
      matchesCount: values.matchesCount,
      goals: values.goals,
      yellowCards: values.yellowCards,
      redCards: values.redCards,
    }))

  return {
    overview: {
      totalMatches,
      totalYellowCards,
      totalRedCards,
      totalGoals,
      totalPenalties,
      avgCardsPerMatch,
      avgGoalsPerMatch,
      avgAddedTimeMinutes,
    },
    trends,
    cardDistribution: {
      homeCards: totalHomeCards,
      awayCards: totalAwayCards,
      yellowCards: totalYellowCards,
      redCards: totalRedCards,
    },
  }
}

export function buildAssessmentSummary(
  assessments: AssessmentRow[]
): AssessmentSummary | null {
  if (!assessments.length) {
    return null
  }

  const totalRating = assessments.reduce(
    (sum, assessment) => sum + (assessment.rating ?? 0),
    0
  )

  const moodCounts = assessments.reduce<Record<string, number>>(
    (acc, assessment) => {
      if (assessment.mood) {
        acc[assessment.mood] = (acc[assessment.mood] ?? 0) + 1
      }
      return acc
    },
    {}
  )

  return {
    avgRating: Number((totalRating / assessments.length).toFixed(1)),
    assessmentCount: assessments.length,
    moodDistribution: Object.entries(moodCounts).map(([mood, count]) => ({
      mood: mood as AssessmentSummary["moodDistribution"][number]["mood"],
      count,
    })),
  }
}

export function mapRecentMatches(
  matches: MatchWithAssessmentsRow[]
): RecentMatch[] {
  return matches.map((match) => {
    const metrics = extractMetrics(match.match_metrics)
    const assessments = match.match_assessments
    const firstAssessment = Array.isArray(assessments)
      ? (assessments[0] ?? null)
      : (assessments ?? null)

    return {
      id: match.id,
      startedAt: match.started_at,
      homeTeamName: match.home_team_name,
      awayTeamName: match.away_team_name,
      homeScore: match.home_score,
      awayScore: match.away_score,
      competitionName: match.competition_name,
      yellowCards: metrics?.yellow_cards ?? 0,
      redCards: metrics?.red_cards ?? 0,
      rating: firstAssessment?.rating ?? null,
    }
  })
}
