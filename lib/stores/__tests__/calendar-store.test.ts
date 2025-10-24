/**
 * @file Calendar store specs highlight how events, filters, and view controls
 * interact. The tests share a single fixture to show the lifecycle of an event
 * from creation through reset.
 */
import { act } from "@testing-library/react"
import { createMatchEvent } from "test-utils"
import { afterEach, describe, expect, it } from "vitest"
import { useCalendarStore } from "../calendar-store"
import { resetAllStores } from "./test-utils"

describe("useCalendarStore", () => {
  afterEach(() => {
    resetAllStores()
  })

  it("manages events and filters", () => {
    const event = createMatchEvent({ id: "match-1" })

    act(() => {
      const store = useCalendarStore.getState()
      // Create -> update -> toggle filters to document main flows.
      store.addEvent(event)
      store.updateEvent("match-1", { title: "Updated" })
      store.toggleEventType("match")
      store.toggleEventStatus("scheduled")
      store.setSearchQuery("derby")
    })

    const state = useCalendarStore.getState()

    expect(state.events).toHaveLength(1)
    expect(state.events[0]?.title).toBe("Updated")
    expect(state.filters.eventTypes).not.toContain("match")
    expect(state.filters.eventStatuses).not.toContain("scheduled")
    expect(state.filters.searchQuery).toBe("derby")
  })

  it("resets to initial state", () => {
    act(() => {
      const store = useCalendarStore.getState()
      store.setView("week")
      store.setSelectedDate(new Date("2024-06-01"))
      // Reset must reinstate default view, clear events, and restore filters.
      store.reset()
    })

    const state = useCalendarStore.getState()
    expect(state.currentView).toBe("month")
    expect(state.events).toEqual([])
    expect(state.filters.eventTypes).toEqual(["match", "training", "coaching"])
  })
})
