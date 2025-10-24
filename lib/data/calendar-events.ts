import { createClient } from "@/lib/supabase/server"
import type {
  CalendarEvent,
  CoachingEvent,
  MatchEvent,
  TrainingEvent,
} from "@/lib/types/calendar"

/**
 * Fetch scheduled matches from the database
 */
export async function fetchScheduledMatches(): Promise<MatchEvent[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: scheduledMatches, error } = await supabase
    .from("scheduled_matches")
    .select("*")
    .eq("owner_id", user.id)
    .order("kickoff_at", { ascending: true })

  if (error) {
    console.error("Error fetching scheduled matches:", error)
    return []
  }

  return (scheduledMatches || []).map((match) => ({
    id: match.id,
    type: "match" as const,
    title: `${match.home_team_name} vs ${match.away_team_name}`,
    start: new Date(match.kickoff_at),
    // Assume 2 hour duration if not specified
    end: new Date(new Date(match.kickoff_at).getTime() + 2 * 60 * 60 * 1000),
    status: match.status === "scheduled" ? "scheduled" : "canceled",
    location: match.venue_name || undefined,
    teams: {
      home: match.home_team_name,
      away: match.away_team_name,
    },
    notes: match.notes || undefined,
    owner_id: match.owner_id,
    competition_name: match.competition_name || undefined,
    venue_name: match.venue_name || undefined,
    scheduled_match_id: match.id,
  }))
}

/**
 * Fetch active/completed matches from the database
 */
export async function fetchActiveMatches(): Promise<MatchEvent[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: matches, error } = await supabase
    .from("matches")
    .select("*")
    .eq("owner_id", user.id)
    .order("started_at", { ascending: false })
    .limit(50) // Limit to recent 50 matches

  if (error) {
    console.error("Error fetching active matches:", error)
    return []
  }

  return (matches || []).map((match) => ({
    id: match.id,
    type: "match" as const,
    title: `${match.home_team_name} vs ${match.away_team_name}`,
    start: new Date(match.started_at),
    end: match.completed_at
      ? new Date(match.completed_at)
      : new Date(new Date(match.started_at).getTime() + 2 * 60 * 60 * 1000),
    status:
      match.status === "in_progress"
        ? "in_progress"
        : match.status === "completed"
          ? "completed"
          : "canceled",
    location: match.venue_name || undefined,
    teams: {
      home: match.home_team_name,
      away: match.away_team_name,
    },
    notes: undefined,
    owner_id: match.owner_id,
    competition_name: match.competition_name || undefined,
    venue_name: match.venue_name || undefined,
    home_score: match.home_score || undefined,
    away_score: match.away_score || undefined,
    match_id: match.id,
  }))
}

/**
 * Fetch training sessions (workouts) from the database
 * Only includes referee-relevant workout types
 */
export async function fetchTrainingSessions(): Promise<TrainingEvent[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: workouts, error } = await supabase
    .from("workout_sessions")
    .select("*")
    .eq("owner_id", user.id)
    .in("kind", [
      "refereeDrill",
      "strength",
      "mobility",
      "outdoorRun",
      "custom",
    ])
    .order("started_at", { ascending: false })
    .limit(100)

  if (error) {
    console.error("Error fetching training sessions:", error)
    return []
  }

  return (workouts || []).map((workout) => ({
    id: workout.id,
    type: "training" as const,
    title: workout.title,
    start: new Date(workout.started_at),
    end: workout.ended_at
      ? new Date(workout.ended_at)
      : new Date(new Date(workout.started_at).getTime() + 60 * 60 * 1000), // Default 1 hour
    status:
      workout.state === "planned"
        ? "planned"
        : workout.state === "active"
          ? "active"
          : workout.state === "ended"
            ? "ended"
            : "aborted",
    location: undefined,
    notes: workout.notes || undefined,
    owner_id: workout.owner_id,
    trainingKind: workout.kind,
    perceived_exertion: workout.perceived_exertion || undefined,
    preset_id: workout.preset_id || undefined,
    metadata: workout.metadata || undefined,
    summary: workout.summary || undefined,
    workout_session_id: workout.id,
  }))
}

/**
 * Fetch coaching sessions from the database
 */
export async function fetchCoachingSessions(): Promise<CoachingEvent[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  const { data: sessions, error } = await supabase
    .from("coaching_sessions")
    .select("*")
    .eq("owner_id", user.id)
    .order("start_time", { ascending: true })

  if (error) {
    console.error("Error fetching coaching sessions:", error)
    return []
  }

  return (sessions || []).map((session) => ({
    id: session.id,
    type: "coaching" as const,
    title: session.title,
    start: new Date(session.start_time),
    end: new Date(session.end_time),
    status: "planned", // Coaching sessions are always planned for now
    location: session.location || undefined,
    notes: session.notes || undefined,
    owner_id: session.owner_id,
    sessionType: session.session_type,
    facilitator: session.facilitator || undefined,
    max_attendees: session.max_attendees || undefined,
    coaching_session_id: session.id,
  }))
}

/**
 * Fetch and combine all calendar events
 */
export async function fetchAllCalendarEvents(): Promise<CalendarEvent[]> {
  const [scheduledMatches, activeMatches, trainingSessions, coachingSessions] =
    await Promise.all([
      fetchScheduledMatches(),
      fetchActiveMatches(),
      fetchTrainingSessions(),
      fetchCoachingSessions(),
    ])

  // Combine all events
  const allEvents: CalendarEvent[] = [
    ...scheduledMatches,
    ...activeMatches,
    ...trainingSessions,
    ...coachingSessions,
  ]

  // Sort by start time
  return allEvents.sort((a, b) => a.start.getTime() - b.start.getTime())
}

/**
 * Fetch calendar events for a specific date range
 */
export async function fetchCalendarEventsInRange(
  startDate: Date,
  endDate: Date
): Promise<CalendarEvent[]> {
  const allEvents = await fetchAllCalendarEvents()

  return allEvents.filter((event) => {
    const eventStart = event.start.getTime()
    const eventEnd = event.end.getTime()
    const rangeStart = startDate.getTime()
    const rangeEnd = endDate.getTime()

    // Check if event overlaps with the range
    return eventStart <= rangeEnd && eventEnd >= rangeStart
  })
}
