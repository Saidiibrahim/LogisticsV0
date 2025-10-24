import { Calendar, ClipboardList, ShieldAlert, Star } from "lucide-react"

import { StatsCard } from "@/app/(authenticated)/analytics/_components/stats-card"
import type { DashboardQuickStats } from "@/lib/types/dashboard"

/**
 * Properties for the `DashboardStats` component.
 */
interface DashboardStatsProps {
  /**
   * Quick statistics data aggregated for the dashboard.
   */
  stats: DashboardQuickStats

  /**
   * Optional loading state that renders skeleton placeholders.
   */
  isLoading?: boolean
}

/**
 * Dashboard quick stats section displaying key metrics in a grid layout.
 *
 * Displays four primary metrics:
 * - Matches this month
 * - Upcoming matches count
 * - Recent average rating
 * - Total cards in last 30 days
 *
 * @example
 * ```tsx
 * <DashboardStats stats={quickStats} />
 * ```
 */
export function DashboardStats({
  stats,
  isLoading = false,
}: DashboardStatsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[120px] animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <StatsCard
        title="Matches This Month"
        value={stats.matchesThisMonth}
        icon={ClipboardList}
        description="Completed this month"
      />

      <StatsCard
        title="Upcoming Matches"
        value={stats.upcomingMatchesCount}
        icon={Calendar}
        description="Scheduled matches"
      />

      <StatsCard
        title="Recent Avg Rating"
        value={
          stats.recentAvgRating !== null
            ? stats.recentAvgRating.toFixed(1)
            : "N/A"
        }
        icon={Star}
        description="Last 30 days"
      />

      <StatsCard
        title="Total Cards"
        value={stats.totalCardsLast30Days}
        icon={ShieldAlert}
        description="Last 30 days"
      />
    </div>
  )
}
