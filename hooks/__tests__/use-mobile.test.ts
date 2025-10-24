/**
 * @file Declarative docs for the viewport-based `useIsMobile` hook.
 * Tests simulate browser resize events via the global helper injected in setup.
 */
import { act, renderHook, waitFor } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"
import { useIsMobile } from "../use-mobile"

declare const __setViewportWidth: (width: number) => void

describe("useIsMobile", () => {
  afterEach(() => {
    act(() => {
      // Reset the virtual viewport so each test starts at the desktop breakpoint.
      __setViewportWidth(1024)
    })
  })

  it("returns false for desktop widths", () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
  })

  it("updates when viewport width crosses breakpoint", async () => {
    const { result } = renderHook(() => useIsMobile())

    act(() => {
      // Drop below the 768px breakpoint to simulate a mobile device.
      __setViewportWidth(600)
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })

    act(() => {
      // Bounce back up to confirm the listener toggles off correctly.
      __setViewportWidth(900)
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })
})
