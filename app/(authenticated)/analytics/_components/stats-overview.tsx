import {
  AlertCircle,
  ClipboardList,
  Clock,
  ShieldAlert,
  Target,
  Trophy,
} from "lucide-react"

import type { OverviewStats } from "@/lib/types/stats"

import { StatsCard } from "./stats-card"

interface StatsOverviewProps {
  /**
   * Overview statistics data
   */
  stats: OverviewStats

  /**
   * Optional loading state
   */
  isLoading?: boolean
}

/**
 * Overview section displaying key match statistics in a grid layout.
 *
 * @example
 * ```tsx
 * <StatsOverview stats={overviewStats} />
 * ```
 */
export function StatsOverview({
  stats,
  isLoading = false,
}: StatsOverviewProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-[120px] animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  const totalCards = stats.totalYellowCards + stats.totalRedCards

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <StatsCard
        title="Total Matches"
        value={stats.totalMatches}
        icon={ClipboardList}
        description="Matches officiated"
      />

      <StatsCard
        title="Total Cards"
        value={totalCards}
        icon={ShieldAlert}
        description={`${stats.totalYellowCards} yellow, ${stats.totalRedCards} red`}
      />

      <StatsCard
        title="Total Goals"
        value={stats.totalGoals}
        icon={Trophy}
        description="Goals witnessed"
      />

      <StatsCard
        title="Avg Cards/Match"
        value={stats.avgCardsPerMatch.toFixed(2)}
        icon={AlertCircle}
        description="Average disciplinary actions"
      />

      <StatsCard
        title="Avg Goals/Match"
        value={stats.avgGoalsPerMatch.toFixed(2)}
        icon={Target}
        description="Average scoring rate"
      />

      <StatsCard
        title="Avg Added Time"
        value={`${stats.avgAddedTimeMinutes.toFixed(1)} min`}
        icon={Clock}
        description="Per half added time"
      />
    </div>
  )
}
