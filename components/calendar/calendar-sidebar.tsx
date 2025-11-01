"use client"

import { ChevronDown, ChevronUp, Search } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import { createClient } from "@/lib/supabase/client"
import {
  type EventStatus,
  type EventType,
  eventStatusStyles,
  eventTypeColors,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

interface Driver {
  id: string
  full_name: string
  driver_color: string | null
}

// Event type labels for display
const eventTypeLabels: Record<EventType, string> = {
  delivery: "Deliveries",
  pickup: "Pickups",
  meeting: "Meetings",
  break: "Breaks",
  maintenance: "Maintenance",
  collection: "Collections",
  retail: "Retail",
}

// Commonly shown statuses for the filter
const commonStatuses: EventStatus[] = [
  "scheduled",
  "in-progress",
  "completed",
  "cancelled",
]

/**
 * Sticky sidebar that exposes calendar filters, quick search, and a date
 * navigator. Updates are pushed into the shared calendar store.
 */
export function CalendarSidebar() {
  const searchId = useId()

  const {
    selectedDate,
    setSelectedDate,
    filters,
    toggleEventType,
    toggleEventStatus,
    toggleDriverFilter,
    setSearchQuery,
    events,
  } = useCalendarStore()

  const [showTypes, setShowTypes] = useState(true)
  const [showStatuses, setShowStatuses] = useState(true)
  const [showDrivers, setShowDrivers] = useState(true)
  const [drivers, setDrivers] = useState<Driver[]>([])

  // Fetch available drivers
  useEffect(() => {
    async function fetchDrivers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, driver_color")
        .eq("role", "driver")
        .eq("is_active", true)
        .order("full_name")

      if (!error && data) {
        setDrivers(data)
      }
    }

    fetchDrivers()
  }, [])

  // Get dates that have events for visual indicators
  const datesWithEvents = new Set(
    events.map((event) => event.day_date.toISOString().split("T")[0])
  )

  return (
    <div className="w-full space-y-6 border-r bg-background p-4 lg:w-72 overflow-y-auto h-full">
      {/* Mini Calendar */}
      <div className="space-y-2">
        <h3 className="font-semibold text-sm">Calendar</h3>
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={(date) => date && setSelectedDate(date)}
          className="rounded-md border [&_.has-events]:relative [&_.has-events]:after:absolute [&_.has-events]:after:bottom-0.5 [&_.has-events]:after:left-1/2 [&_.has-events]:after:-translate-x-1/2 [&_.has-events]:after:w-1 [&_.has-events]:after:h-1 [&_.has-events]:after:rounded-full [&_.has-events]:after:bg-primary [&_.has-events]:after:content-['']"
          modifiers={{
            hasEvents: (date) => {
              const dateStr = date.toISOString().split("T")[0]
              return datesWithEvents.has(dateStr)
            },
          }}
          modifiersClassNames={{
            hasEvents: "has-events",
          }}
        />
      </div>

      <Separator />

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor={searchId}>Search Events</Label>
        <div className="relative">
          <Search className="absolute top-2.5 left-3 size-4 text-muted-foreground" />
          <Input
            id={searchId}
            placeholder="Search by title or location..."
            value={filters.searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <Separator />

      {/* Event Types Filter */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => setShowTypes(!showTypes)}
          className="flex w-full items-center justify-between p-0 hover:bg-transparent"
        >
          <h3 className="font-semibold text-sm">Event Types</h3>
          {showTypes ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {showTypes && (
          <div className="space-y-2 pt-2">
            {(Object.keys(eventTypeColors) as EventType[]).map((type) => (
              <label
                key={type}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={filters.eventTypes.includes(type)}
                  onChange={() => toggleEventType(type)}
                  className="size-4 rounded border-gray-300"
                />
                <div className={cn("size-3 rounded", eventTypeColors[type])} />
                <span className="flex-1 text-sm">{eventTypeLabels[type]}</span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Event Status Filter */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => setShowStatuses(!showStatuses)}
          className="flex w-full items-center justify-between p-0 hover:bg-transparent"
        >
          <h3 className="font-semibold text-sm">Event Status</h3>
          {showStatuses ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {showStatuses && (
          <div className="space-y-2 pt-2">
            {commonStatuses.map((status) => (
              <label
                key={status}
                className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
              >
                <input
                  type="checkbox"
                  checked={filters.eventStatuses.includes(status)}
                  onChange={() => toggleEventStatus(status)}
                  className="size-4 rounded border-gray-300"
                />
                <span className="flex-1 text-sm capitalize">
                  {eventStatusStyles[status]?.label || status}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Driver Filter */}
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => setShowDrivers(!showDrivers)}
          className="flex w-full items-center justify-between p-0 hover:bg-transparent"
        >
          <h3 className="font-semibold text-sm">Assigned Drivers</h3>
          {showDrivers ? (
            <ChevronUp className="size-4" />
          ) : (
            <ChevronDown className="size-4" />
          )}
        </Button>

        {showDrivers && (
          <div className="space-y-2 pt-2">
            {drivers.length === 0 ? (
              <p className="text-muted-foreground text-sm px-2">
                No active drivers
              </p>
            ) : (
              drivers.map((driver) => (
                <label
                  key={driver.id}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={filters.driverIds.includes(driver.id)}
                    onChange={() => toggleDriverFilter(driver.id)}
                    className="size-4 rounded border-gray-300"
                  />
                  {driver.driver_color && (
                    <div
                      className="size-3 rounded-full"
                      style={{ backgroundColor: driver.driver_color }}
                    />
                  )}
                  <span className="flex-1 text-sm">{driver.full_name}</span>
                </label>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Export event type colors for use in other components
export { eventTypeColors }
