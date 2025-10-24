"use client"

import { PanelLeft, PanelLeftClose } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  selectSidebarState,
  selectToggleSidebar,
  useSidebarStore,
} from "@/lib/stores/use-sidebar-store"
import { cn } from "@/lib/utils"

interface SidebarToggleProps {
  className?: string
}

export function SidebarToggle({ className }: SidebarToggleProps) {
  const state = useSidebarStore(selectSidebarState)
  const toggleSidebar = useSidebarStore(selectToggleSidebar)

  return (
    <Button
      aria-expanded={state === "expanded"}
      aria-label={state === "expanded" ? "Collapse sidebar" : "Expand sidebar"}
      className={cn(
        "h-8 w-8 transition-all duration-200 hover:scale-105 focus-visible:scale-105",
        className
      )}
      onClick={toggleSidebar}
      size="icon"
      type="button"
      variant="ghost"
    >
      {state === "expanded" ? (
        <PanelLeftClose aria-hidden className="h-4 w-4" />
      ) : (
        <PanelLeft aria-hidden className="h-4 w-4" />
      )}
    </Button>
  )
}
