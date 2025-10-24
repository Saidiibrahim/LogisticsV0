/**
 * @file High-level integration tests for `getMatchStats` that double as
 * documentation for the Supabase queries it wires together.
 * Each scenario focuses on a distinct failure mode so maintainers can quickly
 * reason about authentication and data edge cases.
 */
import { createSupabaseClientMock } from "test-utils"
import { afterEach, describe, expect, it, vi } from "vitest"

vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

import { createClient } from "@/lib/supabase/server"
import { getMatchStats } from "../get-stats"
import type {
  AssessmentRow,
  MatchRow,
  MatchWithAssessmentsRow,
} from "../stats-helpers"

// Reuse the mocked instance to capture configuration differences per test.
const mockedCreateClient = vi.mocked(createClient)

afterEach(() => {
  mockedCreateClient.mockReset()
  vi.clearAllMocks()
})

describe("getMatchStats", () => {
  it("returns authentication error when session lookup fails", async () => {
    // Supabase can respond with both a user and an error; this mimics that case.
    const supabase = createSupabaseClientMock({
      auth: {
        user: { id: "user-1" },
        error: new Error("invalid"),
      },
    })
    mockedCreateClient.mockResolvedValue(supabase as never)

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const result = await getMatchStats()
    expect(result).toEqual({ data: null, error: "Authentication error" })
    consoleSpy.mockRestore()
  })

  it("returns unauthorized when no user session is present", async () => {
    // Null user + null error represents the anonymous state from Supabase.
    const supabase = createSupabaseClientMock({
      auth: {
        user: null,
        error: null,
      },
    })
    mockedCreateClient.mockResolvedValue(supabase as never)

    const result = await getMatchStats()
    expect(result).toEqual({ data: null, error: "Unauthorized" })
  })

  it("propagates match query errors", async () => {
    const supabase = createSupabaseClientMock({
      matches: { data: null, error: new Error("boom") },
    })
    mockedCreateClient.mockResolvedValue(supabase as never)

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const result = await getMatchStats()
    expect(result).toEqual({
      data: null,
      error: "Failed to load match statistics",
    })
    expect(consoleSpy).toHaveBeenCalled()
    consoleSpy.mockRestore()
  })

  it("applies period filters and custom limits", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date("2024-06-15T00:00:00Z"))

    const supabase = createSupabaseClientMock()
    mockedCreateClient.mockResolvedValue(supabase as never)

    try {
      await getMatchStats({ period: "30d", limit: 3 })

      // Query builders returned from Supabase's fluent API are stored per call.
      const matchesQuery = supabase.from.mock.results[0]?.value as
        | undefined
        | { gte: ReturnType<typeof vi.fn> }
      const assessmentsQuery = supabase.from.mock.results[1]?.value as
        | undefined
        | { gte: ReturnType<typeof vi.fn> }
      const recentMatchesQuery = supabase.from.mock.results[2]?.value as
        | undefined
        | { limit: ReturnType<typeof vi.fn> }

      expect(matchesQuery).toBeDefined()
      expect(matchesQuery?.gte).toHaveBeenCalledWith(
        "started_at",
        "2024-05-16T00:00:00.000Z"
      )

      expect(assessmentsQuery).toBeDefined()
      expect(assessmentsQuery?.gte).toHaveBeenCalledWith(
        "created_at",
        "2024-05-16T00:00:00.000Z"
      )

      expect(recentMatchesQuery).toBeDefined()
      expect(recentMatchesQuery?.limit).toHaveBeenCalledWith(3)
    } finally {
      vi.useRealTimers()
    }
  })

  it("continues when assessments query fails", async () => {
    // Matches succeed but assessments fail to simulate partial outages.
    const matches: MatchRow[] = [
      {
        id: "1",
        started_at: "2024-06-01T00:00:00Z",
        home_team_name: "Home",
        away_team_name: "Away",
        home_score: 1,
        away_score: 0,
        competition_name: "League",
        match_metrics: {
          total_goals: 1,
          total_cards: 2,
          yellow_cards: 2,
          red_cards: 0,
          total_penalties: 0,
          avg_added_time_seconds: 0,
          home_cards: 1,
          away_cards: 1,
        },
      },
    ]

    const supabase = createSupabaseClientMock({
      matches: { data: matches, error: null },
      assessments: { data: null, error: new Error("assessments failed") },
    })

    mockedCreateClient.mockResolvedValue(supabase as never)

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const result = await getMatchStats()

    expect(result.error).toBeNull()
    expect(result.data?.overview.totalMatches).toBe(1)
    expect(result.data?.assessmentSummary).toBeNull()
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it("continues when recent matches query fails", async () => {
    // Mirrors the previous test but targets the recent matches relationship.
    const matches: MatchRow[] = [
      {
        id: "1",
        started_at: "2024-06-01T00:00:00Z",
        home_team_name: "Home",
        away_team_name: "Away",
        home_score: 1,
        away_score: 0,
        competition_name: "League",
        match_metrics: {
          total_goals: 1,
          total_cards: 2,
          yellow_cards: 2,
          red_cards: 0,
          total_penalties: 0,
          avg_added_time_seconds: 0,
          home_cards: 1,
          away_cards: 1,
        },
      },
    ]

    const supabase = createSupabaseClientMock({
      matches: { data: matches, error: null },
      recentMatches: { data: null, error: new Error("recent failed") },
    })

    mockedCreateClient.mockResolvedValue(supabase as never)

    const consoleSpy = vi
      .spyOn(console, "error")
      .mockImplementation(() => undefined)

    const result = await getMatchStats()

    expect(result.error).toBeNull()
    expect(result.data?.recentMatches).toEqual([])
    expect(result.data?.overview.totalMatches).toBe(1)
    expect(consoleSpy).toHaveBeenCalled()

    consoleSpy.mockRestore()
  })

  it("returns match statistics when queries succeed", async () => {
    // Happy path: all queries resolve with data to feed the transform helpers.
    const matches: MatchRow[] = [
      {
        id: "1",
        started_at: "2024-06-01T00:00:00Z",
        home_team_name: "Home",
        away_team_name: "Away",
        home_score: 2,
        away_score: 1,
        competition_name: "League",
        match_metrics: {
          total_goals: 3,
          total_cards: 2,
          yellow_cards: 2,
          red_cards: 0,
          total_penalties: 1,
          avg_added_time_seconds: 120,
          home_cards: 1,
          away_cards: 1,
        },
      },
    ]

    const assessments: AssessmentRow[] = [
      { rating: 4, mood: "calm" },
      { rating: 5, mood: "focused" },
    ]

    const recent: MatchWithAssessmentsRow[] = [
      {
        // biome-ignore lint/style/noNonNullAssertion: matches array is guaranteed to have elements in test setup
        ...matches[0]!,
        match_assessments: [{ rating: 4 }],
      },
    ]

    const supabase = createSupabaseClientMock({
      matches: { data: matches, error: null },
      assessments: { data: assessments, error: null },
      recentMatches: { data: recent, error: null },
    })

    mockedCreateClient.mockResolvedValue(supabase as never)

    const result = await getMatchStats()
    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.overview.totalMatches).toBe(1)
    expect(result.data?.assessmentSummary).toMatchObject({
      assessmentCount: 2,
      avgRating: 4.5,
    })
    expect(result.data?.recentMatches[0]).toMatchObject({
      rating: 4,
      yellowCards: 2,
    })
  })
})
