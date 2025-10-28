import { create } from "zustand"
import type {
  CalendarEvent,
  CalendarFilters,
  EventStatus,
  EventType,
} from "@/lib/types/calendar"

/**
 * Available calendar layouts that a user can toggle between.
 */
export type CalendarView = "month" | "week" | "timeline" | "list" | "agenda"

/**
 * Zustand state container that tracks calendar view state, events, and filters.
 */
interface CalendarState {
  // View state
  currentView: CalendarView
  selectedDate: Date

  // Data
  events: CalendarEvent[]

  // Filters
  filters: CalendarFilters

  // Actions
  setView: (view: CalendarView) => void
  setSelectedDate: (date: Date) => void
  setEvents: (events: CalendarEvent[]) => void
  addEvent: (event: CalendarEvent) => void
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  setFilters: (filters: Partial<CalendarFilters>) => void
  toggleEventType: (type: EventType) => void
  toggleEventStatus: (status: EventStatus) => void
  toggleDriverFilter: (driverId: string) => void
  setSearchQuery: (query: string) => void
  reset: () => void
}

/**
 * Centralised calendar store used by all calendar-related views and dialogs.
 */
const createInitialState = () => ({
  currentView: "month" as CalendarView,
  selectedDate: new Date(),
  events: [] as CalendarEvent[],
  filters: {
    eventTypes: [
      "delivery",
      "pickup",
      "meeting",
      "break",
      "maintenance",
      "collection",
      "retail",
    ] as EventType[],
    eventStatuses: [
      "scheduled",
      "in-progress",
      "completed",
      "cancelled",
    ] as EventStatus[],
    searchQuery: "",
    driverIds: [] as string[], // Empty means show all drivers
  },
})

export const useCalendarStore = create<CalendarState>((set) => ({
  // Initial state
  ...createInitialState(),

  // Actions
  setView: (view) => set({ currentView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setEvents: (events) => set({ events }),

  // Append a single event to the cache without requiring a full refetch
  addEvent: (event) =>
    set((state) => ({
      events: [...state.events, event],
    })),

  // Shallow merge helper for updating events in place
  updateEvent: (id, updates) =>
    set((state) => ({
      events: state.events.map((event) =>
        event.id === id ? ({ ...event, ...updates } as CalendarEvent) : event
      ),
    })),

  // Remove an event from the cache by id
  deleteEvent: (id) =>
    set((state) => ({
      events: state.events.filter((event) => event.id !== id),
    })),

  setFilters: (newFilters) =>
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    })),

  toggleEventType: (type) =>
    set((state) => ({
      filters: {
        ...state.filters,
        eventTypes: state.filters.eventTypes.includes(type)
          ? state.filters.eventTypes.filter((t) => t !== type)
          : [...state.filters.eventTypes, type],
      },
    })),

  toggleEventStatus: (status) =>
    set((state) => ({
      filters: {
        ...state.filters,
        eventStatuses: state.filters.eventStatuses.includes(status)
          ? state.filters.eventStatuses.filter((s) => s !== status)
          : [...state.filters.eventStatuses, status],
      },
    })),

  toggleDriverFilter: (driverId) =>
    set((state) => ({
      filters: {
        ...state.filters,
        driverIds: state.filters.driverIds.includes(driverId)
          ? state.filters.driverIds.filter((id) => id !== driverId)
          : [...state.filters.driverIds, driverId],
      },
    })),

  setSearchQuery: (query) =>
    set((state) => ({
      filters: { ...state.filters, searchQuery: query },
    })),
  reset: () => set(createInitialState()),
}))
