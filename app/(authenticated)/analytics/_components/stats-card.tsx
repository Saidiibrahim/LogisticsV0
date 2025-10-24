import type { LucideIcon } from "lucide-react"
import { TrendingDown, TrendingUp } from "lucide-react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatsCardProps {
  /**
   * The title/label for this statistic
   */
  title: string

  /**
   * The main value to display
   */
  value: string | number

  /**
   * Icon component to display
   */
  icon: LucideIcon

  /**
   * Optional description text shown below the value
   */
  description?: string

  /**
   * Optional trend information
   */
  trend?: {
    /** Percentage change value (e.g., 12.5 for +12.5%) */
    value: number
    /** Whether the trend is positive (green) or negative (red) */
    isPositive: boolean
    /** Optional label for the trend (e.g., "vs last period") */
    label?: string
  }

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * Reusable statistics card component for displaying metrics
 *
 * Displays a metric with an icon, value, optional description, and trend indicator.
 *
 * @example
 * ```tsx
 * <StatsCard title="Total Matches" value={24} icon={ClipboardList} />
 * ```
 */
export function StatsCard({
  title,
  value,
  icon: Icon,
  description,
  trend,
  className,
}: StatsCardProps) {
  return (
    <Card className={cn("relative overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="font-medium text-sm">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <div className="font-bold text-2xl">{value}</div>

        {(description || trend) && (
          <div className="mt-1 flex items-center gap-2 text-muted-foreground text-xs">
            {trend && (
              <div
                className={cn(
                  "flex items-center gap-1 font-medium",
                  trend.isPositive
                    ? "text-green-600 dark:text-green-500"
                    : "text-red-600 dark:text-red-500"
                )}
              >
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3" aria-hidden="true" />
                ) : (
                  <TrendingDown className="h-3 w-3" aria-hidden="true" />
                )}
                <span>
                  {trend.value > 0 ? "+" : ""}
                  {trend.value}%
                </span>
                {trend.label && (
                  <span className="text-muted-foreground">{trend.label}</span>
                )}
              </div>
            )}

            {description && !trend && <p>{description}</p>}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
