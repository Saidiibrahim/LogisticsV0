"use client"

import { format } from "date-fns"
import { Clock, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import {
  type CalendarEvent,
  eventStatusStyles,
  eventTypeColors,
  isMatchEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

/**
 * Shape of the callback consumed by the agenda view when an event is selected.
 */
interface AgendaViewProps {
  onEventClick: (event: CalendarEvent) => void
}

/**
 * Agenda board arranged chronologically with rich metadata for each event.
 */
export function AgendaView({ onEventClick }: AgendaViewProps) {
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

  return (
    <div className="h-full overflow-auto">
      <div className="mx-auto max-w-5xl p-6">
        {filteredEvents.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            No events found
          </div>
        ) : (
          <div className="space-y-4">
            {filteredEvents.map((event) => {
              const typeColor = eventTypeColors[event.type]
              const statusStyle = eventStatusStyles[event.status] ?? {
                className: "",
                label: event.status,
              }

              return (
                <Card
                  key={event.id}
                  className="overflow-hidden hover:bg-muted/50"
                >
                  <button
                    onClick={() => onEventClick(event)}
                    className="w-full p-6 text-left"
                    type="button"
                  >
                    <div className="flex gap-6">
                      {/* Date column */}
                      <div className="flex w-24 flex-col items-center gap-1 border-r pr-6">
                        <div className="font-bold text-2xl text-primary">
                          {format(event.start, "d")}
                        </div>
                        <div className="text-muted-foreground text-sm uppercase">
                          {format(event.start, "MMM")}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {format(event.start, "yyyy")}
                        </div>
                      </div>

                      {/* Content column */}
                      <div className="flex-1 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center gap-2">
                              <div
                                className={cn("size-3 rounded-full", typeColor)}
                              />
                              <h3 className="font-semibold text-lg">
                                {event.title}
                              </h3>
                            </div>
                          </div>

                          <div className="flex flex-col gap-2">
                            <Badge
                              variant="secondary"
                              className={cn(
                                "capitalize",
                                statusStyle.className
                              )}
                            >
                              {statusStyle.label}
                            </Badge>
                            <Badge variant="outline" className="capitalize">
                              {event.type}
                            </Badge>
                          </div>
                        </div>

                        {/* Details grid */}
                        <div className="grid gap-3 sm:grid-cols-2">
                          {/* Time */}
                          <div className="flex items-center gap-2 text-muted-foreground text-sm">
                            <Clock className="size-4 shrink-0" />
                            <span>
                              {format(event.start, "h:mm a")} -{" "}
                              {format(event.end, "h:mm a")}
                            </span>
                          </div>

                          {/* Location */}
                          {event.location && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm">
                              <MapPin className="size-4 shrink-0" />
                              <span>{event.location}</span>
                            </div>
                          )}

                          {/* Teams */}
                          {isMatchEvent(event) && event.teams && (
                            <div className="flex items-center gap-2 text-muted-foreground text-sm sm:col-span-2">
                              <Users className="size-4 shrink-0" />
                              <span>
                                {event.teams.home} vs {event.teams.away}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Notes */}
                        {event.notes && (
                          <p className="rounded-md bg-muted p-3 text-muted-foreground text-sm">
                            {event.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
