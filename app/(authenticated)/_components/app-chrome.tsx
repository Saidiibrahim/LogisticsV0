"use client"

import { usePathname } from "next/navigation"
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SearchCommandDialog } from "@/components/layout/search-command-dialog"
import { TopBar } from "@/components/layout/top-bar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  hasPermission as checkPermission,
  type Permission,
  type UserRole,
} from "@/lib/auth/permissions"
import {
  selectClearUser,
  selectSetUserProfile,
  useUserStore,
} from "@/lib/stores/use-user-store"
import { type SessionClaims } from "@/lib/supabase/session"

// Routes rendered without the standard sidebar/top bar chrome.
const isPricingEnabled =
  process.env.NEXT_PUBLIC_FEATURE_PRICING_PAGE_ENABLED === "true"
const FULL_PAGE_ROUTES = new Set(isPricingEnabled ? ["/pricing"] : [])

/**
 * Props for the AppChrome component.
 */
interface AppChromeProps {
  /** Child content to render in the main area */
  children: React.ReactNode
  /** Session claims resolved server-side for the authenticated user */
  session: SessionClaims
  /** Authenticated user's email address for display in sidebar menu */
  userEmail?: string
  /** Authenticated user's friendly display name */
  userName?: string
  /** Subscription tier label resolved from Supabase metadata */
  subscriptionTier?: string
}

export interface UserContextValue {
  userId: string
  email: string | null
  fullName: string | null
  organizationId: string
  role: UserRole
  hasPermission: (permission: Permission) => boolean
}

const UserContext = createContext<UserContextValue | null>(null)

export function useUser(): UserContextValue {
  const context = useContext(UserContext)

  if (!context) {
    throw new Error("useUser must be used within an AppChrome provider")
  }

  return context
}

/**
 * Application chrome component providing the main layout structure for authenticated routes.
 *
 * This component orchestrates the primary UI shell including:
 * - Collapsible sidebar navigation (via SidebarProvider)
 * - Top navigation bar with breadcrumbs
 * - Main content area with overflow handling
 * - User store synchronization for downstream consumers
 *
 * The component is marked "use client" because it uses client-side interactivity
 * (sidebar toggle, tooltips) while the parent layout remains a server component
 * for optimal data fetching.
 *
 * @example
 * ```tsx
 * // In app/(authenticated)/layout.tsx (server component)
 * export default async function Layout({ children }) {
 *   const session = await getSessionClaims()
 *   if (!session) throw new Error("No session")
 *   return <AppChrome session={session}>{children}</AppChrome>
 * }
 * ```
 *
 * @param props - Component props
 * @returns The rendered application chrome with nested content
 */
export function AppChrome({
  children,
  session,
  userEmail,
  userName,
  subscriptionTier,
}: AppChromeProps) {
  const pathname = usePathname()
  const setUserProfileInStore = useUserStore(selectSetUserProfile)
  const clearUserInStore = useUserStore(selectClearUser)

  const isFullPage = pathname ? FULL_PAGE_ROUTES.has(pathname) : false

  const { email, fullName, organizationId, role, userId } = session

  const resolvedEmail = userEmail ?? email ?? undefined
  const resolvedName = userName ?? fullName ?? undefined

  const permissionChecker = useCallback(
    (permission: Permission) => checkPermission(role, permission),
    [role]
  )

  const contextValue = useMemo<UserContextValue>(
    () => ({
      userId,
      email,
      fullName,
      organizationId,
      role,
      hasPermission: permissionChecker,
    }),
    [email, fullName, organizationId, permissionChecker, role, userId]
  )

  useEffect(() => {
    setUserProfileInStore({
      email: resolvedEmail,
      name: resolvedName,
      subscriptionTier,
      role,
      organizationId,
    })
    return () => {
      clearUserInStore()
    }
  }, [
    clearUserInStore,
    resolvedEmail,
    resolvedName,
    setUserProfileInStore,
    subscriptionTier,
    organizationId,
    role,
  ])

  const chromeShell = isFullPage ? (
    <div className="min-h-screen w-full bg-neutral-950 text-neutral-50">
      {children}
    </div>
  ) : (
    <div className="flex min-h-screen w-full">
      <TooltipProvider delayDuration={0}>
        <AppSidebar
          subscriptionTier={subscriptionTier}
          userEmail={resolvedEmail}
          userName={resolvedName}
        />
      </TooltipProvider>
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  )

  return (
    <UserContext.Provider value={contextValue}>
      <SidebarProvider>
        {chromeShell}
        <SearchCommandDialog />
      </SidebarProvider>
    </UserContext.Provider>
  )
}
