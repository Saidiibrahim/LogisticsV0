"use client"

/**
 * Chat Input Component
 *
 * Text input area with send button for composing and sending chat messages.
 * Supports keyboard shortcuts, loading states, and error handling.
 *
 * **Features:**
 * - Auto-expanding textarea
 * - Enter to send, Shift+Enter for new line
 * - Loading indicator during message submission
 * - Disabled state when loading or error present
 * - Dynamic placeholder based on state
 * - Forward ref support for focus management
 *
 * **Keyboard Shortcuts:**
 * - `Enter`: Submit message (if not empty)
 * - `Shift + Enter`: Insert new line
 *
 * @module app/(authenticated)/chat/_components/chat-input
 */

import { motion, useReducedMotion } from "framer-motion"
import { Send } from "lucide-react"
import {
  type ChangeEvent,
  type FormEvent,
  forwardRef,
  type KeyboardEvent,
} from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
  /** Current input value */
  input: string
  /** Input change handler */
  handleInputChange: (event: ChangeEvent<HTMLTextAreaElement>) => void
  /** Form submission handler */
  handleSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>
  /** Whether a message is currently being sent */
  isLoading: boolean
  /** Optional error message to display */
  error?: string | null
}

/**
 * Chat input component.
 *
 * Renders a textarea for message input with a send button. Handles keyboard
 * shortcuts for submitting messages and provides visual feedback for loading
 * and error states.
 *
 * **Accessibility:**
 * - aria-label for screen readers
 * - Disabled states prevent interaction during loading/errors
 * - Screen reader announcements for button states
 *
 * @param props - Component props
 * @param ref - Forward ref to textarea element
 * @returns Rendered input component
 */
export const ChatInput = forwardRef<HTMLTextAreaElement, ChatInputProps>(
  function ChatInput(
    {
      input,
      handleInputChange,
      handleSubmit,
      isLoading,
      error,
    }: ChatInputProps,
    ref
  ) {
    const shouldReduceMotion = useReducedMotion()

    /**
     * Handles Enter key press to submit form.
     * Allows Shift+Enter for multi-line input.
     *
     * @param event - Keyboard event
     */
    const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // Submit on Enter (but allow Shift+Enter for new lines)
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault()

        // Don't submit if input is empty
        if (!input.trim()) {
          return
        }

        // Trigger form submission
        event.currentTarget.form?.requestSubmit()
      }
    }

    return (
      <div className="sticky bottom-0 bg-background/80 px-4 py-6 backdrop-blur-sm">
        <form onSubmit={handleSubmit} className="relative mx-auto max-w-3xl">
          {/* Input container with integrated button */}
          <div className="relative">
            {/* Text input */}
            <Textarea
              ref={ref}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder={
                isLoading
                  ? "Waiting for response..."
                  : error
                    ? "Resolve the error above to continue"
                    : "Type your message..."
              }
              aria-label="Chat message input"
              className="min-h-[60px] resize-none border-border/50 bg-background/50 pr-14 shadow-sm transition-all focus:border-border focus:bg-background/70"
              disabled={isLoading || Boolean(error)}
            />

            {/* Send button - positioned inside textarea */}
            <Button
              type="submit"
              disabled={!input.trim() || isLoading || Boolean(error)}
              size="icon"
              className="absolute bottom-2 right-2 h-10 w-10 shrink-0 shadow-md transition-all hover:scale-105 hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:hover:scale-100 disabled:hover:shadow-md"
            >
              {isLoading ? (
                // Loading spinner
                <motion.span
                  className="inline-flex size-4 rounded-full border-2 border-background border-t-transparent"
                  animate={
                    shouldReduceMotion
                      ? { rotate: 360 }
                      : { rotate: 360, scale: [1, 1.05, 1] }
                  }
                  transition={{
                    duration: 0.9,
                    repeat: Number.POSITIVE_INFINITY,
                    ease: "linear",
                  }}
                />
              ) : (
                // Send icon
                <Send className="size-4" />
              )}
              <span className="sr-only">
                {isLoading ? "Sending..." : "Send message"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    )
  }
)
