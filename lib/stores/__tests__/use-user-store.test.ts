/**
 * @file User store coverage that narrates the lifecycle of auth metadata.
 * Showcases how email, profile, and clearing behaviors interact.
 */
import { act } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useUserStore } from "../use-user-store"
import { resetAllStores } from "./test-utils"

describe("useUserStore", () => {
  afterEach(() => {
    resetAllStores()
  })

  it("stores the user email", () => {
    act(() => {
      // Email is a narrow update; does not touch profile fields.
      useUserStore.getState().setUserEmail("user@example.com")
    })

    expect(useUserStore.getState().userEmail).toBe("user@example.com")
  })

  it("stores the user profile metadata", () => {
    act(() => {
      // Full profile sets all derived pieces used in the dashboard header.
      useUserStore.getState().setUserProfile({
        email: "user@example.com",
        name: "Test User",
        subscriptionTier: "Pro",
      })
    })

    const state = useUserStore.getState()
    expect(state.userEmail).toBe("user@example.com")
    expect(state.userName).toBe("Test User")
    expect(state.subscriptionTier).toBe("Pro")
  })

  it("clears user state", () => {
    act(() => {
      const store = useUserStore.getState()
      store.setUserProfile({
        email: "user@example.com",
        name: "Test User",
        subscriptionTier: "Pro",
      })
      // `clearUser` acts as a logout hook; everything should be undefined.
      store.clearUser()
    })

    const state = useUserStore.getState()
    expect(state.userEmail).toBeUndefined()
    expect(state.userName).toBeUndefined()
    expect(state.subscriptionTier).toBeUndefined()
  })
})
