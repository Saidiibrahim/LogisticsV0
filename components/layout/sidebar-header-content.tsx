"use client"

import Image from "next/image"
import * as React from "react"

import { SidebarToggle } from "@/components/layout/sidebar-toggle"
import {
  selectIsSidebarMobile,
  selectSidebarState,
  useSidebarStore,
} from "@/lib/stores/use-sidebar-store"
import { cn } from "@/lib/utils"

export function SidebarHeaderContent() {
  const [isInteracting, setIsInteracting] = React.useState(false)
  const state = useSidebarStore(selectSidebarState)
  const isMobile = useSidebarStore(selectIsSidebarMobile)

  const statusMessage =
    state === "expanded" ? "Sidebar expanded" : "Sidebar collapsed"
  const showCollapsedView = !isMobile && state === "collapsed"

  const activateInterchange = React.useCallback(() => {
    setIsInteracting(true)
  }, [])

  const deactivateInterchange = React.useCallback(() => {
    setIsInteracting(false)
  }, [])

  const handleBlur = React.useCallback(
    (event: React.FocusEvent<HTMLDivElement>) => {
      const nextActive = event.relatedTarget as Node | null

      if (!event.currentTarget.contains(nextActive)) {
        setIsInteracting(false)
      }
    },
    []
  )

  if (showCollapsedView) {
    return (
      <>
        {/* biome-ignore lint/a11y/noStaticElementInteractions: Container manages hover/focus transitions for the toggle preview. */}
        <div
          className="relative flex h-12 w-full items-center justify-center"
          onBlur={handleBlur}
          onFocusCapture={activateInterchange}
          onMouseEnter={activateInterchange}
          onMouseLeave={deactivateInterchange}
        >
          <div
            aria-hidden={isInteracting}
            className={cn(
              "sidebar-header-transition absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out will-change-[opacity]",
              isInteracting ? "opacity-0 pointer-events-none" : "opacity-100"
            )}
            tabIndex={-1}
          >
            <Image
              alt="RefZone logo"
              className="h-7 w-7"
              height={28}
              priority
              src="/logo.svg"
              width={28}
            />
          </div>

          <div
            className={cn(
              "sidebar-header-transition absolute inset-0 flex items-center justify-center transition-opacity duration-200 ease-in-out will-change-[opacity]",
              isInteracting ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
          >
            <SidebarToggle />
          </div>
        </div>

        <span aria-live="polite" className="sr-only">
          {statusMessage}
        </span>
      </>
    )
  }

  return (
    <>
      <div className="flex items-center justify-between">
        <Image
          alt="RefZone logo"
          className="h-8 w-8"
          height={32}
          priority
          src="/logo.svg"
          width={32}
        />

        <SidebarToggle />
      </div>

      <span aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </>
  )
}
