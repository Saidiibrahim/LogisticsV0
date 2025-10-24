import { CalendarClock, MapPin, Plus, Trophy } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardUpcomingMatch } from "@/lib/types/dashboard"
import { cn } from "@/lib/utils"

/**
 * Properties for the `UpcomingMatchesSection` component.
 */
interface UpcomingMatchesSectionProps {
  /**
   * List of upcoming scheduled matches.
   */
  matches: DashboardUpcomingMatch[]

  /**
   * Optional loading state when data is being fetched.
   */
  isLoading?: boolean
}

/**
 * Format ISO date string to human-readable format.
 * Example output: "Mon, Jan 15 at 3:00 PM"
 */
function formatMatchDateTime(isoDate: string): string {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return "TBD"
  }

  const dayFormatter = new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  })

  const timeFormatter = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })

  return `${dayFormatter.format(date)} at ${timeFormatter.format(date)}`
}

/**
 * Individual upcoming match card component.
 */
function UpcomingMatchCard({ match }: { match: DashboardUpcomingMatch }) {
  const matchLabel = `${match.homeTeamName} vs ${match.awayTeamName}`

  return (
    <Link
      href={`/matches/${match.id}`}
      aria-label={`View details for ${matchLabel}`}
      className={cn(
        "group block rounded-lg border p-4 transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:gap-4">
        {/* Date/Time Column */}
        <div className="flex min-w-[140px] items-center gap-1.5 text-muted-foreground text-xs md:flex-col md:items-start md:gap-1">
          <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{formatMatchDateTime(match.kickoffAt)}</span>
        </div>

        {/* Match Details Column */}
        <div className="flex-1 space-y-1">
          <div className="font-medium text-sm leading-tight">
            {match.homeTeamName}{" "}
            <span className="text-muted-foreground">vs</span>{" "}
            {match.awayTeamName}
          </div>

          <div className="flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground text-xs">
            {match.competitionName && (
              <div className="flex items-center gap-1">
                <Trophy className="h-3 w-3" aria-hidden="true" />
                <span>{match.competitionName}</span>
              </div>
            )}
            {match.venueName && (
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                <span>{match.venueName}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

/**
 * Section displaying upcoming scheduled matches on the dashboard.
 *
 * Shows the next 3-5 matches with date, teams, competition, and venue.
 * Includes empty state with CTA when no matches are scheduled.
 *
 * @example
 * ```tsx
 * <UpcomingMatchesSection matches={upcomingMatches} />
 * ```
 */
export function UpcomingMatchesSection({
  matches,
  isLoading = false,
}: UpcomingMatchesSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Upcoming Matches</CardTitle>
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

  if (matches.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Upcoming Matches</CardTitle>
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
              <h3 className="font-semibold text-lg">No upcoming matches</h3>
              <p className="max-w-sm text-muted-foreground text-sm">
                You have no matches scheduled yet. Create a match to keep your
                calendar up to date.
              </p>
            </div>
            <Button asChild>
              <Link href="/matches/create">
                <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
                Schedule a Match
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
        <CardTitle>Upcoming Matches</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/calendar">View All</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {matches.map((match) => (
            <UpcomingMatchCard key={match.id} match={match} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
