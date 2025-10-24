/**
 * @file Sidebar store coverage. Demonstrates how desktop vs mobile state is
 * derived and why resets must restore the expanded desktop shell by default.
 */
import { act } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useSidebarStore } from "../use-sidebar-store"
import { resetAllStores } from "./test-utils"

describe("useSidebarStore", () => {
  afterEach(() => {
    resetAllStores()
  })

  it("toggles sidebar open state on desktop", () => {
    act(() => {
      useSidebarStore.getState().toggleSidebar()
    })

    const state = useSidebarStore.getState()
    // Desktop toggles collapse the nav while keeping mobile closed.
    expect(state.open).toBe(false)
    expect(state.state).toBe("collapsed")
  })

  it("toggles mobile sidebar independently", () => {
    act(() => {
      const store = useSidebarStore.getState()
      store.setIsMobile(true)
      store.toggleSidebar()
    })

    const state = useSidebarStore.getState()
    // Mobile toggles should not affect the collapsed desktop indicator.
    expect(state.openMobile).toBe(true)
    expect(state.open).toBe(true)
  })

  it("supports functional updates and reset", () => {
    act(() => {
      const store = useSidebarStore.getState()
      // Functional updates are used by components that rely on previous state.
      store.setOpen((prev) => !prev)
      store.reset()
    })

    const state = useSidebarStore.getState()
    expect(state.open).toBe(true)
    expect(state.state).toBe("expanded")
  })
})
