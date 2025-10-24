/**
 * @file Store tests double as narratives for the search modal UX state.
 * Covers deduplication, pagination limits, and reset semantics.
 */
import { act } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useSearchStore } from "../use-search-store"
import { resetAllStores } from "./test-utils"

describe("useSearchStore", () => {
  afterEach(() => {
    resetAllStores()
  })

  it("adds recent searches without duplicates", () => {
    act(() => {
      // Using the store inside act() avoids React warnings during state writes.
      const store = useSearchStore.getState()
      store.addRecentSearch("supabase")
      store.addRecentSearch("nextjs")
      store.addRecentSearch("supabase")
    })

    expect(useSearchStore.getState().recentSearches).toEqual([
      "supabase",
      "nextjs",
    ])
  })

  it("adds recent pages capped at the limit", () => {
    act(() => {
      const store = useSearchStore.getState()
      for (let index = 0; index < 12; index += 1) {
        // Seed 12 entries so we can assert the 10-item retention policy.
        store.addRecentPage({
          id: `page-${index}`,
          title: `Page ${index}`,
          path: `/page-${index}`,
        })
      }
    })

    const pages = useSearchStore.getState().recentPages
    expect(pages).toHaveLength(10)
    expect(pages[0]?.id).toBe("page-11")
  })

  it("resets state", () => {
    act(() => {
      const store = useSearchStore.getState()
      store.open()
      store.addRecentSearch("vitest")
      // Calling reset should drop modal visibility and history alike.
      store.reset()
    })

    const state = useSearchStore.getState()
    expect(state.isOpen).toBe(false)
    expect(state.recentSearches).toEqual([])
    expect(state.recentPages).toEqual([])
  })
})
