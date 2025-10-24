/**
 * Chat tools for CourierRun AI assistant
 * Provides tool definitions for delivery insights and roster planning
 */

import type { SupabaseClient } from "@supabase/supabase-js"

interface CreateChatToolsOptions {
  supabase: SupabaseClient
  userId: string
}

/**
 * Creates chat tools for the AI assistant with access to Supabase data.
 * Currently provides roster planning and delivery insights tools.
 *
 * TODO: Implement full tool definitions once AI SDK types are properly configured
 */
export function createChatTools({ supabase, userId }: CreateChatToolsOptions) {
  // Return empty tools object for now - stub implementation
  // Full implementation requires proper AI SDK tool type configuration
  return {}
}
