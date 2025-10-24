/**
 * @file Error helper regression tests. These act as a quick reference for the
 * fallback behavior we expect when surfacing messages to the UI.
 */
import { describe, expect, it } from "vitest"
import { getErrorMessage, isAuthError } from "../errors"

describe("getErrorMessage", () => {
  it("returns message when error is an Error instance", () => {
    const message = getErrorMessage(new Error("boom"))
    expect(message).toBe("boom")
  })

  it("returns string when error is a string", () => {
    expect(getErrorMessage("failure")).toBe("failure")
  })

  it("stringifies objects when possible", () => {
    expect(getErrorMessage({ reason: "nope" })).toBe('{"reason":"nope"}')
  })

  it("falls back to default message when JSON.stringify throws", () => {
    // Circular references capture the edge case that causes JSON.stringify to throw.
    const circular: { self?: unknown } = {}
    circular.self = circular

    const message = getErrorMessage(circular)
    expect(message).toBe("An unexpected error occurred")
  })
})

describe("isAuthError", () => {
  // Keywords cover both thrown Error instances and plain string responses.
  it("detects authentication errors from Error instances", () => {
    expect(isAuthError(new Error("User not authenticated"))).toBe(true)
  })

  it("detects authentication errors from strings", () => {
    expect(isAuthError("Forbidden access")).toBe(true)
  })

  it("returns false when error does not reference auth", () => {
    expect(isAuthError(new Error("Something else"))).toBe(false)
  })
})
