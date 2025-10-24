"use client"

import { AlertCircle } from "lucide-react"
import { useEffect } from "react"

import { Button } from "@/components/ui/button"
import { getErrorMessage, isAuthError } from "@/lib/utils/errors"

export default function MatchesError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("Matches page error:", error)
  }, [error])

  const authIssue = isAuthError(error)
  const description = authIssue
    ? "Your session may have expired. Please refresh or sign back in, then try again."
    : "We could not retrieve your match history. Please try again."

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Matches</h1>
        <p className="text-muted-foreground">
          Browse your upcoming assignments and past performances.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-12 text-center">
        <div className="mx-auto flex max-w-md flex-col items-center gap-4">
          <AlertCircle className="size-12 text-destructive" />
          <div className="space-y-2">
            <h3 className="font-semibold text-lg">Failed to Load Matches</h3>
            <p className="text-muted-foreground text-sm">{description}</p>
            {process.env.NODE_ENV === "development" && (
              <p className="text-muted-foreground text-xs">
                {getErrorMessage(error)}
              </p>
            )}
          </div>
          <Button onClick={reset}>Try Again</Button>
        </div>
      </div>
    </div>
  )
}
