import { createShowCalendarTool } from "./calendar"
import { createShowMatchStatsTool } from "./match-stats"
import { createShowTrainingSummaryTool } from "./training-summary"
import type { ServerSupabaseClient } from "./types"

export interface ChatToolContext {
  supabase: ServerSupabaseClient
  userId: string
}

/**
 * Factory that assembles all chat tools used by the AI SDK integration.
 *
 * Each tool receives a reference to the authenticated Supabase client so it
 * can run authenticated queries on behalf of the requesting user.
 */
export function createChatTools(context: ChatToolContext) {
  return {
    showCalendar: createShowCalendarTool(context),
    showMatchStats: createShowMatchStatsTool(context),
    showTrainingSummary: createShowTrainingSummaryTool(context),
  }
}
