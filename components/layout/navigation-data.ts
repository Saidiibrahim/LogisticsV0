"use client"

import {
  Calendar,
  ClipboardList,
  FileText,
  LayoutDashboard,
  MessageSquare,
  TrendingUp,
} from "lucide-react"
import { ComponentType, SVGProps } from "react"

/**
 * Shared metadata for entries rendered in the sidebar and command palette.
 */
export type NavigationItem = {
  title: string
  href: string
  icon: ComponentType<SVGProps<SVGSVGElement>>
}

/**
 * Grouping structure for the resource library section.
 */
export type LibraryNavSection = {
  title?: string
  icon?: ComponentType<SVGProps<SVGSVGElement>>
  items: NavigationItem[]
}

/**
 * Main application destinations rendered near the top of the sidebar.
 */
export const mainNavItems: NavigationItem[] = [
  {
    title: "Welcome",
    icon: LayoutDashboard,
    href: "/welcome",
  },
  {
    title: "Calendar",
    icon: Calendar,
    href: "/calendar",
  },
  {
    title: "Matches",
    icon: ClipboardList,
    href: "/matches",
  },
  {
    title: "Stats",
    icon: TrendingUp,
    href: "/analytics",
  },
  {
    title: "Chat",
    icon: MessageSquare,
    href: "/chat",
  },
]

/**
 * Library sections displayed below the main navigation.
 */
export const libraryNavSections: LibraryNavSection[] = [
  {
    items: [
      {
        title: "Assessments",
        icon: FileText,
        href: "/library/assessments",
      },
    ],
  },
]

/**
 * Flat list of library items used by features that do not care about grouping.
 */
export const libraryNavItems: NavigationItem[] = libraryNavSections.flatMap(
  (section) => section.items
)
