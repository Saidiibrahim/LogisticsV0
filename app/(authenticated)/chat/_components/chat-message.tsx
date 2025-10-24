"use client"

/**
 * Chat Message Component
 *
 * Displays an individual message in the chat interface with role-based styling
 * and smooth animations. Messages are memoized for performance optimization.
 *
 * **Features:**
 * - Role-based styling (user vs assistant)
 * - Smooth entrance animations
 * - Accessibility support (reduced motion)
 * - Text content extraction from message parts
 * - Timestamp display
 *
 * **Styling:**
 * - User messages: Right-aligned, primary colored background
 * - Assistant messages: Left-aligned, muted background
 *
 * @module app/(authenticated)/chat/_components/chat-message
 */

import type { UIMessage } from "ai"
import { motion, useReducedMotion } from "framer-motion"
import { memo } from "react"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  /** Message object from AI SDK containing parts array */
  message: UIMessage
}

/**
 * Chat message component.
 *
 * Renders a single message bubble with appropriate styling based on the
 * message role (user or assistant). Extracts text content from the message
 * parts array and applies smooth entrance animations.
 *
 * **Performance:**
 * - Wrapped in React.memo to prevent unnecessary re-renders
 * - Only re-renders when message reference changes
 *
 * @param props - Component props
 * @returns Rendered message bubble
 */
function ChatMessageComponent({ message }: ChatMessageProps) {
  const isUser = message.role === "user"
  const shouldReduceMotion = useReducedMotion()

  // Extract text content from message parts
  // Messages can have multiple parts (text, tool invocations, etc.)
  // We only want to display text parts in the message bubble
  const content = message.parts
    .filter((part) => part.type === "text")
    .map((part) => (part as { type: "text"; text: string }).text)
    .join("")

  // Configure animations based on accessibility preferences
  const animationProps = shouldReduceMotion
    ? { initial: false, animate: "visible" }
    : {
        initial: "hidden" as const,
        animate: "visible" as const,
        variants: {
          hidden: { opacity: 0, y: 16 },
          visible: { opacity: 1, y: 0 },
        },
        transition: { duration: 0.25, ease: "easeOut" as const },
      }

  return (
    <motion.div
      {...animationProps}
      className={cn(
        "flex w-full gap-3 p-4",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-lg px-4 py-3",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {/* Message content with preserved whitespace */}
        <p className="whitespace-pre-wrap break-words text-sm">{content}</p>

        {/* Timestamp */}
        {/* <time className="mt-1 block text-xs opacity-60">
          {new Date(
            (message as UIMessage & { createdAt?: number }).createdAt ??
              Date.now()
          ).toLocaleTimeString()}
        </time> */}
      </div>
    </motion.div>
  )
}

/**
 * Memoized chat message component.
 *
 * Only re-renders when the message prop reference changes,
 * improving performance when rendering large message lists.
 */
export const ChatMessage = memo(ChatMessageComponent)
