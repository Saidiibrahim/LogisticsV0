import type { CalendarEvent, MatchEvent } from "@/lib/types/calendar"
import type { RecentMatch } from "@/lib/types/stats"

let idCounter = 0

const createId = (prefix: string) => `${prefix}-${++idCounter}`

const defaultDate = () => {
  const now = new Date()
  now.setSeconds(0, 0)
  return now
}

export const createMatchEvent = (
  overrides: Partial<MatchEvent> = {}
): MatchEvent => {
  const start = overrides.start ?? defaultDate()
  const end = overrides.end ?? new Date(start.getTime() + 60 * 60 * 1000)

  return {
    id: createId("match"),
    type: "match",
    title: "Sample Match",
    start,
    end,
    status: "scheduled",
    owner_id: overrides.owner_id ?? "owner-1",
    teams: {
      home: "Home FC",
      away: "Away FC",
      ...overrides.teams,
    },
    ...overrides,
  }
}

export const createCalendarEvent = (
  overrides: Partial<CalendarEvent> = {}
): CalendarEvent => {
  const start = overrides.start ?? defaultDate()
  const end = overrides.end ?? new Date(start.getTime() + 60 * 60 * 1000)

  if (overrides.type === "training") {
    return {
      id: createId("training"),
      type: "training",
      title: "Training Session",
      start,
      end,
      status: "planned",
      owner_id: overrides.owner_id ?? "owner-1",
      trainingKind: "strength",
      workout_session_id: "workout-1",
      ...overrides,
    } as CalendarEvent
  }

  if (overrides.type === "coaching") {
    return {
      id: createId("coaching"),
      type: "coaching",
      title: "Coaching Session",
      start,
      end,
      status: "planned",
      owner_id: overrides.owner_id ?? "owner-1",
      sessionType: "discussion",
      coaching_session_id: "coach-1",
      ...overrides,
    } as CalendarEvent
  }

  return createMatchEvent(overrides as Partial<MatchEvent>)
}

export const createRecentMatch = (
  overrides: Partial<RecentMatch> = {}
): RecentMatch => ({
  id: createId("recent"),
  startedAt: new Date().toISOString(),
  homeTeamName: "Home FC",
  awayTeamName: "Away FC",
  homeScore: 1,
  awayScore: 0,
  competitionName: "League",
  yellowCards: 2,
  redCards: 0,
  rating: null,
  ...overrides,
})
