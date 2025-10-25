"use client"

/**
 * Chat Widget Panel Component
 *
 * Displays interactive widgets in the right panel of the split-view layout.
 * Dynamically loads widget components based on the widget type and manages
 * the widget display lifecycle.
 *
 * **Features:**
 * - Dynamic widget loading (code-splitting)
 * - Loading skeletons during widget load
 * - Smooth entrance/exit animations
 * - Close button with keyboard support
 * - Fallback UI for unsupported widget types
 *
 * **Supported Widgets:**
 * - Calendar: Upcoming deliveries and pickup events
 * - Driver Performance: Performance metrics and recent delivery history
 *
 * @module app/(authenticated)/chat/_components/chat-widget-panel
 */

import { motion, useReducedMotion } from "framer-motion"
import { X } from "lucide-react"
import dynamic from "next/dynamic"
import { Button } from "@/components/ui/button"
import { useChatStore } from "@/lib/stores/chat-store"
import type { WidgetConfig } from "@/lib/types/chat"

/**
 * Loading skeleton displayed while widget components are being loaded.
 * Uses pulse animation for visual feedback.
 */
const WidgetSkeleton = () => (
  <div className="space-y-3">
    <div className="h-4 w-1/3 animate-pulse rounded bg-muted/70" />
    <div className="h-24 rounded-lg bg-muted/40" />
    <div className="h-24 rounded-lg bg-muted/30" />
  </div>
)

/**
 * Calendar widget - dynamically imported for code-splitting.
 * Shows loading skeleton while component loads.
 */
const CalendarWidget = dynamic(
  () => import("../_widgets/calendar-widget").then((mod) => mod.CalendarWidget),
  { loading: () => <WidgetSkeleton /> }
)


/**
 * Driver performance widget - dynamically imported for code-splitting.
 * Shows loading skeleton while component loads.
 */
const DriverPerformanceWidget = dynamic(
  () =>
    import("../_widgets/driver-performance-widget").then(
      (mod) => mod.DriverPerformanceWidget
    ),
  { loading: () => <WidgetSkeleton /> }
)

interface ChatWidgetPanelProps {
  /** Widget configuration including type, data, and title */
  widget: WidgetConfig
}

/**
 * Chat widget panel component.
 *
 * Renders the widget panel in the right side of the split-view layout.
 * Dynamically loads the appropriate widget component based on the widget type
 * and provides a header with title and close button.
 *
 * **Performance:**
 * - Uses Next.js dynamic imports for code-splitting
 * - Each widget is loaded only when needed
 * - Reduces initial bundle size
 *
 * @param props - Component props
 * @returns Rendered widget panel
 */
export function ChatWidgetPanel({ widget }: ChatWidgetPanelProps) {
  const closeWidget = useChatStore((state) => state.closeWidget)
  const shouldReduceMotion = useReducedMotion()

  /**
   * Renders the appropriate widget component based on widget type.
   * Falls back to an error message if widget type is not supported.
   */
  const renderWidget = () => {
    switch (widget.type) {
      case "calendar":
        return <CalendarWidget data={widget.data} />
      case "driver-performance":
        return <DriverPerformanceWidget data={widget.data} />
      default:
        return (
          <div className="flex h-full items-center justify-center p-8 text-center text-sm text-muted-foreground">
            Widget type &ldquo;{widget.type}&rdquo; is not supported yet.
          </div>
        )
    }
  }

  return (
    <motion.div
      className="flex h-full flex-col"
      initial={shouldReduceMotion ? false : { opacity: 0, x: 40 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, x: 40 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      {/* Widget header */}
      <div className="flex items-center justify-between border-b bg-background px-4 py-3">
        <h3 className="font-semibold">{widget.title ?? "Widget"}</h3>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={closeWidget}
        >
          <X className="size-4" />
          <span className="sr-only">Close widget</span>
        </Button>
      </div>

      {/* Widget content (scrollable) */}
      <div className="flex-1 overflow-y-auto p-4">{renderWidget()}</div>
    </motion.div>
  )
}
