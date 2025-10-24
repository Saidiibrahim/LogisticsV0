"use client"

import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isAfter,
  isBefore,
  isSameDay,
  isSameMonth,
  isToday,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import {
  type CalendarEvent,
  eventTypeColors,
  isMatchEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

/**
 * Internal props for the condensed event chip rendered inside each day cell.
 */
interface EventItemProps {
  event: CalendarEvent
  onClick: (event: CalendarEvent) => void
}

/**
 * Compact representation of an event inside the month grid.
 */
function EventItem({ event, onClick }: EventItemProps) {
  const bgColor = eventTypeColors[event.type]

  return (
    <button
      onClick={() => onClick(event)}
      className={cn(
        "group mb-1 w-full rounded px-1 py-0.5 text-left text-xs hover:opacity-80",
        bgColor
      )}
      type="button"
    >
      <div className="flex items-center gap-1 text-white">
        <span className="truncate font-medium">{event.title}</span>
      </div>
    </button>
  )
}

/**
 * Event handler contract supplied by the calendar shell.
 */
interface MonthViewProps {
  onEventClick: (event: CalendarEvent) => void
}

/**
 * Standard month grid calendar that supports filtering and quick event access.
 */
export function MonthView({ onEventClick }: MonthViewProps) {
  const { selectedDate, events, filters } = useCalendarStore()

  // Get the calendar grid days
  const monthStart = startOfMonth(selectedDate)
  const monthEnd = endOfMonth(selectedDate)
  const calendarStart = startOfWeek(monthStart)
  const calendarEnd = endOfWeek(monthEnd)

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

  // Filter events based on current filters
  const filteredEvents = events.filter((event) => {
    // Type filter
    if (!filters.eventTypes.includes(event.type)) {
      return false
    }

    // Status filter
    if (!filters.eventStatuses.includes(event.status)) {
      return false
    }

    // Search filter
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase()
      let matchesSearch =
        event.title.toLowerCase().includes(query) ||
        event.location?.toLowerCase().includes(query)

      // Match-specific search
      if (isMatchEvent(event) && event.teams) {
        matchesSearch =
          matchesSearch ||
          event.teams.home.toLowerCase().includes(query) ||
          event.teams.away.toLowerCase().includes(query)
      }

      if (!matchesSearch) {
        return false
      }
    }

    return true
  })

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => {
      const eventStart = startOfDay(event.start)
      const eventEnd = endOfDay(event.end)
      const dayStart = startOfDay(day)
      const dayEnd = endOfDay(day)

      // Check if the event overlaps with this day
      return (
        isSameDay(eventStart, day) ||
        (isBefore(eventStart, dayEnd) && isAfter(eventEnd, dayStart))
      )
    })
  }

  return (
    <div className="flex h-full flex-col">
      {/* Week header */}
      <div className="grid grid-cols-7 border-b bg-muted/50">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="border-r px-2 py-3 text-center font-medium text-muted-foreground text-sm last:border-r-0"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid flex-1 grid-cols-7 grid-rows-[repeat(auto-fill,minmax(100px,1fr))]">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day)
          const isCurrentMonth = isSameMonth(day, selectedDate)
          const isTodayDate = isToday(day)

          return (
            <div
              key={day.toISOString()}
              className={cn(
                "min-h-[100px] border-b border-r p-2 last:border-r-0",
                !isCurrentMonth && "bg-muted/20"
              )}
            >
              <div
                className={cn(
                  "mb-1 inline-flex size-6 items-center justify-center rounded-full text-sm",
                  isTodayDate && "bg-primary font-bold text-primary-foreground",
                  !isTodayDate && !isCurrentMonth && "text-muted-foreground"
                )}
              >
                {format(day, "d")}
              </div>

              <div className="space-y-1">
                {dayEvents.slice(0, 3).map((event) => (
                  <EventItem
                    key={event.id}
                    event={event}
                    onClick={onEventClick}
                  />
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-muted-foreground text-xs">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
