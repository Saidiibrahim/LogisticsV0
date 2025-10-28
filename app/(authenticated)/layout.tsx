import { redirect } from "next/navigation"
import { type ReactNode, Suspense } from "react"

/**
 * Route segment configuration for the authenticated layout.
 *
 * Configured as force-dynamic to ensure session validation runs on every request,
 * preventing stale authentication states.
 *
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/route-segment-config
 */
export const dynamic = "force-dynamic"

import { getSessionClaims, getUserProfile } from "@/lib/supabase/session"
import { AppChrome } from "./_components/app-chrome"
import { LoadingShell } from "./_components/loading-shell"

/**
 * Props for the AuthenticatedLayout component.
 */
interface AuthenticatedLayoutProps {
  /** Child pages to render within the authenticated shell */
  children: ReactNode
}

/**
 * Root layout for all authenticated routes in the application.
 *
 * This layout component serves as the authentication boundary for protected routes.
 * It performs session validation once and provides the authenticated user context
 * to all child routes, preventing redundant session fetches.
 *
 * Architecture:
 * - **Server Component**: Fetches session server-side for optimal performance
 * - **Single Session Fetch**: Uses React `cache()` via getSessionClaims() to deduplicate
 *   requests within a single render
 * - **Context Propagation**: Passes user data to AppChrome, which provides it via
 *   React Context to all descendant components
 * - **Streaming**: Wraps children in Suspense for progressive rendering
 *
 * Authentication Flow:
 * 1. Fetch session claims using cached Supabase helper
 * 2. Redirect to login if unauthenticated or error occurs
 * 3. Extract user email from JWT claims
 * 4. Render AppChrome with user data and stream child content
 *
 * Performance Optimizations:
 * - Session fetched once per request (React cache deduplication)
 * - User data shared via context (no prop drilling or redundant fetches)
 * - Suspense boundaries enable streaming for slow child components
 * - Server component minimizes client JavaScript bundle
 *
 * @example
 * ```tsx
 * // Child routes automatically inherit authentication
 * // app/(authenticated)/dashboard/page.tsx
 * export default function DashboardPage() {
 *   // No session fetch needed - use useUser() hook for user data
 *   return <div>Protected content</div>
 * }
 * ```
 *
 * @param props - Layout props
 * @returns The rendered authenticated layout with session-protected content
 */
export default async function AuthenticatedLayout({
  children,
}: AuthenticatedLayoutProps) {
  // Fetch session claims (cached, deduplicated across this render tree)
  const [session, userResult] = await Promise.all([
    getSessionClaims(),
    getUserProfile(),
  ])

  if (!session) {
    redirect("/auth/login")
  }

  const authUser = userResult.data?.user

  const userMetadata = (authUser?.user_metadata ?? {}) as Record<
    string,
    unknown
  >
  const appMetadata = (authUser?.app_metadata ?? {}) as Record<string, unknown>

  const pickString = (...values: unknown[]) => {
    for (const value of values) {
      if (typeof value === "string") {
        const trimmed = value.trim()
        if (trimmed) {
          return trimmed
        }
      }
    }

    return undefined
  }

  const userName = pickString(
    userMetadata.full_name,
    userMetadata.name,
    session.fullName
  )

  const userEmail = pickString(session.email, authUser?.email)

  const subscriptionTier = pickString(
    userMetadata.subscription_tier,
    appMetadata.subscription_tier,
    userMetadata.plan,
    appMetadata.plan
  )

  return (
    <AppChrome
      session={session}
      subscriptionTier={subscriptionTier}
      userEmail={userEmail}
      userName={userName}
    >
      {/* Suspense boundary enables streaming for async child components */}
      <Suspense fallback={<LoadingShell />}>{children}</Suspense>
    </AppChrome>
  )
}
