"use client"

import { format } from "date-fns"
import { useRouter } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { RecentMatch } from "@/lib/types/stats"

interface RecentMatchesTableProps {
  /**
   * Array of recent match data
   */
  matches: RecentMatch[]

  /**
   * Optional loading state
   */
  isLoading?: boolean
}

/**
 * Table component displaying recent matches with key statistics.
 *
 * @example
 * ```tsx
 * <RecentMatchesTable matches={recentMatches} />
 * ```
 */
export function RecentMatchesTable({
  matches,
  isLoading = false,
}: RecentMatchesTableProps) {
  const router = useRouter()

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (matches.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-8 text-center">
        <p className="text-muted-foreground text-sm">
          No matches found for this period
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Match</TableHead>
            <TableHead>Competition</TableHead>
            <TableHead className="text-center">Cards</TableHead>
            <TableHead className="text-center">Rating</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {matches.map((match) => {
            const matchDate = new Date(match.startedAt)
            const formattedDate = Number.isNaN(matchDate.getTime())
              ? "—"
              : format(matchDate, "MMM d, yyyy")
            const hasYellowCards = match.yellowCards > 0
            const hasRedCards = match.redCards > 0
            const ratingDisplay =
              match.rating !== null && match.rating !== undefined
                ? `${match.rating}/5`
                : null
            const rowLabel = `${match.homeTeamName} vs ${
              match.awayTeamName
            } on ${formattedDate === "—" ? "unknown date" : formattedDate}`

            return (
              <TableRow
                key={match.id}
                onClick={() => router.push(`/matches/${match.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault()
                    router.push(`/matches/${match.id}`)
                  }
                }}
                role="link"
                tabIndex={0}
                aria-label={rowLabel}
                className="cursor-pointer outline-none transition hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <TableCell className="min-w-[120px]">
                  <time dateTime={match.startedAt}>{formattedDate}</time>
                </TableCell>
                <TableCell className="min-w-[220px]">
                  <div className="inline-flex flex-col gap-1">
                    <span className="font-medium">
                      {match.homeTeamName} vs {match.awayTeamName}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {match.homeScore} - {match.awayScore}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="min-w-[180px]">
                  {match.competitionName ?? "—"}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    {hasYellowCards ? (
                      <Badge className="bg-yellow-100 text-yellow-900 dark:bg-yellow-500/20 dark:text-yellow-100">
                        {match.yellowCards}Y
                      </Badge>
                    ) : null}
                    {hasRedCards ? (
                      <Badge className="bg-red-100 text-red-900 dark:bg-red-500/20 dark:text-red-100">
                        {match.redCards}R
                      </Badge>
                    ) : null}
                    {!hasYellowCards && !hasRedCards ? (
                      <span className="text-muted-foreground">—</span>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  {ratingDisplay ? (
                    <Badge variant="secondary">{ratingDisplay}</Badge>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
