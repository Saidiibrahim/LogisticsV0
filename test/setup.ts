import React from "react"
import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

declare global {
  // eslint-disable-next-line no-var
  var ResizeObserver: typeof ResizeObserver
  // eslint-disable-next-line no-var
  var __setViewportWidth: (width: number) => void
}

type MediaQueryListener = (event: MediaQueryListEvent) => void

interface MediaQueryRegistryEntry {
  query: string
  listeners: Set<MediaQueryListener>
  mql: MediaQueryList
}

const DEFAULT_VIEWPORT_WIDTH = 1024
let viewportWidth = DEFAULT_VIEWPORT_WIDTH
const mediaQueryRegistry: MediaQueryRegistryEntry[] = []

const createMatchMedia = () =>
  ((query: string) => {
    const listeners = new Set<MediaQueryListener>()
    const mediaQueryList = {
      matches: matchQuery(query, viewportWidth),
      media: query,
      onchange: null,
      addListener: (callback: MediaQueryListener) => {
        listeners.add(callback)
      },
      removeListener: (callback: MediaQueryListener) => {
        listeners.delete(callback)
      },
      addEventListener: (_event: "change", callback: MediaQueryListener) => {
        listeners.add(callback)
      },
      removeEventListener: (_event: "change", callback: MediaQueryListener) => {
        listeners.delete(callback)
      },
      dispatchEvent: (event: MediaQueryListEvent) => {
        for (const listener of listeners) {
          listener(event)
        }
        return true
      },
    } as MediaQueryList

    mediaQueryRegistry.push({ query, listeners, mql: mediaQueryList })
    return mediaQueryList
  }) satisfies Window["matchMedia"]

function matchQuery(query: string, width: number) {
  const maxMatch = query.match(/\(max-width:\s*(\d+)px\)/)
  if (maxMatch) {
    return width <= Number(maxMatch[1])
  }

  const minMatch = query.match(/\(min-width:\s*(\d+)px\)/)
  if (minMatch) {
    return width >= Number(minMatch[1])
  }

  return false
}

const matchMedia = createMatchMedia()

Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: matchMedia,
})

const setViewportWidth = (width: number) => {
  viewportWidth = width

  mediaQueryRegistry.forEach(({ query, mql, listeners }) => {
    const nextMatch = matchQuery(query, viewportWidth)
    if (mql.matches !== nextMatch) {
      ;(mql as { matches: boolean }).matches = nextMatch
      const event = { matches: nextMatch, media: query } as MediaQueryListEvent
      if (typeof mql.onchange === "function") {
        mql.onchange(event)
      }
      for (const listener of listeners) {
        listener(event)
      }
    }
  })

  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  })
  window.dispatchEvent(new Event("resize"))
}

setViewportWidth(viewportWidth)

Object.defineProperty(globalThis, "__setViewportWidth", {
  value: setViewportWidth,
  configurable: true,
  writable: true,
})

Object.defineProperty(window, "ResizeObserver", {
  writable: true,
  value: class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  },
})

vi.mock("next/link", () => ({
  __esModule: true,
  default: ({
    children,
    href,
    ...props
  }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) =>
    React.createElement("a", { ...props, href }, children),
}))

vi.mock("next/navigation", () => {
  const router = {
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
    forward: vi.fn(),
    refresh: vi.fn(),
  }

  return {
    __esModule: true,
    useRouter: () => router,
    usePathname: () => "/",
    useSearchParams: () => new URLSearchParams(),
    notFound: vi.fn(),
    redirect: vi.fn(),
  }
})

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  cleanup()
  mediaQueryRegistry.length = 0
  setViewportWidth(DEFAULT_VIEWPORT_WIDTH)
})
