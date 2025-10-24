/**
 * @file Chat store specs that document widget orchestration and layout modes.
 * The calendar widget fixture mirrors what the assistant panel supplies.
 */
import { act } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useChatStore } from "../chat-store"
import { resetAllStores } from "./test-utils"

const widget = {
  type: "calendar",
  data: null,
  title: "Calendar",
} as const

describe("useChatStore", () => {
  afterEach(() => {
    resetAllStores()
  })

  it("sets and clears active widget", () => {
    act(() => {
      useChatStore.getState().setActiveWidget(widget)
    })

    expect(useChatStore.getState().activeWidget).toEqual(widget)

    act(() => {
      // Closing should also bring the layout back to a centered conversation.
      useChatStore.getState().closeWidget()
    })

    const state = useChatStore.getState()
    expect(state.activeWidget).toBeNull()
    expect(state.layoutMode).toBe("centered")
  })

  it("updates layout mode", () => {
    act(() => {
      // Toggling layout is used when a widget expands into a split panel.
      useChatStore.getState().setLayoutMode("split")
    })

    expect(useChatStore.getState().layoutMode).toBe("split")
  })

  it("resets to initial state", () => {
    act(() => {
      const store = useChatStore.getState()
      store.setActiveWidget(widget)
      store.setError("failure")
      store.setLayoutMode("split")
      // Reset must clear widget, layout, and transient error state together.
      store.reset()
    })

    const state = useChatStore.getState()
    expect(state.activeWidget).toBeNull()
    expect(state.layoutMode).toBe("centered")
    expect(state.error).toBeNull()
  })
})
