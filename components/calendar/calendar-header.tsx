"use client"

import { addMonths, addWeeks, format, subMonths, subWeeks } from "date-fns"
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  type CalendarView,
  useCalendarStore,
} from "@/lib/stores/calendar-store"
import { cn } from "@/lib/utils"

const viewOptions: { value: CalendarView; label: string }[] = [
  { value: "month", label: "Month" },
  { value: "week", label: "Week" },
  { value: "timeline", label: "Timeline" },
  { value: "list", label: "List" },
  { value: "agenda", label: "Agenda" },
]

export function CalendarHeader() {
  const { currentView, selectedDate, setView, setSelectedDate } =
    useCalendarStore()

  const handlePrevious = () => {
    if (currentView === "month") {
      setSelectedDate(subMonths(selectedDate, 1))
    } else if (currentView === "week") {
      setSelectedDate(subWeeks(selectedDate, 1))
    } else {
      setSelectedDate(subWeeks(selectedDate, 1))
    }
  }

  const handleNext = () => {
    if (currentView === "month") {
      setSelectedDate(addMonths(selectedDate, 1))
    } else if (currentView === "week") {
      setSelectedDate(addWeeks(selectedDate, 1))
    } else {
      setSelectedDate(addWeeks(selectedDate, 1))
    }
  }

  const handleToday = () => {
    setSelectedDate(new Date())
  }

  const getDateRangeText = () => {
    switch (currentView) {
      case "month":
        return format(selectedDate, "MMMM yyyy")
      case "week":
        return `Week of ${format(selectedDate, "MMM d, yyyy")}`
      default:
        return format(selectedDate, "MMM yyyy")
    }
  }

  return (
    <div className="flex flex-col gap-4 border-b bg-background px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      {/* Navigation Section */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePrevious}
            className="size-9"
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous</span>
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={handleNext}
            className="size-9"
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next</span>
          </Button>
        </div>

        <Button variant="outline" onClick={handleToday} className="h-9">
          Today
        </Button>

        <div className="flex items-center gap-2 rounded-md border px-3 py-2">
          <CalendarIcon className="size-4 text-muted-foreground" />
          <span className="font-medium text-sm">{getDateRangeText()}</span>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-lg border p-1">
          {viewOptions.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="sm"
              onClick={() => setView(option.value)}
              className={cn(
                "h-7 px-3 text-sm",
                currentView === option.value &&
                  "bg-muted font-medium text-foreground"
              )}
            >
              {option.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
