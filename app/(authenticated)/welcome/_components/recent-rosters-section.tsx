import { Calendar, CheckCircle2, Clock, Edit3, FileText } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardRecentRoster } from "@/lib/types/dashboard"
import { cn } from "@/lib/utils"
import { format, parseISO } from "date-fns"

/**
 * Properties for the `RecentRostersSection` component.
 */
interface RecentRostersSectionProps {
  /**
   * List of recent rosters.
   */
  rosters: DashboardRecentRoster[]

  /**
   * Optional loading state when data is being fetched.
   */
  isLoading?: boolean
}

/**
 * Format ISO date string to human-readable format.
 * Example output: "Week of Jan 15"
 */
function formatWeekDate(isoDate: string): string {
  try {
    const date = parseISO(isoDate)
    return `Week of ${format(date, "MMM d")}`
  } catch {
    return isoDate
  }
}

/**
 * Format last updated timestamp.
 */
function formatLastUpdated(isoDate: string): string {
  try {
    const date = parseISO(isoDate)
    return format(date, "MMM d, h:mm a")
  } catch {
    return "Unknown"
  }
}

/**
 * Get status badge variant and label.
 */
function getStatusBadge(status: string) {
  switch (status) {
    case "published":
      return { variant: "default" as const, label: "Published", icon: CheckCircle2 }
    case "draft":
      return { variant: "secondary" as const, label: "Draft", icon: Edit3 }
    case "modified":
      return { variant: "outline" as const, label: "Modified", icon: Edit3 }
    default:
      return { variant: "outline" as const, label: status, icon: FileText }
  }
}

/**
 * Individual recent roster card component.
 */
function RecentRosterCard({ roster }: { roster: DashboardRecentRoster }) {
  const statusBadge = getStatusBadge(roster.status)
  const StatusIcon = statusBadge.icon

  return (
    <div
      className={cn(
        "group block rounded-lg border p-4 transition-colors",
        "hover:bg-muted/60"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between md:gap-4">
        {/* Roster Info Column */}
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium text-sm">{formatWeekDate(roster.weekStart)}</span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{roster.assignmentsCount} assignment{roster.assignmentsCount !== 1 ? "s" : ""}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Updated {formatLastUpdated(roster.lastUpdated)}</span>
            </div>
          </div>
        </div>

        {/* Status Badge */}
        <Badge variant={statusBadge.variant} className="self-start">
          <StatusIcon className="mr-1 h-3 w-3" />
          {statusBadge.label}
        </Badge>
      </div>
    </div>
  )
}

/**
 * Section displaying recent roster activity on the dashboard.
 *
 * Shows recently created or modified rosters with status and assignment counts.
 * Includes empty state when no rosters exist.
 */
export function RecentRostersSection({
  rosters,
  isLoading = false,
}: RecentRostersSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Recent Rosters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[92px] animate-pulse rounded-lg bg-muted/70"
              />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (rosters.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Recent Rosters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              )}
            >
              <Calendar className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No rosters yet</h3>
              <p className="max-w-sm text-muted-foreground text-sm">
                You haven&apos;t created any rosters yet. Start by creating a weekly
                roster to manage driver assignments.
              </p>
            </div>
            <Button asChild>
              <Link href="/calendar">
                <Calendar className="mr-2 h-4 w-4" aria-hidden="true" />
                Create Roster
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Rosters</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {rosters.map((roster) => (
            <RecentRosterCard key={roster.id} roster={roster} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
