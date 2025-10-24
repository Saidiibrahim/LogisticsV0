import type { GroupedMatches } from "@/lib/types/matches"
import { cn } from "@/lib/utils"

import { MatchCard } from "./match-card"

interface MatchListProps {
  matches: GroupedMatches
  className?: string
}

export function MatchList({ matches, className }: MatchListProps) {
  const hasUpcoming = matches.upcoming.length > 0
  const hasRecent = matches.recent.length > 0
  const hasPast = matches.past.length > 0
  const hasAnyMatches = hasUpcoming || hasRecent || hasPast

  if (!hasAnyMatches) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto max-w-md space-y-3">
          <h3 className="font-semibold text-lg">No Matches Yet</h3>
          <p className="text-muted-foreground text-sm">
            You have not recorded or scheduled any matches. Schedule your first
            assignment to start building your match history.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("space-y-8", className)}>
      {hasUpcoming ? (
        <section>
          <div className="mb-4 space-y-1">
            <h2 className="font-semibold text-xl">Upcoming Matches</h2>
            <p className="text-muted-foreground text-sm">
              {matches.upcoming.length} scheduled{" "}
              {matches.upcoming.length === 1 ? "match" : "matches"}
            </p>
          </div>
          <div className="space-y-3">
            {matches.upcoming.map((match) => (
              <MatchCard key={match.id} match={match} type="scheduled" />
            ))}
          </div>
        </section>
      ) : (
        <section>
          <div className="mb-4 space-y-1">
            <h2 className="font-semibold text-xl">Upcoming Matches</h2>
            <p className="text-muted-foreground text-sm">
              No upcoming matches scheduled
            </p>
          </div>
          <div className="rounded-lg border border-dashed bg-muted/50 p-6 text-center text-muted-foreground text-sm">
            Schedule your next assignment to see it here.
          </div>
        </section>
      )}

      {hasRecent && (
        <section>
          <div className="mb-4 space-y-1">
            <h2 className="font-semibold text-xl">Recent Matches</h2>
            <p className="text-muted-foreground text-sm">
              Last 7 days ({matches.recent.length}{" "}
              {matches.recent.length === 1 ? "match" : "matches"})
            </p>
          </div>
          <div className="space-y-3">
            {matches.recent.map((match) => (
              <MatchCard key={match.id} match={match} type="completed" />
            ))}
          </div>
        </section>
      )}

      {hasPast && (
        <section>
          <div className="mb-4 space-y-1">
            <h2 className="font-semibold text-xl">Past Matches</h2>
            <p className="text-muted-foreground text-sm">
              {matches.past.length}{" "}
              {matches.past.length === 1 ? "match" : "matches"}
            </p>
          </div>
          <div className="space-y-3">
            {matches.past.map((match) => (
              <MatchCard key={match.id} match={match} type="completed" />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
