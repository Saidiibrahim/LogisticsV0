"use client"

import { Clock, LogOut, Settings } from "lucide-react"
import { useRouter } from "next/navigation"
import * as React from "react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command"
import {
  selectAddRecentPage,
  selectAddRecentSearch,
  selectClearRecent,
  selectIsSearchOpen,
  selectRecentPages,
  selectRecentSearches,
  selectSearchClose,
  selectSearchOpen,
  selectSearchToggle,
  useSearchStore,
} from "@/lib/stores/use-search-store"
import { createClient } from "@/lib/supabase/client"
import {
  libraryNavItems,
  libraryNavSections,
  mainNavItems,
} from "./navigation-data"

/**
 * Registers the global ⌘/Ctrl+K shortcut used throughout the app to toggle the
 * search dialog.
 */
function useSearchHotkeys() {
  const toggleSearch = useSearchStore(selectSearchToggle)

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "k" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault()
        toggleSearch()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [toggleSearch])
}

/**
 * Universal command palette that surfaces navigation shortcuts, recent items,
 * and contextual commands such as sign out.
 */
export function SearchCommandDialog() {
  const router = useRouter()
  const isOpen = useSearchStore(selectIsSearchOpen)
  const openSearch = useSearchStore(selectSearchOpen)
  const closeSearch = useSearchStore(selectSearchClose)
  const addRecentPage = useSearchStore(selectAddRecentPage)
  const addRecentSearch = useSearchStore(selectAddRecentSearch)
  const recentPages = useSearchStore(selectRecentPages)
  const recentSearches = useSearchStore(selectRecentSearches)
  const clearRecent = useSearchStore(selectClearRecent)
  const [query, setQuery] = React.useState("")
  const [isSigningOut, setIsSigningOut] = React.useState(false)

  useSearchHotkeys()

  React.useEffect(() => {
    if (!isOpen) {
      setQuery("")
    }
  }, [isOpen])

  React.useEffect(() => {
    if (useSearchStore.getState().isOpen) {
      closeSearch()
    }
  }, [closeSearch])

  const handleOpenChange = React.useCallback(
    (open: boolean) => {
      if (open) {
        openSearch()
      } else {
        closeSearch()
      }
    },
    [closeSearch, openSearch]
  )

  const recordSearch = React.useCallback(() => {
    const trimmed = query.trim()
    if (trimmed) {
      addRecentSearch(trimmed)
    }
  }, [addRecentSearch, query])

  // Navigate to the selected entry and capture it for the recent list
  const handleNavigate = React.useCallback(
    (href: string, title: string) => {
      closeSearch()
      recordSearch()
      addRecentPage({ id: href, title, path: href })
      router.push(href)
    },
    [addRecentPage, closeSearch, recordSearch, router]
  )

  const handleLogout = React.useCallback(async () => {
    try {
      setIsSigningOut(true)
      closeSearch()
      recordSearch()
      const supabase = createClient()
      await supabase.auth.signOut()
      clearRecent()
      router.push("/auth/login")
    } finally {
      setIsSigningOut(false)
    }
  }, [clearRecent, closeSearch, recordSearch, router])

  return (
    <CommandDialog
      className="max-w-xl"
      onOpenChange={handleOpenChange}
      open={isOpen}
    >
      <CommandInput
        onValueChange={setQuery}
        placeholder="Search pages, resources, or commands..."
        value={query}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {recentPages.length > 0 && (
          <CommandGroup heading="Recent Pages">
            {recentPages.map((page) => (
              <CommandItem
                key={page.id}
                onSelect={() => handleNavigate(page.path, page.title)}
                value={`${page.title} ${page.path}`}
              >
                <Clock className="size-4" />
                <span>{page.title}</span>
                <CommandShortcut>{page.path}</CommandShortcut>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentPages.length > 0 &&
          (mainNavItems.length > 0 || libraryNavItems.length > 0) && (
            <CommandSeparator />
          )}

        <CommandGroup heading="Navigation">
          {mainNavItems.map((item) => (
            <CommandItem
              key={item.href}
              onSelect={() => handleNavigate(item.href, item.title)}
              value={`${item.title} ${item.href}`}
            >
              <item.icon className="size-4" />
              <span>{item.title}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {libraryNavSections.map((section, index) => {
          const sectionKey =
            section.title ?? section.items.map((item) => item.href).join(":")

          return (
            <React.Fragment key={sectionKey}>
              <CommandGroup heading={section.title}>
                {section.items.map((item) => (
                  <CommandItem
                    key={item.href}
                    onSelect={() => handleNavigate(item.href, item.title)}
                    value={`${item.title} ${item.href}`}
                  >
                    <item.icon className="size-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
              </CommandGroup>

              {index < libraryNavSections.length - 1 && <CommandSeparator />}
            </React.Fragment>
          )
        })}

        {libraryNavSections.length > 0 && <CommandSeparator />}

        {recentSearches.length > 0 && (
          <CommandGroup heading="Recent Searches">
            {recentSearches.map((search) => (
              <CommandItem
                key={search}
                onSelect={() => setQuery(search)}
                value={search}
              >
                <span className="ml-1">{search}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {recentSearches.length > 0 && <CommandSeparator />}

        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => handleNavigate("/settings", "Settings")}>
            <Settings className="size-4" />
            <span>Settings</span>
            <CommandShortcut>↵</CommandShortcut>
          </CommandItem>
          <CommandItem disabled={isSigningOut} onSelect={handleLogout}>
            <LogOut className="size-4" />
            <span>Sign out</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}
