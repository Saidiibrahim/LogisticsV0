/**
 * @file Persistence middleware tests. Demonstrates the cookie-backed storage
 * contract and the noop fallback used during server rendering.
 */
import { beforeEach, describe, expect, it } from "vitest"
import { createNoopStorage, createRawCookieStorage } from "../persist"

const clearCookies = () => {
  document.cookie
    .split(";")
    .map((cookie) => cookie.trim())
    .filter(Boolean)
    .forEach((cookie) => {
      const [name] = cookie.split("=")
      // biome-ignore lint/suspicious/noDocumentCookie: necessary for test cleanup, Cookie Store API not available in test environment
      document.cookie = `${name}=; Max-Age=0`
    })
}

describe("createRawCookieStorage", () => {
  beforeEach(() => {
    clearCookies()
  })

  it("writes and reads cookies", () => {
    const storage = createRawCookieStorage({ path: "/" })
    const payload = JSON.stringify({ value: 42 })

    storage.setItem("test", payload)

    expect(document.cookie).toContain("test=")
    expect(storage.getItem("test")).toBe(payload)
  })

  it("removes cookies", () => {
    const storage = createRawCookieStorage()
    storage.setItem("session", JSON.stringify({ ok: true }))

    storage.removeItem("session")

    expect(storage.getItem("session")).toBeNull()
    // Removing should also clear document.cookie so future reads miss the key.
    expect(document.cookie.includes("session=")).toBe(false)
  })
})

describe("createNoopStorage", () => {
  // SSR fallback should behave like `localStorage` that is always empty.
  it("returns null for read operations and ignores writes", () => {
    const storage = createNoopStorage()

    expect(storage.getItem()).toBeNull()

    expect(() => {
      storage.setItem()
      storage.removeItem()
    }).not.toThrow()
  })
})
