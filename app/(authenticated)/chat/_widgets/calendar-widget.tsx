"use client"

import { Calendar as CalendarIcon, Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { CalendarWidgetData } from "@/lib/types/chat"
import { cn } from "@/lib/utils"

interface CalendarWidgetProps {
  data: unknown
}

const FALLBACK_EVENTS: CalendarWidgetData = {
  events: [
    {
      id: "evt-1",
      title: "Premier League: Arsenal vs Chelsea",
      type: "match",
      date: new Date().toISOString(),
      time: "15:00",
      location: "Emirates Stadium",
    },
    {
      id: "evt-2",
      title: "High-Intensity Training",
      type: "training",
      date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
      time: "10:30",
      location: "St. George's Park",
    },
    {
      id: "evt-3",
      title: "Youth Coaching Clinic",
      type: "coaching",
      date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      time: "18:00",
      location: "Community Center",
    },
  ],
}

const typeStyles: Record<"match" | "training" | "coaching", string> = {
  match: "bg-blue-500/10 text-blue-600 dark:text-blue-300",
  training: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300",
  coaching: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
}

const isCalendarWidgetData = (value: unknown): value is CalendarWidgetData => {
  if (!value || typeof value !== "object") {
    return false
  }
  const { events } = value as CalendarWidgetData
  return Array.isArray(events)
}

const formatDate = (input: string) => {
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) {
    return input
  }
  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    weekday: "short",
  })
}

export function CalendarWidget({ data }: CalendarWidgetProps) {
  const events = (
    isCalendarWidgetData(data) ? data.events : FALLBACK_EVENTS.events
  ).slice(0, 6)

  return (
    <Card className="h-full border-0 bg-transparent shadow-none">
      <CardHeader className="px-0">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarIcon className="size-5" /> Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 px-0">
        {events.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No upcoming events found.
          </p>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              className="rounded-lg border bg-background/60 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-semibold text-sm">{event.title}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      {formatDate(event.date)}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="size-3.5" />
                      {event.time}
                    </span>
                    {event.location ? (
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="size-3.5" />
                        {event.location}
                      </span>
                    ) : null}
                  </div>
                </div>
                <Badge className={cn("capitalize", typeStyles[event.type])}>
                  {event.type.replace("-", " ")}
                </Badge>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  )
}
