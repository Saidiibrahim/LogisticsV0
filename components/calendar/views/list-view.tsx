"use client"

import { format, isSameDay } from "date-fns"
import { Clock, MapPin } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import {
  type CalendarEvent,
  eventStatusStyles,
  eventTypeColors,
  isMatchEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

/**
 * Props consumed by the list view variant when the user interacts with events.
 */
interface ListViewProps {
  onEventClick: (event: CalendarEvent) => void
}

/**
 * Groups events by day and renders them in a vertically stacked list.
 */
export function ListView({ onEventClick }: ListViewProps) {
  const { events, filters } = useCalendarStore()

  // Filter and sort events
  const filteredEvents = events
    .filter((event) => {
      if (!filters.eventTypes.includes(event.type)) {
        return false
      }
      if (!filters.eventStatuses.includes(event.status)) {
        return false
      }
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase()
        const matchesSearch =
          event.title.toLowerCase().includes(query) ||
          event.location?.toLowerCase().includes(query) ||
          (isMatchEvent(event) &&
            (event.teams?.home.toLowerCase().includes(query) ||
              event.teams?.away.toLowerCase().includes(query)))
        if (!matchesSearch) {
          return false
        }
      }
      return true
    })
    .sort((a, b) => a.start.getTime() - b.start.getTime())

  // Group events by date
  const groupedEvents = filteredEvents.reduce(
    (acc, event) => {
      const dateKey = format(event.start, "yyyy-MM-dd")
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, CalendarEvent[]>
  )

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-4xl p-6">
        {Object.keys(groupedEvents).length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No events found
          </div>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedEvents).map(([dateKey, dayEvents]) => {
              const date = new Date(dateKey)
              const isToday = isSameDay(date, new Date())

              return (
                <div key={dateKey} className="space-y-3">
                  <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background pb-2">
                    <h3
                      className={cn(
                        "font-semibold text-lg",
                        isToday && "text-primary"
                      )}
                    >
                      {format(date, "EEEE, MMMM d, yyyy")}
                    </h3>
                    {isToday && (
                      <Badge variant="default" className="text-xs">
                        Today
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    {dayEvents.map((event) => {
                      const typeColor = eventTypeColors[event.type]
                      const statusColor = eventStatusStyles[event.status] ?? {
                        className: "",
                        label: event.status,
                      }

                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="w-full rounded-lg border bg-card p-4 text-left hover:bg-muted/50"
                          type="button"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1 space-y-2">
                              {/* Time and Title */}
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                  <Clock className="size-4" />
                                  <span>
                                    {format(event.start, "h:mm a")} -{" "}
                                    {format(event.end, "h:mm a")}
                                  </span>
                                </div>
                                <div
                                  className={cn(
                                    "size-2 rounded-full",
                                    typeColor
                                  )}
                                />
                              </div>

                              <h4 className="font-semibold text-base">
                                {event.title}
                              </h4>

                              {/* Teams */}
                              {isMatchEvent(event) && event.teams && (
                                <div className="text-muted-foreground text-sm">
                                  {event.teams.home} vs {event.teams.away}
                                </div>
                              )}

                              {/* Location */}
                              {event.location && (
                                <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
                                  <MapPin className="size-4" />
                                  <span>{event.location}</span>
                                </div>
                              )}

                              {/* Notes */}
                              {event.notes && (
                                <p className="text-muted-foreground text-sm">
                                  {event.notes}
                                </p>
                              )}
                            </div>

                            {/* Status Badge */}
                            <div className="flex flex-col items-end gap-2">
                              <Badge
                                variant="secondary"
                                className={cn(
                                  "capitalize",
                                  statusColor.className
                                )}
                              >
                                {statusColor.label}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {event.type}
                              </Badge>
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
