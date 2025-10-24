/**
 * @file Behavioral tests for the `cn` class name merger.
 * The suite documents how conflicting tailwind-ish class names are resolved
 * and ensures future refactors keep the utility's ergonomics intact.
 */
import { describe, expect, it } from "vitest"
import { cn } from "./utils"

describe("cn utility", () => {
  /**
   * The base contract: when two class names target the same CSS property,
   * the later one wins, mimicking Tailwind's merge behavior.
   */
  it("should merge class names correctly", () => {
    const result = cn("text-red-500", "text-blue-500")
    expect(result).toBe("text-blue-500")
  })

  // Optional classes resolve to simple strings when falsy values appear inline.
  it("should handle conditional classes", () => {
    const result = cn("base-class", false && "hidden", "visible-class")
    expect(result).toBe("base-class visible-class")
  })

  /**
   * Regression: spacing utilities should not be duplicated, and the latest
   * padding value should override earlier declarations.
   */
  it("should merge tailwind classes properly", () => {
    const result = cn("px-2 py-1", "px-4")
    expect(result).toBe("py-1 px-4")
  })
})
