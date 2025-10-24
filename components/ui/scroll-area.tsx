"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"

export type ScrollAreaProps = React.ComponentProps<"div">

export function ScrollArea({ className, children, ...props }: ScrollAreaProps) {
  return (
    <div className={cn("relative overflow-auto", className)} {...props}>
      {children}
    </div>
  )
}


