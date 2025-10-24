"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"

export type AvatarProps = React.ComponentProps<"div">

function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <div
      className={cn(
        "relative inline-flex size-10 items-center justify-center overflow-hidden rounded-full bg-muted",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export type AvatarImageProps = React.ImgHTMLAttributes<HTMLImageElement>

function AvatarImage({ className, alt, ...props }: AvatarImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={cn("size-full object-cover", className)}
      {...props}
    />
  )
}

export type AvatarFallbackProps = React.HTMLAttributes<HTMLSpanElement>

function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <span className={cn("text-foreground text-sm", className)} {...props}>
      {children}
    </span>
  )
}

export { Avatar, AvatarImage, AvatarFallback }


