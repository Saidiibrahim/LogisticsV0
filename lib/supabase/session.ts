import { cache } from "react"

import { createClient } from "./server"

export const getSessionClaims = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getClaims()
})

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getUser()
})
