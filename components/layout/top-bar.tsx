"use client"

import { usePathname } from "next/navigation"
import { Fragment, useMemo } from "react"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { SidebarTrigger } from "@/components/ui/sidebar"

interface TopBarBreadcrumb {
  label: string
  href?: string
}

interface TopBarProps {
  breadcrumbs?: TopBarBreadcrumb[]
}

const breadcrumbLabels: Record<string, string> = {
  "/welcome": "Dashboard",
  "/calendar": "Calendar",
  "/deliveries": "Deliveries",
  "/routes": "Routes",
  "/chat": "Chat",
  "/settings": "Settings",
}

function formatSegment(segment: string) {
  if (!segment) {
    return ""
  }

  if (/^[0-9a-fA-F-]{8,}$/.test(segment)) {
    return `#${segment.slice(0, 8)}`
  }

  return segment
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

export function TopBar({ breadcrumbs }: TopBarProps) {
  const pathname = usePathname()

  const derivedBreadcrumbs = useMemo<TopBarBreadcrumb[]>(() => {
    if (!pathname) return []

    const segments = pathname.split("/").filter(Boolean)
    let accumulatedPath = ""

    return segments.map((segment, index) => {
      accumulatedPath += `/${segment}`
      const isLast = index === segments.length - 1
      const label = breadcrumbLabels[accumulatedPath] ?? formatSegment(segment)

      return {
        label,
        href: isLast ? undefined : accumulatedPath,
      }
    })
  }, [pathname])

  const breadcrumbItems = breadcrumbs?.length ? breadcrumbs : derivedBreadcrumbs

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between bg-background px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="md:hidden" />

        {breadcrumbItems.length > 0 && (
          <Breadcrumb>
            <BreadcrumbList>
              {breadcrumbItems.map((crumb, index) => (
                <Fragment key={index}>
                  {index > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {crumb.href ? (
                      <BreadcrumbLink href={crumb.href}>
                        {crumb.label}
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}
      </div>
    </header>
  )
}
