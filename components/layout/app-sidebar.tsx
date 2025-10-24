"use client"

import { Library } from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

import {
  libraryNavItems,
  libraryNavSections,
  mainNavItems,
} from "./navigation-data"
import { SearchButton } from "./search-button"
import { SidebarHeaderContent } from "./sidebar-header-content"
import { SidebarThemeToggle } from "./sidebar-theme-toggle"
import { SidebarUserMenu } from "./sidebar-user-menu"

/**
 * Optional auth-context data displayed inside the sidebar footer.
 */
interface AppSidebarProps {
  userEmail?: string
  userName?: string
  subscriptionTier?: string
}

/**
 * Primary app navigation surface. Renders top-level routes and a grouped
 * resource library while keeping recent destinations prefetched.
 */
export function AppSidebar({
  userEmail,
  userName,
  subscriptionTier,
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    // Prefetch the most common destinations so navigation feels instant
    const prefetchTargets = new Set<string>([
      ...mainNavItems.map((item) => item.href),
      ...libraryNavItems.map((item) => item.href),
      "/settings",
    ])

    prefetchTargets.forEach((route) => {
      router.prefetch(route)
    })
  }, [router])

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="px-6 py-4 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-3">
        <SidebarHeaderContent />
      </SidebarHeader>

      <SidebarContent>
        <SearchButton />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(`${item.href}/`)

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                    >
                      <Link
                        aria-current={isActive ? "page" : undefined}
                        href={item.href}
                      >
                        <item.icon aria-hidden="true" className="h-4 w-4" />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>
            <Library aria-hidden="true" className="mr-2 h-4 w-4" />
            Resource Library
          </SidebarGroupLabel>
          <SidebarGroupContent className="space-y-4">
            {libraryNavSections.map((section) => {
              const sectionKey =
                section.title ??
                section.items.map((item) => item.href).join(":")

              return (
                <div key={sectionKey}>
                  {section.title ? (
                    <div className="mb-2 flex items-center gap-2 px-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground group-data-[collapsible=icon]:hidden">
                      {section.icon ? (
                        <section.icon aria-hidden="true" className="size-3.5" />
                      ) : null}
                      <span>{section.title}</span>
                    </div>
                  ) : null}

                  <SidebarMenu>
                    {section.items.map((item) => {
                      const isActive =
                        pathname === item.href ||
                        pathname.startsWith(`${item.href}/`)

                      return (
                        <SidebarMenuItem key={item.href}>
                          <SidebarMenuButton
                            asChild
                            isActive={isActive}
                            tooltip={item.title}
                          >
                            <Link
                              aria-current={isActive ? "page" : undefined}
                              href={item.href}
                            >
                              <item.icon
                                aria-hidden="true"
                                className="h-4 w-4"
                              />
                              <span>{item.title}</span>
                            </Link>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      )
                    })}
                  </SidebarMenu>
                </div>
              )
            })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4">
        <SidebarThemeToggle />
        <SidebarUserMenu
          subscriptionTier={subscriptionTier}
          userEmail={userEmail}
          userName={userName}
        />
      </SidebarFooter>
    </Sidebar>
  )
}
