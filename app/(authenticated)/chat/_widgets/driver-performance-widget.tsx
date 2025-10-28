"use client"

import {
  Activity,
  Calendar as CalendarIcon,
  CheckCircle2,
  XCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DriverPerformanceWidgetData } from "@/lib/types/chat"

interface DriverPerformanceWidgetProps {
  data: unknown
}

const FALLBACK_SUMMARY: DriverPerformanceWidgetData = {
  weeklySummary: {
    deliveriesCompleted: 24,
    totalHours: "32h 15m",
    onTimeRate: 91.7,
  },
  recentDeliveries: [
    { siteName: "Downtown Depot", completedAt: "2h ago", status: "delivered" },
    { siteName: "City Mall", completedAt: "4h ago", status: "delivered" },
    { siteName: "North Station", completedAt: "1d ago", status: "delivered" },
  ],
}

const isDriverPerformanceWidgetData = (
  value: unknown
): value is DriverPerformanceWidgetData => {
  if (!value || typeof value !== "object") {
    return false
  }
  const { weeklySummary, recentDeliveries } =
    value as DriverPerformanceWidgetData
  return Boolean(weeklySummary) && Array.isArray(recentDeliveries)
}

export function DriverPerformanceWidget({
  data,
}: DriverPerformanceWidgetProps) {
  const performance = isDriverPerformanceWidgetData(data)
    ? data
    : FALLBACK_SUMMARY

  return (
    <div className="space-y-4">
      <Card className="border bg-background/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="size-5" /> This Week
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Deliveries
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {performance.weeklySummary.deliveriesCompleted}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Hours
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {performance.weeklySummary.totalHours}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              On-Time Rate
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {performance.weeklySummary.onTimeRate}%
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-background/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-5" /> Recent Deliveries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {performance.recentDeliveries.map((delivery, index) => (
            <div
              key={`${delivery.siteName}-${index}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{delivery.siteName}</p>
                <p className="text-xs text-muted-foreground">
                  {delivery.completedAt}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium">
                {delivery.status === "delivered" ? (
                  <>
                    <CheckCircle2 className="size-4 text-emerald-600 dark:text-emerald-300" />
                    <span className="text-emerald-600 dark:text-emerald-300">
                      Delivered
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="size-4 text-red-600 dark:text-red-300" />
                    <span className="text-red-600 dark:text-red-300">
                      Failed
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
