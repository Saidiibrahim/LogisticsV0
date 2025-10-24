"use client"

import { Activity, Calendar as CalendarIcon, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { TrainingSummaryWidgetData } from "@/lib/types/chat"

interface TrainingSummaryWidgetProps {
  data: unknown
}

const FALLBACK_SUMMARY: TrainingSummaryWidgetData = {
  weeklySummary: {
    sessionsCompleted: 5,
    totalDuration: "4h 20m",
    avgIntensity: 7.5,
  },
  recentSessions: [
    { name: "Outdoor Run", duration: "45m", intensity: 8 },
    { name: "Referee Drills", duration: "60m", intensity: 7 },
    { name: "Strength Training", duration: "40m", intensity: 6 },
  ],
}

const isTrainingSummaryWidgetData = (
  value: unknown
): value is TrainingSummaryWidgetData => {
  if (!value || typeof value !== "object") {
    return false
  }
  const { weeklySummary, recentSessions } = value as TrainingSummaryWidgetData
  return Boolean(weeklySummary) && Array.isArray(recentSessions)
}

export function TrainingSummaryWidget({ data }: TrainingSummaryWidgetProps) {
  const summary = isTrainingSummaryWidgetData(data) ? data : FALLBACK_SUMMARY

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
              Sessions
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.weeklySummary.sessionsCompleted}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Total Duration
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.weeklySummary.totalDuration}
            </p>
          </div>
          <div className="rounded-lg bg-muted/40 p-4 text-center">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              Avg. Intensity
            </p>
            <p className="mt-2 text-2xl font-semibold">
              {summary.weeklySummary.avgIntensity}/10
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border bg-background/60 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Activity className="size-5" /> Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {summary.recentSessions.map((session) => (
            <div
              key={`${session.name}-${session.duration}`}
              className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
            >
              <div>
                <p className="font-medium">{session.name}</p>
                <p className="text-xs text-muted-foreground">
                  {session.duration}
                </p>
              </div>
              <div className="flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-300">
                <TrendingUp className="size-4" />
                {session.intensity}/10
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
