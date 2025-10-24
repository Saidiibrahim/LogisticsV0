"use client"

/**
 * Chat Store
 *
 * Zustand store for managing chat interface state including layout mode,
 * active widgets, and error states. This store provides centralized state
 * management for the chat UI components.
 *
 * **Architecture Pattern:**
 * - Uses Zustand for lightweight, performant state management
 * - Devtools enabled in development for Redux DevTools integration
 * - Selector functions provided for optimized component subscriptions
 *
 * @module lib/stores/chat-store
 * @see {@link https://docs.pmnd.rs/zustand/getting-started/introduction|Zustand Documentation}
 */

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type { ChatLayoutMode, WidgetConfig } from "@/lib/types/chat"

/**
 * Chat state interface.
 *
 * Defines the structure of the chat store's state. All state properties
 * are nullable to represent initial/cleared states.
 */
interface ChatState {
  /** Currently active widget configuration, null when no widget is displayed */
  activeWidget: WidgetConfig | null
  /** Current layout mode - controls whether chat is centered or split */
  layoutMode: ChatLayoutMode
  /** Current error message, null when no error */
  error: string | null
}

/**
 * Chat actions interface.
 *
 * Defines all available actions for modifying chat state. Each action
 * is a function that updates one or more state properties.
 */
interface ChatActions {
  /**
   * Sets the active widget to display in the side panel.
   * Passing null clears the active widget.
   *
   * @param widget - Widget configuration or null to clear
   */
  setActiveWidget: (widget: WidgetConfig | null) => void

  /**
   * Closes the active widget and returns to centered layout.
   * This is a convenience action that combines clearing the widget
   * and switching layout modes.
   */
  closeWidget: () => void

  /**
   * Sets the chat layout mode.
   *
   * @param mode - Layout mode ("centered" or "split")
   */
  setLayoutMode: (mode: ChatLayoutMode) => void

  /**
   * Sets or clears an error message.
   *
   * @param error - Error message string or null to clear
   */
  setError: (error: string | null) => void

  /**
   * Resets the chat store back to its initial state.
   */
  reset: () => void
}

/**
 * Combined chat store type.
 *
 * Merges state and actions into a single type for the store.
 */
export type ChatStore = ChatState & ChatActions

const createInitialState = (): ChatState => ({
  activeWidget: null,
  layoutMode: "centered",
  error: null,
})

/**
 * Chat store hook.
 *
 * Creates and exports the Zustand store with devtools middleware for
 * debugging in development. Components can subscribe to specific
 * parts of the state using selector functions.
 *
 * @example
 * ```typescript
 * // Subscribe to entire store
 * const { activeWidget, setActiveWidget } = useChatStore()
 *
 * // Subscribe to specific state (optimized)
 * const layoutMode = useChatStore(selectLayoutMode)
 * ```
 *
 * @see {@link selectActiveWidget}
 * @see {@link selectLayoutMode}
 * @see {@link selectError}
 */
export const useChatStore = create<ChatStore>()(
  devtools(
    (set) => ({
      // Initial state
      ...createInitialState(),

      // Actions
      setActiveWidget: (widget) =>
        set({ activeWidget: widget }, false, "chat/setActiveWidget"),

      closeWidget: () =>
        set(
          // Reset to centered layout when closing widget
          { activeWidget: null, layoutMode: "centered" },
          false,
          "chat/closeWidget"
        ),

      setLayoutMode: (mode) =>
        set({ layoutMode: mode }, false, "chat/setLayoutMode"),

      setError: (error) => set({ error }, false, "chat/setError"),

      reset: () => set(createInitialState(), false, "chat/reset"),
    }),
    {
      // Store name for Redux DevTools
      name: "ChatStore",
      // Only enable devtools in development
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)

/**
 * Selector for active widget state.
 *
 * Use this selector to subscribe only to active widget changes,
 * preventing unnecessary re-renders when other state changes.
 *
 * @param state - Chat store state
 * @returns Current active widget or null
 *
 * @example
 * ```typescript
 * const activeWidget = useChatStore(selectActiveWidget)
 * ```
 */
export const selectActiveWidget = (state: ChatStore) => state.activeWidget

/**
 * Selector for layout mode state.
 *
 * Use this selector to subscribe only to layout mode changes.
 *
 * @param state - Chat store state
 * @returns Current layout mode
 *
 * @example
 * ```typescript
 * const layoutMode = useChatStore(selectLayoutMode)
 * ```
 */
export const selectLayoutMode = (state: ChatStore) => state.layoutMode

/**
 * Selector for error state.
 *
 * Use this selector to subscribe only to error state changes.
 *
 * @param state - Chat store state
 * @returns Current error message or null
 *
 * @example
 * ```typescript
 * const error = useChatStore(selectError)
 * ```
 */
export const selectError = (state: ChatStore) => state.error
export const selectChatReset = (state: ChatStore) => state.reset
