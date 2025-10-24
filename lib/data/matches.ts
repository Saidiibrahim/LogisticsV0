import { createClient } from "@/lib/supabase/server"
import type { GroupedMatches, Match, ScheduledMatch } from "@/lib/types/matches"
import { getErrorMessage } from "@/lib/utils/errors"

const RETRY_BASE_DELAY_MS = 150
const RETRY_MAX_ATTEMPTS = 2

async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = RETRY_MAX_ATTEMPTS
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (attempt === maxRetries) {
        throw error
      }

      const backoff = RETRY_BASE_DELAY_MS * 2 ** attempt
      await new Promise((resolve) => setTimeout(resolve, backoff))
    }
  }

  throw lastError ?? new Error("Operation failed")
}

function logError(context: string, error: unknown) {
  console.error(`[matches] ${context}: ${getErrorMessage(error)}`, error)
}

async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user?.id ?? null
}

export async function getCompletedMatches(): Promise<Match[]> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return []
  }

  try {
    const supabase = await createClient()

    const { data } = await retryOperation(async () => {
      const response = await supabase
        .from("matches")
        .select("*")
        .eq("owner_id", userId)
        .eq("status", "completed")
        .order("started_at", { ascending: false })

      if (response.error) {
        throw response.error
      }

      return response
    })

    return data ?? []
  } catch (error) {
    logError("Error fetching completed matches", error)
    throw error
  }
}

export async function getScheduledMatches(): Promise<ScheduledMatch[]> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return []
  }

  try {
    const supabase = await createClient()

    const { data } = await retryOperation(async () => {
      const response = await supabase
        .from("scheduled_matches")
        .select("*")
        .eq("owner_id", userId)
        .eq("status", "scheduled")
        .gte("kickoff_at", new Date().toISOString())
        .order("kickoff_at", { ascending: true })

      if (response.error) {
        throw response.error
      }

      return response
    })

    return data ?? []
  } catch (error) {
    logError("Error fetching scheduled matches", error)
    throw error
  }
}

export async function getMatchById(matchId: string): Promise<Match | null> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return null
  }

  try {
    const supabase = await createClient()

    const response = await retryOperation(async () => {
      const result = await supabase
        .from("matches")
        .select("*")
        .eq("id", matchId)
        .eq("owner_id", userId)
        .single()

      const shouldThrow =
        result.error &&
        result.error?.code !== "PGRST116" &&
        result.error?.code !== "PGRST103"

      if (shouldThrow) {
        throw result.error
      }

      return result
    })

    if (response.error) {
      return null
    }

    return response.data
  } catch (error) {
    logError("Error fetching match", error)
    return null
  }
}

export async function getScheduledMatchById(
  matchId: string
): Promise<ScheduledMatch | null> {
  const userId = await getCurrentUserId()
  if (!userId) {
    return null
  }

  try {
    const supabase = await createClient()

    const response = await retryOperation(async () => {
      const result = await supabase
        .from("scheduled_matches")
        .select("*")
        .eq("id", matchId)
        .eq("owner_id", userId)
        .single()

      const shouldThrow =
        result.error &&
        result.error?.code !== "PGRST116" &&
        result.error?.code !== "PGRST103"

      if (shouldThrow) {
        throw result.error
      }

      return result
    })

    if (response.error) {
      return null
    }

    return response.data
  } catch (error) {
    logError("Error fetching scheduled match", error)
    return null
  }
}

export async function getGroupedMatches(): Promise<GroupedMatches> {
  const [completedMatches, scheduledMatches] = await Promise.all([
    getCompletedMatches(),
    getScheduledMatches(),
  ])

  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const recent: Match[] = []
  const past: Match[] = []

  // Partition completed matches by recency so downstream UIs can consume filtered arrays.
  for (const match of completedMatches) {
    const matchDate = new Date(match.started_at)

    if (matchDate >= sevenDaysAgo) {
      recent.push(match)
    } else {
      past.push(match)
    }
  }

  return {
    recent,
    past,
    upcoming: scheduledMatches,
  }
}

export async function getGroupedMatchesSafe(): Promise<GroupedMatches> {
  try {
    return await getGroupedMatches()
  } catch (error) {
    logError("Error fetching grouped matches", error)
    return {
      recent: [],
      past: [],
      upcoming: [],
    }
  }
}
