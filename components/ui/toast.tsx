"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export type ToastVariant = "default" | "destructive"

export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  description?: string
  variant?: ToastVariant
}

export function Toast({
  className,
  title,
  description,
  variant = "default",
  ...props
}: ToastProps) {
  return (
    <div
      className={cn(
        "pointer-events-auto mx-auto w-full max-w-sm rounded-md border bg-background p-4 shadow-lg",
        variant === "destructive" && "border-destructive/50 bg-destructive/10",
        className
      )}
      role="status"
      {...props}
    >
      {title && <div className="font-medium">{title}</div>}
      {description && (
        <div className="text-muted-foreground text-sm">{description}</div>
      )}
    </div>
  )
}

export function ToastViewport({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-4 z-50 flex flex-col gap-2 px-4 sm:items-end",
        className
      )}
      {...props}
    />
  )}


