# Testing Guide

This project uses [Vitest](https://vitest.dev/) for unit tests with a JSDOM environment that mirrors the Next.js runtime. The shared configuration lives in `vitest.config.ts` and a global setup file (`test/setup.ts`) provides DOM shims, Next.js router mocks, and store cleanup helpers.

## Commands

- `pnpm test` &mdash; run Vitest in interactive mode.
- `pnpm test:watch` &mdash; start a focused TDD loop that reruns impacted suites.
- `pnpm test:run` &mdash; execute the full suite once (useful for CI).
- `pnpm test:coverage` &mdash; produce coverage reports (text, JSON, HTML). Minimum branch/function/line thresholds are enforced in config.

Always run `pnpm lint` in addition to tests before opening or updating a pull request.

## Writing Tests

- Co-locate unit tests next to the code under test using `*.test.ts(x)` files or `__tests__` folders.
- Use the helpers in `test/utils/`:
  - `renderWithProviders` renders components inside the shared theme provider.
  - `createSupabaseClientMock` returns a chainable mock client for server actions.
  - `createRouterMock` and factory helpers generate deterministic data fixtures.
- Call `resetStores()` (or `resetAllStores` from `lib/stores/__tests__/test-utils`) in `afterEach` blocks when a test mutates Zustand stores.
- To emulate viewport changes in hook tests call the global `__setViewportWidth(width)` helper defined in `test/setup.ts`.

## Suggested TDD Loop

1. Create or update a failing test that captures the next behaviour.
2. Implement the minimal code to make the test pass.
3. Refactor for clarity while keeping the suite green.
4. Run `pnpm test:coverage` before shipping when logic changes are significant.

Document any manual verification you performed (e.g., smoke testing UI) in your PR description alongside the automated checks.
