"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface RecentPage {
  id: string
  title: string
  path: string
}

interface SearchState {
  isOpen: boolean
  recentSearches: string[]
  recentPages: RecentPage[]
}

interface SearchActions {
  open: () => void
  close: () => void
  toggle: () => void
  addRecentSearch: (query: string) => void
  addRecentPage: (page: RecentPage) => void
  clearRecent: () => void
  reset: () => void
}

export type SearchStore = SearchState & SearchActions

const MAX_RECENT_ITEMS = 10

const createInitialState = (): SearchState => ({
  isOpen: false,
  recentSearches: [],
  recentPages: [],
})

const dedupeAndPrepend = <T extends string | RecentPage>(
  items: T[],
  incoming: T,
  identifier: (item: T) => string
) => {
  const next = [
    incoming,
    ...items.filter((item) => identifier(item) !== identifier(incoming)),
  ]
  return next.slice(0, MAX_RECENT_ITEMS)
}

export const useSearchStore = create<SearchStore>()(
  devtools(
    (set) => ({
      ...createInitialState(),
      open: () => set({ isOpen: true }, false, "search/open"),
      close: () => set({ isOpen: false }, false, "search/close"),
      toggle: () =>
        set((state) => ({ isOpen: !state.isOpen }), false, "search/toggle"),
      addRecentSearch: (query) =>
        set(
          (state) => ({
            recentSearches: dedupeAndPrepend(
              state.recentSearches,
              query,
              (value) => value
            ),
          }),
          false,
          "search/addRecentSearch"
        ),
      addRecentPage: (page) =>
        set(
          (state) => ({
            recentPages: dedupeAndPrepend(
              state.recentPages,
              page,
              (value) => value.id
            ),
          }),
          false,
          "search/addRecentPage"
        ),
      clearRecent: () =>
        set(
          { recentPages: [], recentSearches: [] },
          false,
          "search/clearRecent"
        ),
      reset: () => set(createInitialState(), false, "search/reset"),
    }),
    {
      name: "SearchStore",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)

// Selectors
export const selectIsSearchOpen = (state: SearchStore) => state.isOpen
export const selectRecentSearches = (state: SearchStore) => state.recentSearches
export const selectRecentPages = (state: SearchStore) => state.recentPages
export const selectSearchOpen = (state: SearchStore) => state.open
export const selectSearchClose = (state: SearchStore) => state.close
export const selectSearchToggle = (state: SearchStore) => state.toggle
export const selectAddRecentSearch = (state: SearchStore) =>
  state.addRecentSearch
export const selectAddRecentPage = (state: SearchStore) => state.addRecentPage
export const selectClearRecent = (state: SearchStore) => state.clearRecent
export const selectSearchReset = (state: SearchStore) => state.reset
