"use client"

import { useEffect, useState } from "react"
import { CalendarHeader } from "@/components/calendar/calendar-header"
import { CalendarSidebar } from "@/components/calendar/calendar-sidebar"
import { EventDetailsDialog } from "@/components/calendar/event-details-dialog"
import { AgendaView } from "@/components/calendar/views/agenda-view"
import { ListView } from "@/components/calendar/views/list-view"
import { MonthView } from "@/components/calendar/views/month-view"
import { TimelineView } from "@/components/calendar/views/timeline-view"
import { WeekView } from "@/components/calendar/views/week-view"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import type { CalendarEvent } from "@/lib/types/calendar"
import { CreateEventDialog } from "./create-event-dialog"

/**
 * Props accepted by the client calendar shell. The server preloads events and
 * hydrates them through this component.
 */
interface CalendarClientProps {
  initialEvents: CalendarEvent[]
}

/**
 * Client-side shell for the calendar route. Handles view switching, dialog
 * coordination, and syncing events into the calendar store.
 */
export function CalendarClient({ initialEvents }: CalendarClientProps) {
  const { currentView, setEvents } = useCalendarStore()
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  // Load initial events on mount
  useEffect(() => {
    setEvents(initialEvents)
  }, [initialEvents, setEvents])

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event)
    setDialogOpen(true)
  }

  // Render the active calendar visualization based on the current view
  const renderCalendarView = () => {
    switch (currentView) {
      case "month":
        return <MonthView onEventClick={handleEventClick} />
      case "week":
        return <WeekView onEventClick={handleEventClick} />
      case "timeline":
        return <TimelineView onEventClick={handleEventClick} />
      case "list":
        return <ListView onEventClick={handleEventClick} />
      case "agenda":
        return <AgendaView onEventClick={handleEventClick} />
      default:
        return <MonthView onEventClick={handleEventClick} />
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <div className="flex items-center justify-between gap-4 border-b bg-background px-6 py-4">
        <CalendarHeader />
        <CreateEventDialog />
      </div>

      <div className="flex flex-1 overflow-hidden">
        <CalendarSidebar />

        <div className="flex-1 overflow-hidden bg-background">
          {renderCalendarView()}
        </div>
      </div>

      <EventDetailsDialog
        event={selectedEvent}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </div>
  )
}
