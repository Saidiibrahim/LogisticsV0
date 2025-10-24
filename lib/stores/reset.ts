import { useCalendarStore } from "./calendar-store"
import { useChatStore } from "./chat-store"
import { useSearchStore } from "./use-search-store"
import { useSidebarStore } from "./use-sidebar-store"
import { useUserStore } from "./use-user-store"

/**
 * Reset all Zustand stores used across the application.
 *
 * This utility is primarily intended for tests to ensure store
 * state does not leak between test cases, but it can also be used
 * by runtime logic when a full state flush is required (e.g., logout).
 */
export function resetStores() {
  useUserStore.getState().clearUser()
  useSidebarStore.getState().reset()
  useSearchStore.getState().reset()
  useCalendarStore.getState().reset()
  useChatStore.getState().reset()
}
