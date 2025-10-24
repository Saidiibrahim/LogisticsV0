"use client"

import { Search } from "lucide-react"
import * as React from "react"

import { SidebarMenuButton } from "@/components/ui/sidebar"
import { selectSearchOpen, useSearchStore } from "@/lib/stores/use-search-store"
import {
  selectSidebarState,
  useSidebarStore,
} from "@/lib/stores/use-sidebar-store"
import { cn } from "@/lib/utils"

export function SearchButton({ className }: { className?: string }) {
  const sidebarState = useSidebarStore(selectSidebarState)
  const openSearch = useSearchStore(selectSearchOpen)

  const handleClick = React.useCallback(() => {
    openSearch()
  }, [openSearch])

  return (
    <SidebarMenuButton
      className={cn(
        "mx-2 mt-3 flex h-10 items-center gap-2 rounded-md border border-transparent bg-background px-3 text-sidebar-foreground/80 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        "group-data-[collapsible=icon]:h-9 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:border-none",
        className
      )}
      data-sidebar="search-button"
      onClick={handleClick}
      tooltip="Search"
    >
      <Search aria-hidden="true" className="size-4" />
      {sidebarState === "expanded" && (
        <>
          <span className="flex-1 text-left text-sm">Search</span>
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 font-medium text-[10px] text-muted-foreground/80 leading-none tracking-wide md:inline-flex">
            ⌘K
          </kbd>
        </>
      )}
    </SidebarMenuButton>
  )
}
