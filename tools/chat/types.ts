import type { SupabaseClient } from "@supabase/supabase-js"

/**
 * Shared Supabase client type for the chat tool modules.
 *
 * We don't ship generated database types yet, so we use the default
 * SupabaseClient type which still retains Supabase client APIs.
 */
export type ServerSupabaseClient = SupabaseClient
