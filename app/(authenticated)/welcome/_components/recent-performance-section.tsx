import { AlertCircle, ChevronRight, ShieldAlert, Star } from "lucide-react"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DashboardRecentMatch } from "@/lib/types/dashboard"
import { cn } from "@/lib/utils"

/**
 * Properties for the `RecentPerformanceSection` component.
 */
interface RecentPerformanceSectionProps {
  /**
   * List of recent completed matches.
   */
  matches: DashboardRecentMatch[]

  /**
   * Optional loading state when data is being fetched.
   */
  isLoading?: boolean
}

/**
 * Format ISO date to short format.
 * Example output: "Jan 15, 2025"
 */
function formatMatchDate(isoDate: string): string {
  const date = new Date(isoDate)

  if (Number.isNaN(date.getTime())) {
    return "Date TBA"
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date)
}

/**
 * Get background and text color classes for rating badge.
 */
function getRatingColor(rating: number): string {
  if (rating >= 4) {
    return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
  }
  if (rating >= 3) {
    return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
  }
  if (rating >= 2) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
  }
  return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
}

/**
 * Individual recent match row component.
 */
function RecentMatchRow({ match }: { match: DashboardRecentMatch }) {
  const hasCards = match.totalCards > 0
  const rating = match.rating !== null ? Number(match.rating.toFixed(1)) : null
  const matchLabel = `${match.homeTeamName} vs ${match.awayTeamName}`

  const cardSummary = [
    match.yellowCards > 0 ? `${match.yellowCards}Y` : null,
    match.redCards > 0 ? `${match.redCards}R` : null,
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <Link
      href={`/matches/${match.id}`}
      aria-label={`View details for ${matchLabel}`}
      className={cn(
        "group flex items-center gap-3 rounded-lg border p-3 transition-colors",
        "hover:bg-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      {/* Date */}
      <div className="min-w-[96px] text-muted-foreground text-xs">
        {formatMatchDate(match.startedAt)}
      </div>

      {/* Teams & Score */}
      <div className="flex-1">
        <div className="font-medium text-sm leading-tight">
          {match.homeTeamName}{" "}
          <span className="text-muted-foreground font-normal">
            {match.homeScore}-{match.awayScore}
          </span>{" "}
          {match.awayTeamName}
        </div>
        {match.competitionName && (
          <div className="text-muted-foreground text-xs">
            {match.competitionName}
          </div>
        )}
      </div>

      {/* Cards */}
      {hasCards ? (
        <div className="flex items-center gap-1 text-muted-foreground text-xs">
          <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
          <span>{cardSummary}</span>
        </div>
      ) : (
        <div className="text-muted-foreground text-xs">0 cards</div>
      )}

      {/* Rating */}
      {rating !== null ? (
        <Badge className={cn("gap-1", getRatingColor(rating))}>
          <Star className="h-3 w-3" fill="currentColor" aria-hidden="true" />
          <span>{rating.toFixed(1)}</span>
        </Badge>
      ) : (
        <Badge
          variant="outline"
          className="gap-1 text-muted-foreground"
          aria-label="No rating submitted"
        >
          <Star className="h-3 w-3" aria-hidden="true" />
          <span>No rating</span>
        </Badge>
      )}

      <ChevronRight
        className="h-4 w-4 text-muted-foreground transition-transform duration-150 group-hover:translate-x-1"
        aria-hidden="true"
      />
    </Link>
  )
}

/**
 * Section displaying recent completed matches on the dashboard.
 *
 * Shows the last 5 matches with date, score, cards, and rating.
 * Includes empty state when no matches have been completed.
 *
 * @example
 * ```tsx
 * <RecentPerformanceSection matches={recentMatches} />
 * ```
 */
export function RecentPerformanceSection({
  matches,
  isLoading = false,
}: RecentPerformanceSectionProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-[60px] animate-pulse rounded-lg bg-muted/70"
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
        <CardHeader>
          <CardTitle>Recent Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center gap-4 py-8 text-center">
            <div className="rounded-full bg-muted p-3">
              <AlertCircle
                className="h-6 w-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold text-sm">No Completed Matches</h3>
              <p className="text-muted-foreground text-xs">
                Complete your first match to see performance metrics here.
              </p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/matches">View Matches</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle>Recent Performance</CardTitle>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/analytics">View Analytics</Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {matches.map((match) => (
            <RecentMatchRow key={match.id} match={match} />
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
