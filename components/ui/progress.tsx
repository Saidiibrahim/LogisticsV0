"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"

export interface ProgressProps
  extends React.ComponentProps<"div"> {
  value?: number
  indicatorClassName?: string
}

export function Progress({
  className,
  indicatorClassName,
  value = 0,
  ...props
}: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={cn("relative h-2 w-full overflow-hidden rounded-full bg-muted", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      {...props}
    >
      <div
        className={cn("h-full w-0 bg-primary transition-[width]", indicatorClassName)}
        style={{ width: `${clamped}%` }}
      />
    </div>
  )
}


