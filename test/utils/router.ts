import { type Mock, vi } from "vitest"

export interface RouterMock {
  push: Mock
  replace: Mock
  prefetch: Mock
  back: Mock
  forward: Mock
  refresh: Mock
}

export const createRouterMock = (
  overrides: Partial<RouterMock> = {}
): RouterMock => ({
  push: vi.fn(),
  replace: vi.fn(),
  prefetch: vi.fn(),
  back: vi.fn(),
  forward: vi.fn(),
  refresh: vi.fn(),
  ...overrides,
})
