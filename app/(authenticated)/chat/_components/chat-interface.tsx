"use client"

/**
 * Chat Interface Component
 *
 * Main client component for the AI-powered chat interface with widget support.
 * Implements a responsive layout that switches between centered and split modes
 * based on widget activation.
 *
 * **Key Features:**
 * - Real-time streaming responses using AI SDK's useChat hook
 * - Tool invocation detection for widget display
 * - Dynamic layout switching (centered ↔ split)
 * - Error handling with retry functionality
 * - Keyboard shortcuts (Cmd/Ctrl+K for focus, Esc to close widget)
 * - Accessibility support with reduced motion preferences
 *
 * **Widget Detection Flow:**
 * 1. AI SDK streams response with tool invocations
 * 2. `onFinish` callback receives completed message
 * 3. `inspectMessageForTools` examines message parts
 * 4. Widget data extracted from tool output
 * 5. Layout switches to split mode
 * 6. Widget displays in right panel
 *
 * **AI SDK 5 Integration:**
 * - Uses `message.parts` array for tool detection (not deprecated toolInvocations)
 * - Filters for parts with `state === 'output-available'`
 * - Extracts WidgetToolResult from part.output
 * - Compatible with toUIMessageStreamResponse() format
 *
 * @module app/(authenticated)/chat/_components/chat-interface
 * @see {@link https://ai-sdk.dev/docs/ai-sdk-ui/chatbot|AI SDK useChat Documentation}
 */

