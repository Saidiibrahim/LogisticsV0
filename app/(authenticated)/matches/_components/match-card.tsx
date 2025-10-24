"use client"

import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Match, ScheduledMatch } from "@/lib/types/matches"
import { cn } from "@/lib/utils"

interface MatchCardProps {
  match: Match | ScheduledMatch
  type: "completed" | "scheduled"
  className?: string
}

export function MatchCard({ match, type, className }: MatchCardProps) {
  const isCompleted = type === "completed"
  const date = new Date(
    isCompleted
      ? (match as Match).started_at
      : (match as ScheduledMatch).kickoff_at
  )

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    ...(isCompleted
      ? {}
      : {
          hour: "numeric",
          minute: "2-digit",
        }),
  }).format(date)

  return (
    <Link
      href={`/matches/${match.id}`}
      className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <Card
        className={cn(
          "transition-colors hover:bg-accent/50 sm:py-4",
          className
        )}
      >
        <CardContent className="flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex w-full flex-wrap items-center gap-2 sm:gap-3">
              <span className="font-medium leading-tight truncate">
                {match.home_team_name}
              </span>

              {isCompleted ? (
                <>
                  <span className="font-semibold text-lg">
                    {(match as Match).home_score}
                  </span>
                  <span className="text-muted-foreground">-</span>
                  <span className="font-semibold text-lg">
                    {(match as Match).away_score}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground text-sm">vs</span>
              )}

              <span className="font-medium leading-tight truncate">
                {match.away_team_name}
              </span>
            </div>

            {(match.competition_name || match.venue_name) && (
              <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm">
                {match.competition_name && (
                  <span className="truncate">{match.competition_name}</span>
                )}
                {match.competition_name && match.venue_name && <span>•</span>}
                {match.venue_name && (
                  <span className="truncate">{match.venue_name}</span>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-shrink-0 items-end justify-end gap-2 sm:flex-col sm:items-end sm:gap-3">
            <Badge variant={isCompleted ? "secondary" : "default"}>
              {isCompleted ? "Completed" : "Scheduled"}
            </Badge>
            <span className="text-muted-foreground text-sm whitespace-nowrap">
              {formattedDate}
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
