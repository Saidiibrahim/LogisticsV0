import { format, parseISO } from "date-fns"
import { CalendarClock, Plus, Truck, User } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardUpcomingAssignment } from "@/lib/types/dashboard"
import { cn } from "@/lib/utils"

/**
 * Properties for the `UpcomingAssignmentsSection` component.
 */
interface UpcomingAssignmentsSectionProps {
  /**
   * List of upcoming driver assignments.
   */
  assignments: DashboardUpcomingAssignment[]

  /**
   * Optional loading state when data is being fetched.
   */
  isLoading?: boolean
}

/**
 * Format ISO date string to human-readable format.
 * Example output: "Mon, Jan 15"
 */
function formatAssignmentDate(isoDate: string): string {
  try {
    const date = parseISO(isoDate)
    return format(date, "EEE, MMM d")
  } catch {
    return isoDate
  }
}

/**
 * Individual upcoming assignment card component.
 */
function UpcomingAssignmentCard({
  assignment,
}: {
  assignment: DashboardUpcomingAssignment
}) {
  return (
    <div
      className={cn(
        "group block rounded-lg border p-4 transition-colors",
        "hover:bg-muted/60"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Date Column */}
        <div className="flex min-w-[120px] items-center gap-1.5 text-muted-foreground text-xs md:flex-col md:items-start md:gap-1">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatAssignmentDate(assignment.date)}</span>
        </div>

        {/* Assignment Details Column */}
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm leading-tight flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            {assignment.driverName}
          </div>

          {assignment.vanName && (
            <div className="flex items-center gap-1 text-muted-foreground text-xs">
              <Truck className="h-3 w-3" aria-hidden="true" />
              <span>{assignment.vanName}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Section displaying upcoming driver assignments on the dashboard.
 *
 * Shows the next several assignments with date, driver name, and vehicle.
 * Includes empty state with CTA when no assignments are scheduled.
 */
export function UpcomingAssignmentsSection({
  assignments,
  isLoading = false,
}: UpcomingAssignmentsSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Upcoming Assignments</CardTitle>
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

  if (assignments.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Upcoming Assignments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-6 text-center">
            <div
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground"
              )}
            >
              <CalendarClock className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-lg">No upcoming assignments</h3>
              <p className="max-w-sm text-muted-foreground text-sm">
                You have no driver assignments scheduled yet. Create a weekly
                roster to assign drivers.
              </p>
            </div>
            <Button asChild>
              <Link href="/calendar">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
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
        <CardTitle>Upcoming Assignments</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {assignments.map((assignment) => (
            <UpcomingAssignmentCard
              key={assignment.id}
              assignment={assignment}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