import { useChat } from "@ai-sdk/react"
import { isToolUIPart, type UIMessage } from "ai"
import { AnimatePresence, motion, useReducedMotion } from "framer-motion"
import {
  type ChangeEvent,
  type FormEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import {
  selectError,
  selectLayoutMode,
  useChatStore,
} from "@/lib/stores/chat-store"
import type { WidgetToolResult, WidgetType } from "@/lib/types/chat"
import { cn } from "@/lib/utils"
import { ChatInput } from "./chat-input"
import { ChatMessageList } from "./chat-message-list"
import { ChatWidgetPanel } from "./chat-widget-panel"

/**
 * Default widget titles by type.
 * Used when tool doesn't provide a custom displayText.
 */
const WIDGET_TITLES: Record<WidgetType, string> = {
  calendar: "Upcoming Events",
  "training-summary": "Training Overview",
  "performance-chart": "Performance Insights",
}

/**
 * Gets the display title for a widget type.
 *
 * @param type - Widget type identifier
 * @returns Display title for the widget
 */
const getWidgetTitle = (type: WidgetType) => WIDGET_TITLES[type] ?? "Widget"

/**
 * Chat interface component.
 *
 * Renders the complete chat UI including message list, input field,
 * and optional widget panel. Manages chat state, handles user input,
 * and coordinates widget display based on AI tool invocations.
 *
 * @returns Rendered chat interface
 */
export function ChatInterface() {
  // Store subscriptions (using selectors for optimized re-renders)
  const layoutMode = useChatStore(selectLayoutMode)
  const error = useChatStore(selectError)
  const setError = useChatStore((state) => state.setError)
  const activeWidget = useChatStore((state) => state.activeWidget)
  const setActiveWidget = useChatStore((state) => state.setActiveWidget)
  const setLayoutMode = useChatStore((state) => state.setLayoutMode)
  const closeWidget = useChatStore((state) => state.closeWidget)

  // Accessibility: respect user's motion preferences
  const shouldReduceMotion = useReducedMotion()

  // Input field reference for focus management
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Auto-focus input on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  /**
   * Handles widget tool results from AI responses.
   *
   * When a tool returns widget data, this function:
   * 1. Validates the result has required properties
   * 2. Sets the active widget in the store
   * 3. Switches layout to split mode
   *
   * @param result - Widget tool result from AI SDK tool execution
   */
  const handleWidgetResult = useCallback(
    (result: WidgetToolResult | null | undefined) => {
      // Early return if result is invalid or missing widget type
      if (!result || !result.widgetType) {
        return
      }

      // Update store with widget configuration
      setActiveWidget({
        type: result.widgetType,
        data: result.widgetData ?? null,
        // Use displayText from tool or fall back to default title
        title: result.displayText ?? getWidgetTitle(result.widgetType),
      })

      // Switch to split layout to show widget panel
      setLayoutMode("split")
    },
    [setActiveWidget, setLayoutMode]
  )

  /**
   * Inspects a finished message for tool invocations with widget data.
   *
   * **AI SDK 5 Implementation:**
   * This function correctly implements widget detection for AI SDK 5 by:
   * 1. Checking the `message.parts` array (not deprecated toolInvocations)
   * 2. Filtering for tool UI parts using `isToolUIPart`
   * 3. Finding parts with `state === 'output-available'`
   * 4. Extracting the tool result from `part.output`
   *
   * **Why this approach:**
   * - AI SDK 5 uses a parts-based message structure
   * - Tool invocations are represented as typed parts
   * - The `output` property contains the tool's execute return value
   * - Only completed tools have 'output-available' state
   *
   * @param message - UIMessage from AI SDK with parts array
   */
  const inspectMessageForTools = useCallback(
    (message: UIMessage) => {
      // Early return if message has no parts
      if (!message.parts?.length) {
        return
      }

      // Filter for tool UI parts with completed output
      const toolParts = message.parts
        .filter(isToolUIPart) // Filter for tool-related parts
        .filter((part) => part.state === "output-available") // Only completed tools

      if (toolParts.length === 0) {
        return
      }

      // Get the most recent tool part (in case multiple tools were called)
      const latestPart = toolParts[toolParts.length - 1]
      const result = (latestPart.output ?? null) as WidgetToolResult | null

      // Development logging for debugging widget detection
      if (process.env.NODE_ENV === "development") {
        console.log("[Chat] Tool part detected:", {
          type: latestPart.type,
          state: latestPart.state,
          hasOutput: !!latestPart.output,
        })
      }

      handleWidgetResult(result)
    },
    [handleWidgetResult]
  )

  /**
   * AI SDK useChat hook.
   *
   * Manages chat state, message streaming, and API communication.
   *
   * **Important:** The `onFinish` callback receives an event object
   * in AI SDK 5, not the message directly. We destructure { message }
   * to extract the completed message.
   *
   * @see {@link https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat|useChat API Reference}
   */
  const { messages, status, regenerate, clearError, sendMessage } = useChat({
    /** Error handler for API or network errors */
    onError: (err) => {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to get a response. Please try again."
      setError(message)
    },
    /**
     * Callback when message streaming completes.
     *
     * **AI SDK 5 Change:** Receives an event object { message, messages, ... }
     * instead of the message directly. Must destructure to extract message.
     */
    onFinish: ({ message }) => {
      setError(null)
      inspectMessageForTools(message)
    },
  })

  // Local input state
  const [input, setInput] = useState("")

  // Derived loading state
  const isLoading = useMemo(
    () => status === "submitted" || status === "streaming",
    [status]
  )

  /**
   * Handles input field changes.
   *
   * @param event - Change event from textarea
   */
  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLTextAreaElement>) => {
      setInput(event.target.value)
    },
    []
  )

  /**
   * Dismisses the current error message.
   */
  const handleDismissError = useCallback(() => {
    clearError()
    setError(null)
  }, [clearError, setError])

  /**
   * Retries the last failed message by regenerating the AI response.
   * Clears any existing error before retrying.
   */
  const handleRetry = useCallback(async () => {
    clearError()
    setError(null)
    try {
      await regenerate()
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Retry failed. Please try again."
      setError(message)
    }
  }, [clearError, regenerate, setError])

  /**
   * Handles form submission for sending messages.
   *
   * **Flow:**
   * 1. Prevents default form submission
   * 2. Validates input is not empty
   * 3. Clears any existing errors
   * 4. Optimistically clears input field
   * 5. Sends message via AI SDK
   * 6. Restores input on error
   * 7. Returns focus to input field
   *
   * @param event - Form submit event
   */
  const handleFormSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()

      // Don't submit empty messages
      if (!input.trim()) {
        return
      }

      // Store message before clearing (for error recovery)
      const pendingMessage = input

      // Clear any previous errors
      if (error) {
        clearError()
        setError(null)
      }

      // Optimistically clear input
      setInput("")

      try {
        await sendMessage({ text: pendingMessage })
      } catch (err) {
        // Restore input on error so user can retry
        setInput(pendingMessage)
        const message =
          err instanceof Error
            ? err.message
            : "Failed to send your message. Please try again."
        setError(message)
      } finally {
        // Always return focus to input
        inputRef.current?.focus()
      }
    },
    [clearError, error, input, sendMessage, setError]
  )

  /**
   * Keyboard shortcut handlers.
   *
   * **Shortcuts:**
   * - `Cmd/Ctrl + K`: Focus input field (global shortcut pattern)
   * - `Escape`: Close active widget panel
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Cmd/Ctrl + K to focus input
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault()
        inputRef.current?.focus()
      }

      // Escape to close widget
      if (event.key === "Escape" && activeWidget) {
        event.preventDefault()
        closeWidget()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [activeWidget, closeWidget])

  return (
    <div
      className="flex h-[calc(100vh-4rem)] flex-col"
      data-layout={layoutMode}
    >
      <div
        className={cn(
          "flex-1 transition-all duration-300",
          layoutMode === "split" && "overflow-hidden"
        )}
      >
        {layoutMode === "split" ? (
          <div className="grid h-full grid-cols-1 gap-0 lg:grid-cols-2">
            <div className="flex h-full flex-col border-r">
              <div className="flex-1 overflow-hidden">
                <div className="mx-auto h-full max-w-3xl px-4">
                  <ChatMessageList
                    messages={messages}
                    isLoading={isLoading}
                    error={error}
                    onDismissError={error ? handleDismissError : undefined}
                    onRetry={error ? handleRetry : undefined}
                  />
                </div>
              </div>
            </div>
            <div className="flex h-full flex-col overflow-hidden bg-muted/30">
              <AnimatePresence mode="wait" initial={false}>
                {activeWidget ? (
                  <ChatWidgetPanel
                    key={`widget-${activeWidget.type}`}
                    widget={activeWidget}
                  />
                ) : (
                  <motion.div
                    key="widget-empty"
                    className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground"
                    initial={shouldReduceMotion ? false : { opacity: 0 }}
                    animate={shouldReduceMotion ? {} : { opacity: 1 }}
                    exit={shouldReduceMotion ? undefined : { opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    No widget to display yet.
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="flex-1">
              <div className="mx-auto h-full max-w-3xl px-4">
                <ChatMessageList
                  messages={messages}
                  isLoading={isLoading}
                  error={error}
                  onDismissError={error ? handleDismissError : undefined}
                  onRetry={error ? handleRetry : undefined}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={cn(layoutMode === "split" && "lg:grid lg:grid-cols-2")}>
        <div
          className={cn(
            layoutMode === "split" && "lg:border-r lg:border-border/50"
          )}
        >
          <ChatInput
            ref={inputRef}
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleFormSubmit}
            isLoading={isLoading}
            error={error}
          />
        </div>
        {layoutMode === "split" && (
          <div className="hidden bg-muted/30 lg:block" />
        )}
      </div>
    </div>
  )
}
