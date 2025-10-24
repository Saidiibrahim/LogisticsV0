import { redirect } from "next/navigation"
import { getSessionClaims } from "@/lib/supabase/session"

/**
 * Transitional route used in Supabase auth flows. It verifies the session and
 * then immediately sends authenticated users to the main dashboard.
 */
export default async function ProtectedPage() {
  const { data, error } = await getSessionClaims()
  if (error || !data?.claims) {
    redirect("/auth/login")
  }

  // Redirect authenticated users to welcome
  redirect("/welcome")
}
