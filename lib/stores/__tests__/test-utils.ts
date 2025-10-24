/**
 * Helper that wraps the shared `resetStores` utility in React Testing Library's
 * `act` helper so Zustand updates stay test-safe.
 */
import { act } from "@testing-library/react"

import { resetStores } from "../reset"

/**
 * Reset every store between test cases.
 *
 * Wrapping the call with `act()` ensures React is aware of the synchronous
 * state updates performed by Zustand, preventing warnings in strict mode.
 */
export function resetAllStores() {
  act(() => {
    resetStores()
  })
}
