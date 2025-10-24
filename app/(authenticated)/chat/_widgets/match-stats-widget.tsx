"use client"

import { BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { MatchStatsWidgetData } from "@/lib/types/chat"

interface MatchStatsWidgetProps {
  data: unknown
}

const FALLBACK_STATS: MatchStatsWidgetData = {
  stats: [
    { label: "Matches Officiated", value: 24 },
    { label: "Correct Decisions", value: "95%" },
    { label: "Cards Issued", value: 38 },
    { label: "Average Rating", value: 8.6 },
  ],
}

const isMatchStatsWidgetData = (
  value: unknown
): value is MatchStatsWidgetData => {
  if (!value || typeof value !== "object") {
    return false
  }
  const { stats } = value as MatchStatsWidgetData
  return Array.isArray(stats)
}

export function MatchStatsWidget({ data }: MatchStatsWidgetProps) {
  const stats = isMatchStatsWidgetData(data) ? data.stats : FALLBACK_STATS.stats

  return (
    <Card className="h-full border-0 bg-transparent shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <BarChart3 className="size-5" /> Match Statistics
        </CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4 px-0 sm:grid-cols-2">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border bg-background/60 p-4 shadow-sm"
          >
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              {stat.label}
            </p>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
