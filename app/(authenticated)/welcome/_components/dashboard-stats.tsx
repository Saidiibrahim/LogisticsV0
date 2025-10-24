import { Calendar, Truck, Users, CalendarDays } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
 * Individual stat card component for logistics metrics.
 */
interface StatsCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  description?: string
}

function StatsCard({ title, value, icon: Icon, description }: StatsCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>
        {description && (
          <p className="text-muted-foreground text-xs">{description}</p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Dashboard quick stats section displaying key logistics metrics in a grid layout.
 *
 * Displays four primary metrics:
 * - Active drivers
 * - Scheduled shifts this week
 * - Total vehicles
 * - Upcoming rosters
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
        title="Active Drivers"
        value={stats.activeDrivers}
        icon={Users}
        description="Available for shifts"
      />

      <StatsCard
        title="Shifts This Week"
        value={stats.scheduledShiftsThisWeek}
        icon={CalendarDays}
        description="Scheduled assignments"
      />

      <StatsCard
        title="Total Vehicles"
        value={stats.totalVehicles}
        icon={Truck}
        description="In fleet"
      />

      <StatsCard
        title="Upcoming Rosters"
        value={stats.upcomingRosters}
        icon={Calendar}
        description="Published rosters"
      />
    </div>
  )
}
