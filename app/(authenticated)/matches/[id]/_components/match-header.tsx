import { Badge } from "@/components/ui/badge"
import type { Match, MatchStatus, ScheduledMatch } from "@/lib/types/matches"
import { cn } from "@/lib/utils"

interface MatchHeaderProps {
  match: Match | ScheduledMatch
  isCompleted: boolean
}

const statusClasses: Record<MatchStatus, string> = {
  completed:
    "bg-emerald-500/15 text-emerald-700 ring-emerald-500/20 dark:text-emerald-300",
  in_progress: "bg-sky-500/15 text-sky-700 ring-sky-500/20 dark:text-sky-300",
  scheduled:
    "bg-purple-500/15 text-purple-700 ring-purple-500/20 dark:text-purple-300",
  canceled: "bg-rose-500/15 text-rose-700 ring-rose-500/20 dark:text-rose-300",
}

function formatStatusLabel(status: MatchStatus) {
  return status
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

export function MatchHeader({ match, isCompleted }: MatchHeaderProps) {
  const statusLabel = formatStatusLabel(match.status as MatchStatus)

  return (
    <div className="space-y-6 text-center">
      <Badge
        className={cn(
          "px-3 py-1 text-xs font-semibold uppercase tracking-wide",
          statusClasses[match.status]
        )}
      >
        {statusLabel}
      </Badge>

      <div className="flex flex-col items-center gap-6 md:flex-row md:justify-center md:gap-10">
        <div className="space-y-2 md:text-left">
          <h2 className="font-bold text-2xl md:text-3xl">
            {match.home_team_name}
          </h2>
          <p className="text-muted-foreground text-sm">Home</p>
        </div>

        {isCompleted ? (
          <div className="flex items-center gap-4 rounded-lg bg-muted px-6 py-3 font-bold text-4xl md:text-5xl">
            <span>{(match as Match).home_score}</span>
            <span className="text-muted-foreground text-2xl md:text-3xl">
              -
            </span>
            <span>{(match as Match).away_score}</span>
          </div>
        ) : (
          <div className="rounded-lg bg-muted px-6 py-3 text-muted-foreground text-2xl md:text-3xl">
            vs
          </div>
        )}

        <div className="space-y-2 md:text-right">
          <h2 className="font-bold text-2xl md:text-3xl">
            {match.away_team_name}
          </h2>
          <p className="text-muted-foreground text-sm">Away</p>
        </div>
      </div>
    </div>
  )
}
