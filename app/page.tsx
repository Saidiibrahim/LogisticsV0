import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"

/**
 * Landing route that immediately resolves to either the dashboard or the
 * authentication flow depending on whether the visitor has an active Supabase
 * session.
 */
export default async function HomePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getClaims()

  // If authenticated, go to dashboard; otherwise, go to login
  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  redirect("/welcome")
}
