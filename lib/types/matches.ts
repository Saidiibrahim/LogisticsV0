export type MatchStatus = "scheduled" | "in_progress" | "completed" | "canceled"

export interface Match {
  id: string
  owner_id: string
  scheduled_match_id: string | null
  status: MatchStatus
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  competition_id: string | null
  competition_name: string | null
  venue_id: string | null
  venue_name: string | null
  home_team_id: string | null
  home_team_name: string
  away_team_id: string | null
  away_team_name: string
  regulation_minutes: number | null
  number_of_periods: number
  half_time_minutes: number | null
  extra_time_enabled: boolean
  extra_time_half_minutes: number | null
  penalties_enabled: boolean
  penalty_initial_rounds: number
  home_score: number
  away_score: number
  final_score: Record<string, unknown> | null
  source_device_id: string | null
  created_at: string
  updated_at: string
}

export interface ScheduledMatch {
  id: string
  owner_id: string
  status: MatchStatus
  kickoff_at: string
  competition_id: string | null
  competition_name: string | null
  venue_id: string | null
  venue_name: string | null
  home_team_id: string | null
  home_team_name: string
  away_team_id: string | null
  away_team_name: string
  source_device_id: string | null
  notes: string | null
  created_at: string
  updated_at: string
}

export interface MatchSummary {
  id: string
  home_team_name: string
  away_team_name: string
  home_score: number
  away_score: number
  started_at: string
  competition_name: string | null
  venue_name: string | null
  status: MatchStatus
}

export interface ScheduledMatchSummary {
  id: string
  home_team_name: string
  away_team_name: string
  kickoff_at: string
  competition_name: string | null
  venue_name: string | null
  status: MatchStatus
}

export interface GroupedMatches {
  recent: Match[]
  past: Match[]
  upcoming: ScheduledMatch[]
}

export interface CreateScheduledMatchInput {
  home_team_id?: string
  home_team_name: string
  away_team_id?: string
  away_team_name: string
  kickoff_at: string
  competition_id?: string
  competition_name?: string
  venue_id?: string
  venue_name?: string
  notes?: string
}
