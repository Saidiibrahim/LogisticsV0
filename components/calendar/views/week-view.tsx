"use client"

import {
  differenceInMinutes,
  eachDayOfInterval,
  eachHourOfInterval,
  endOfWeek,
  format,
  getHours,
  isSameDay,
  isToday,
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
 * Connects the week view to the parent calendar shell for event selection.
 */
interface WeekViewProps {
  onEventClick: (event: CalendarEvent) => void
}

/**
 * Week grid that visualises the temporal length of events throughout each day.
 */
export function WeekView({ onEventClick }: WeekViewProps) {
  const { selectedDate, events, filters } = useCalendarStore()

  const weekStart = startOfWeek(selectedDate)
  const weekEnd = endOfWeek(selectedDate)
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd })

  // Hours for the day (6 AM to 11 PM)
  const dayStart = new Date(selectedDate)
  dayStart.setHours(6, 0, 0, 0)
  const dayEnd = new Date(selectedDate)
  dayEnd.setHours(23, 0, 0, 0)
  const hours = eachHourOfInterval({ start: dayStart, end: dayEnd })

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
        (isMatchEvent(event) &&
          event.teams?.home.toLowerCase().includes(query)) ||
        (isMatchEvent(event) && event.teams?.away.toLowerCase().includes(query))
      if (!matchesSearch) {
        return false
      }
    }
    return true
  })

  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return filteredEvents.filter((event) => isSameDay(event.start, day))
  }

  // Calculate event position and height
  const getEventStyle = (event: CalendarEvent) => {
    const startHour = getHours(event.start)
    const startMinute = event.start.getMinutes()
    const duration = differenceInMinutes(event.end, event.start)

    // Each hour is 60px
    const hourHeight = 60
    const top = (startHour - 6) * hourHeight + (startMinute / 60) * hourHeight
    const height = (duration / 60) * hourHeight

    return {
      top: `${top}px`,
      height: `${Math.max(height, 30)}px`,
    }
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Week header */}
      <div className="grid grid-cols-8 border-b bg-muted/50">
        <div className="border-r px-2 py-3 text-center text-muted-foreground text-sm">
          Time
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

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto">
        <div className="relative grid grid-cols-8">
          {/* Time column */}
          <div className="border-r">
            {hours.map((hour) => (
              <div
                key={hour.toISOString()}
                className="h-[60px] border-b px-2 py-1 text-right text-muted-foreground text-xs"
              >
                {format(hour, "h a")}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {weekDays.map((day) => {
            const dayEvents = getEventsForDay(day)

            return (
              <div
                key={day.toISOString()}
                className="relative border-r last:border-r-0"
              >
                {/* Hour grid lines */}
                {hours.map((hour) => (
                  <div key={hour.toISOString()} className="h-[60px] border-b" />
                ))}

                {/* Events */}
                {dayEvents.map((event) => {
                  const style = getEventStyle(event)
                  const bgColor = eventTypeColors[event.type]

                  return (
                    <button
                      key={event.id}
                      onClick={() => onEventClick(event)}
                      className={cn(
                        "absolute inset-x-1 rounded px-2 py-1 text-left text-xs hover:opacity-80",
                        bgColor
                      )}
                      style={style}
                      type="button"
                    >
                      <div className="font-semibold text-white">
                        {format(event.start, "h:mm a")}
                      </div>
                      <div className="truncate text-white">{event.title}</div>
                      {event.location && (
                        <div className="truncate text-white/80">
                          {event.location}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
