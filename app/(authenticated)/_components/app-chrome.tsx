"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

import { AppSidebar } from "@/components/layout/app-sidebar"
import { SearchCommandDialog } from "@/components/layout/search-command-dialog"
import { TopBar } from "@/components/layout/top-bar"
import { SidebarProvider } from "@/components/ui/sidebar"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  selectClearUser,
  selectSetUserProfile,
  useUserStore,
} from "@/lib/stores/use-user-store"

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
  /** Authenticated user's email address for display in sidebar menu */
  userEmail?: string
  /** Authenticated user's friendly display name */
  userName?: string
  /** Subscription tier label resolved from Supabase metadata */
  subscriptionTier?: string
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
 *   const { data } = await getSessionClaims()
 *   return <AppChrome userEmail={data?.claims?.email}>{children}</AppChrome>
 * }
 * ```
 *
 * @param props - Component props
 * @returns The rendered application chrome with nested content
 */
export function AppChrome({
  children,
  userEmail,
  userName,
  subscriptionTier,
}: AppChromeProps) {
  const pathname = usePathname()
  const setUserProfileInStore = useUserStore(selectSetUserProfile)
  const clearUserInStore = useUserStore(selectClearUser)

  const isFullPage = pathname ? FULL_PAGE_ROUTES.has(pathname) : false

  useEffect(() => {
    setUserProfileInStore({
      email: userEmail,
      name: userName,
      subscriptionTier,
    })
    return () => {
      clearUserInStore()
    }
  }, [
    clearUserInStore,
    setUserProfileInStore,
    subscriptionTier,
    userEmail,
    userName,
  ])

  if (isFullPage) {
    return (
      <SidebarProvider>
        <div className="min-h-screen w-full bg-neutral-950 text-neutral-50">
          {children}
        </div>
        <SearchCommandDialog />
      </SidebarProvider>
    )
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        {/* Sidebar with tooltip support for navigation items */}
        <TooltipProvider delayDuration={0}>
          <AppSidebar
            subscriptionTier={subscriptionTier}
            userEmail={userEmail}
            userName={userName}
          />
        </TooltipProvider>

        {/* Main content area */}
        <div className="flex flex-1 flex-col">
          <TopBar />
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
      <SearchCommandDialog />
    </SidebarProvider>
  )
}
