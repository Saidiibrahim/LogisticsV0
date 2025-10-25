/**
 * Chat tools for CourierRun AI assistant
 * Provides tool definitions for delivery insights and roster planning
 */

import type { SupabaseClient } from "@supabase/supabase-js"
import { createShowCalendarTool } from "./calendar"
import { createShowDriverPerformanceTool } from "./driver-performance"

interface CreateChatToolsOptions {
  supabase: SupabaseClient
  userId: string
}

/**
 * Creates chat tools for the AI assistant with access to Supabase data.
 * Provides tools for viewing calendar events and driver performance metrics.
 */
export function createChatTools({ supabase, userId }: CreateChatToolsOptions) {
  const context = { supabase, userId }

  return {
    showCalendar: createShowCalendarTool(context),
    showDriverPerformance: createShowDriverPerformanceTool(context),
  }
}
