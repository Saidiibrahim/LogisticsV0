"use client"

import {
  eachDayOfInterval,
  endOfWeek,
  format,
  isSameDay,
  isToday,
  startOfWeek,
} from "date-fns"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import {
  type CalendarEvent,
  eventTypeColors,
  isShiftEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

/**
 * Props that connect the timeline view to the higher-level calendar shell.
 */
interface TimelineViewProps {
  onEventClick: (event: CalendarEvent) => void
}

/**
 * Weekly timeline view that groups events by type and day to highlight busy
 * stretches at a glance.
 */
export function TimelineView({ onEventClick }: TimelineViewProps) {
  const { selectedDate, events, filters } = useCalendarStore()

  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Filter events
  const filteredEvents = events.filter((event) => {
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
        (isShiftEvent(event) &&
          event.driver_name?.toLowerCase().includes(query)) ||
        (isShiftEvent(event) && event.route_name?.toLowerCase().includes(query))
      if (!matchesSearch) {
        return false
      }
    }
    return true
  })

  // Group events by type for rows
  const eventTypes = Array.from(new Set(filteredEvents.map((e) => e.type)))

  // Get events for a specific type and day
  const getEventsForTypeAndDay = (type: string, day: Date) => {
    return filteredEvents.filter(
      (event) => event.type === type && isSameDay(event.start, day)
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="border-r px-4 py-3 text-left font-medium text-sm">
          Category
        </div>
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className="border-r px-2 py-3 text-center last:border-r-0"
          >
            <div
              className={cn(
                "font-medium text-sm",
                isToday(day) && "text-primary"
              )}
            >
              {format(day, "EEE")}
            </div>
            <div
              className={cn(
                "mt-1 inline-flex size-7 items-center justify-center rounded-full text-sm",
                isToday(day) && "bg-primary font-bold text-primary-foreground"
              )}
            >
              {format(day, "d")}
            </div>
          </div>
        ))}
      </div>

      {/* Timeline rows */}
      <div className="flex-1 overflow-auto">
        {eventTypes.length === 0 ? (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No events found
          </div>
        ) : (
          <div className="min-h-full">
            {eventTypes.map((type) => {
              const bgColor = eventTypeColors[type]

              return (
                <div key={type} className="grid grid-cols-8 border-b">
                  {/* Type label */}
                  <div className="flex items-center border-r px-4 py-6">
                    <div className="flex items-center gap-2">
                      <div className={cn("size-3 rounded", bgColor)} />
                      <span className="font-medium text-sm capitalize">
                        {type}
                      </span>
                    </div>
                  </div>

                  {/* Day cells */}
                  {weekDays.map((day) => {
                    const dayEvents = getEventsForTypeAndDay(type, day)

                    return (
                      <div
                        key={day.toISOString()}
                        className="min-h-[100px] border-r p-2 last:border-r-0"
                      >
                        <div className="space-y-1">
                          {dayEvents.map((event) => (
                            <button
                              key={event.id}
                              onClick={() => onEventClick(event)}
                              className={cn(
                                "w-full rounded px-2 py-1.5 text-left text-xs hover:opacity-80",
                                bgColor
                              )}
                              type="button"
                            >
                              <div className="font-medium text-white">
                                {format(event.start, "h:mm a")}
                              </div>
                              <div className="truncate text-white">
                                {event.title}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
