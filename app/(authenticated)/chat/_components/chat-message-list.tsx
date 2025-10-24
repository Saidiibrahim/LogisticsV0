"use client"

/**
 * Chat Message List Component
 *
 * Displays a scrollable list of chat messages with auto-scrolling behavior,
 * empty state, loading indicator, and error handling.
 *
 * **Features:**
 * - Auto-scrolls to bottom when new messages arrive
 * - Empty state with helpful prompts
 * - Loading indicator (animated dots)
 * - Error display at the top of the list
 * - Accessibility annotations (ARIA roles and labels)
 *
 * **Accessibility:**
 * - Uses `role="log"` for screen reader announcements
 * - `aria-live="polite"` for non-intrusive updates
 * - `aria-busy` indicates loading state
 * - Semantic article elements for each message
 *
 * @module app/(authenticated)/chat/_components/chat-message-list
 */

import type { UIMessage } from "ai"
import { useEffect, useRef } from "react"
import { ChatError } from "./chat-error"
import { ChatMessage } from "./chat-message"

interface ChatMessageListProps {
  /** Array of messages from AI SDK */
  messages: UIMessage[]
  /** Whether a message is currently being streamed */
  isLoading: boolean
  /** Optional error message to display */
  error?: string | null
  /** Callback to dismiss the error */
  onDismissError?: () => void
  /** Callback to retry the failed message */
  onRetry?: () => void
}

/**
 * Chat message list component.
 *
 * Renders a scrollable container of messages with automatic scrolling to
 * the bottom when new messages arrive. Displays an empty state when no
 * messages exist, and a loading indicator when waiting for AI response.
 *
 * **Auto-scroll Behavior:**
 * - Scrolls to bottom automatically when messages change
 * - Uses scrollTop manipulation for immediate scroll
 * - scroll-smooth class for user-initiated scrolling
 *
 * @param props - Component props
 * @returns Rendered message list
 */
export function ChatMessageList({
  messages,
  isLoading,
  error,
  onDismissError,
  onRetry,
}: ChatMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  /**
   * Auto-scroll to bottom when messages change.
   * Disabled exhaustive deps warning as we intentionally only
   * want to trigger on messages array reference changes.
   */
  // biome-ignore lint/correctness/useExhaustiveDependencies: re-run when messages array changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  return (
    <div
      ref={scrollRef}
      role="log"
      aria-live="polite"
      aria-busy={isLoading}
      aria-label="Chat messages"
      className="flex h-full flex-col overflow-y-auto scroll-smooth"
    >
      {/* Error banner (sticky at top) */}
      {error && (
        <div className="sticky top-0 z-10 bg-background/80 px-4 pt-4 backdrop-blur">
          <ChatError
            message={error}
            onDismiss={onDismissError ?? (() => undefined)}
            onRetry={onRetry}
          />
        </div>
      )}

      {/* Empty state */}
      {messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center px-6">
          <div className="text-center">
            <h2 className="text-2xl font-semibold">Start a conversation</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Ask anything about your matches, training, or performance.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 flex-col">
          {/* Message list */}
          {messages.map((message, index) => (
            <article
              key={message.id ?? `message-${index}`}
              aria-label={`${message.role === "user" ? "You" : "Assistant"} said`}
            >
              <ChatMessage message={message} />
            </article>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex w-full justify-start p-4">
              <div className="rounded-lg bg-muted px-4 py-3 text-muted-foreground">
                <div className="flex items-center gap-1.5">
                  {/* Animated dots with staggered delays */}
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground" />
                  <span className="size-2 animate-bounce rounded-full bg-muted-foreground [animation-delay:0.2s]" />
                  <span className="sr-only">Assistant is typing</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
