/**
 * @file Unit coverage for statistics helper functions backing the dashboard.
 * The suites intentionally mirror Supabase response shapes so the expectations
 * read like documentation for downstream data consumers.
 */
import { describe, expect, it } from "vitest"
import {
  type AssessmentRow,
  buildAssessmentSummary,
  buildOverviewStats,
  calculatePeriodStart,
  extractMetrics,
  formatMonthlyKey,
  type MatchRow,
  type MatchWithAssessmentsRow,
  mapRecentMatches,
} from "../stats-helpers"

describe("calculatePeriodStart", () => {
  // Reference date keeps all deltas deterministic across assertions.
  const reference = new Date("2024-06-15T00:00:00.000Z")

  it("returns null for all period", () => {
    expect(calculatePeriodStart("all", reference)).toBeNull()
  })

  it("calculates 30 day period", () => {
    const result = calculatePeriodStart("30d", reference)
    expect(result).not.toBeNull()
    // Convert to a rounded day delta to avoid worrying about leap milliseconds.
    const diffInDays =
      (reference.getTime() - new Date(result ?? "").getTime()) /
      (1000 * 60 * 60 * 24)
    expect(Math.round(diffInDays)).toBe(30)
  })

  it("calculates month-based periods", () => {
    const threeMonths = calculatePeriodStart("3m", reference)
    const sixMonths = calculatePeriodStart("6m", reference)

    expect(threeMonths).not.toBeNull()
    expect(sixMonths).not.toBeNull()

    const threeMonthsDate = new Date(threeMonths ?? "")
    expect(threeMonthsDate.getUTCFullYear()).toBe(2024)
    expect(threeMonthsDate.getUTCMonth()).toBe(2)
    expect(threeMonthsDate.getUTCDate()).toBe(15)

    const sixMonthsDate = new Date(sixMonths ?? "")
    expect(sixMonthsDate.getUTCFullYear()).toBe(2023)
    expect(sixMonthsDate.getUTCMonth()).toBe(11)
    expect(sixMonthsDate.getUTCDate()).toBe(15)
  })
})

describe("extractMetrics", () => {
  // Ensures aggregate metrics from Supabase RPC payloads are normalised.
  it("handles array payloads", () => {
    const metrics = extractMetrics([
      {
        total_goals: 3,
        total_cards: 2,
        yellow_cards: 1,
        red_cards: 1,
        total_penalties: 0,
        avg_added_time_seconds: 30,
        home_cards: 1,
        away_cards: 1,
      },
    ])

    expect(metrics?.total_goals).toBe(3)
  })

  it("handles null metrics", () => {
    expect(extractMetrics(null)).toBeNull()
  })
})

describe("formatMonthlyKey", () => {
  // Chart labels should align to calendar months even with arbitrary times.
  it("normalises to month start", () => {
    expect(formatMonthlyKey("2024-06-15T10:00:00Z")).toBe("2024-06-01")
  })
})

describe("buildOverviewStats", () => {
  /** Representative match rows make the expectation math easy to audit. */
  const matches: MatchRow[] = [
    {
      id: "1",
      started_at: "2024-05-01T12:00:00Z",
      home_team_name: "Home FC",
      away_team_name: "Away FC",
      home_score: 2,
      away_score: 1,
      competition_name: "League",
      match_metrics: {
        total_goals: 3,
        total_cards: 4,
        yellow_cards: 3,
        red_cards: 1,
        total_penalties: 1,
        avg_added_time_seconds: 180,
        home_cards: 2,
        away_cards: 2,
      },
    },
    {
      id: "2",
      started_at: "2024-06-05T12:00:00Z",
      home_team_name: "Side A",
      away_team_name: "Side B",
      home_score: 0,
      away_score: 0,
      competition_name: "Cup",
      match_metrics: {
        total_goals: 0,
        total_cards: 1,
        yellow_cards: 1,
        red_cards: 0,
        total_penalties: 0,
        avg_added_time_seconds: 60,
        home_cards: 1,
        away_cards: 0,
      },
    },
  ]

  it("aggregates overview statistics", () => {
    const { overview, cardDistribution, trends } = buildOverviewStats(matches)

    expect(overview.totalMatches).toBe(2)
    expect(overview.totalGoals).toBe(3)
    expect(overview.avgGoalsPerMatch).toBe(1.5)
    expect(overview.avgCardsPerMatch).toBe(2.5)
    expect(overview.avgAddedTimeMinutes).toBe(2)

    expect(cardDistribution).toEqual({
      homeCards: 3,
      awayCards: 2,
      yellowCards: 4,
      redCards: 1,
    })

    expect(trends).toHaveLength(2)
    expect(trends[0]).toMatchObject({
      month: "2024-05-01",
      matchesCount: 1,
      goals: 3,
    })
  })
})

describe("buildAssessmentSummary", () => {
  it("returns null when empty", () => {
    expect(buildAssessmentSummary([])).toBeNull()
  })

  it("summarises assessment data", () => {
    // Mixed ratings (including nulls) confirm averages ignore missing scores.
    const rows: AssessmentRow[] = [
      { rating: 4, mood: "calm" },
      { rating: 5, mood: "calm" },
      { rating: null, mood: "stressed" },
    ]

    const summary = buildAssessmentSummary(rows)
    expect(summary).not.toBeNull()
    expect(summary?.avgRating).toBeCloseTo(3)
    expect(summary?.assessmentCount).toBe(3)
    expect(summary?.moodDistribution).toEqual(
      expect.arrayContaining([
        { mood: "calm", count: 2 },
        { mood: "stressed", count: 1 },
      ])
    )
  })
})

describe("mapRecentMatches", () => {
  /** Mirror the raw Supabase join result so the mapping expectations read true. */
  it("normalises recent matches payload", () => {
    const rows: MatchWithAssessmentsRow[] = [
      {
        id: "1",
        started_at: "2024-06-05T12:00:00Z",
        home_team_name: "Home",
        away_team_name: "Away",
        home_score: 1,
        away_score: 0,
        competition_name: "League",
        match_metrics: [
          {
            total_goals: 1,
            total_cards: 2,
            yellow_cards: 2,
            red_cards: 0,
            total_penalties: 0,
            avg_added_time_seconds: 0,
            home_cards: 1,
            away_cards: 1,
          },
        ],
        match_assessments: [{ rating: 4 }],
      },
    ]

    const result = mapRecentMatches(rows)
    expect(result).toEqual([
      {
        id: "1",
        startedAt: "2024-06-05T12:00:00Z",
        homeTeamName: "Home",
        awayTeamName: "Away",
        homeScore: 1,
        awayScore: 0,
        competitionName: "League",
        yellowCards: 2,
        redCards: 0,
        rating: 4,
      },
    ])
  })
})
