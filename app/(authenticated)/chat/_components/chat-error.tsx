"use client"

/**
 * Chat Error Component
 *
 * Displays error messages in the chat interface with options to retry
 * or dismiss. Shown when API calls fail or other errors occur during
 * message submission.
 *
 * **Features:**
 * - Destructive alert styling for visibility
 * - Optional retry button for recoverable errors
 * - Dismiss button to clear error state
 * - Icon indicator for quick recognition
 *
 * **Usage:**
 * - Typically displayed at the top of the message list
 * - Sticky positioning ensures visibility while scrolling
 * - Input is disabled while error is shown
 *
 * @module app/(authenticated)/chat/_components/chat-error
 */

import { AlertCircle, X } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ChatErrorProps {
  /** Error message to display to the user */
  message: string
  /** Callback to dismiss/clear the error */
  onDismiss: () => void
  /** Optional callback to retry the failed operation */
  onRetry?: () => void
}

/**
 * Chat error component.
 *
 * Renders an error alert with the error message and action buttons.
 * The retry button is conditionally rendered based on whether a retry
 * callback is provided.
 *
 * **Error Handling:**
 * - Network errors: Retryable
 * - API errors: May or may not be retryable depending on error type
 * - Validation errors: Usually not retryable (dismiss only)
 *
 * @param props - Component props
 * @returns Rendered error alert
 */
export function ChatError({ message, onDismiss, onRetry }: ChatErrorProps) {
  return (
    <Alert variant="destructive" className="mb-4">
      {/* Error icon */}
      <AlertCircle className="size-4" />

      <AlertDescription className="ml-2 flex items-center justify-between gap-4">
        {/* Error message */}
        <span>{message}</span>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {/* Optional retry button */}
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              Retry
            </Button>
          )}

          {/* Dismiss button */}
          <Button size="sm" variant="ghost" onClick={onDismiss}>
            <X className="size-4" />
            <span className="sr-only">Dismiss error</span>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  )
}
