"use client"

import { create } from "zustand"
import { devtools, persist } from "zustand/middleware"

import { createCookieStorage } from "./middleware/persist"

export type SidebarViewState = "expanded" | "collapsed"

interface SidebarCoreState {
  open: boolean
  openMobile: boolean
  isMobile: boolean
  state: SidebarViewState
}

interface SidebarActions {
  setOpen: (open: boolean | ((prev: boolean) => boolean)) => void
  setOpenMobile: (openMobile: boolean | ((prev: boolean) => boolean)) => void
  setIsMobile: (isMobile: boolean) => void
  toggleSidebar: () => void
  reset: () => void
}

export type SidebarStore = SidebarCoreState & SidebarActions

const computeState = (open: boolean): SidebarViewState =>
  open ? "expanded" : "collapsed"

const initialState: SidebarCoreState = {
  open: true,
  openMobile: false,
  isMobile: false,
  state: "expanded",
}

export const useSidebarStore = create<SidebarStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,
        setOpen: (value) =>
          set(
            () => {
              const current = get().open
              const nextOpen =
                typeof value === "function" ? value(current) : value

              if (nextOpen === current) {
                return {}
              }

              return {
                open: nextOpen,
                state: computeState(nextOpen),
              }
            },
            false,
            "sidebar/setOpen"
          ),
        setOpenMobile: (value) =>
          set(
            () => {
              const current = get().openMobile
              const nextOpen =
                typeof value === "function" ? value(current) : value

              if (nextOpen === current) {
                return {}
              }

              return { openMobile: nextOpen }
            },
            false,
            "sidebar/setOpenMobile"
          ),
        setIsMobile: (isMobile) =>
          set(
            (state) => (state.isMobile === isMobile ? {} : { isMobile }),
            false,
            "sidebar/setIsMobile"
          ),
        toggleSidebar: () => {
          const { isMobile } = get()

          if (isMobile) {
            return set(
              (state) => ({ openMobile: !state.openMobile }),
              false,
              "sidebar/toggleMobile"
            )
          }

          const nextOpen = !get().open
          set(
            { open: nextOpen, state: computeState(nextOpen) },
            false,
            "sidebar/toggle"
          )
        },
        reset: () => set(initialState, false, "sidebar/reset"),
      }),
      {
        name: "sidebar_state",
        storage: createCookieStorage(),
        partialize: (state) => ({
          open: state.open,
          state: state.state,
        }),
        version: 2,
        migrate: (persistedState, version) => {
          if (version < 2) {
            return {
              ...(persistedState as object),
              open: true,
              state: "expanded" as SidebarViewState,
            }
          }

          return persistedState
        },
      }
    ),
    {
      name: "SidebarStore",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)

// Selectors
export const selectSidebarState = (state: SidebarStore) => state.state
export const selectIsSidebarOpen = (state: SidebarStore) => state.open
export const selectIsSidebarOpenMobile = (state: SidebarStore) =>
  state.openMobile
export const selectIsSidebarMobile = (state: SidebarStore) => state.isMobile
export const selectToggleSidebar = (state: SidebarStore) => state.toggleSidebar
export const selectSetSidebarOpen = (state: SidebarStore) => state.setOpen
export const selectSetSidebarOpenMobile = (state: SidebarStore) =>
  state.setOpenMobile
export const selectSetSidebarIsMobile = (state: SidebarStore) =>
  state.setIsMobile
