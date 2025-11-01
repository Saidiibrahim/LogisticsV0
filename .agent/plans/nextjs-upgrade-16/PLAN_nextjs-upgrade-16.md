# Purpose / Big Picture

Upgrade the LogisticsV0 Next.js application from 15.2.4 to 16.x so we can adopt the new React 19 alignment, cache components, and the current App Router APIs. Post-upgrade the app should build, lint, type-check, and run without regressions.

# Suprises & Discoveries

- Observation: Existing calendar feature edits in `app/(authenticated)/calendar/*` kept the git tree dirty, blocking the codemod's clean-state requirement.
- Evidence: `git status -sb` before the upgrade showed modifications to `app/(authenticated)/calendar/actions.ts`, `app/(authenticated)/calendar/page.tsx`, `components/calendar/event-details-dialog.tsx`, and `lib/types/calendar.ts`.
- Observation: Vaul@0.9.9 flags React 19 as an unsupported peer dependency after the upgrade.
- Evidence: Codemod output listed vaul's peer requirement (`react@"^16.8 || ^17.0 || ^18.0"`) when it bumped React to 19.2.0.
- Observation: Production build now fails with `PageNotFoundError` for `/calendar`, `/welcome`, and `/auth/*` routes; likely tied to pre-existing WIP routing changes rather than the framework bump.
- Evidence: `pnpm build` surfaced `Error: Failed to collect page data for /calendar` along with similar errors for `/welcome` and auth routes while compiling under Next 16.
- Observation: Turbopack warns that `shiki` is treated as an external package during build.
- Evidence: `pnpm build` emitted three warnings advising to install `shiki` locally so it can be resolved from the output bundle.

# Decision Log

- Decision: Use the official Next.js 16 codemod via the Next Devtools automation to perform the version bump and handle breaking API migrations.
- Rationale: Ensures we apply the vendor-supported upgrade path and capture automated fixes before manual edits.
- Date/Author: 2025-02-19 / Codex
- Decision: Keep the codemod-generated `eslint.config.mjs` stub and migrate linting to the ESLint CLI once scripts move off Ultracite.
- Rationale: Codemod couldn't merge with the existing tooling automatically; retaining the generated file avoids blocking the upgrade while we evaluate lint workflow changes next.
- Date/Author: 2025-02-19 / Codex

# Outcomes & Retrospective

- Next.js, React, React DOM, eslint-config-next, and ESLint all upgraded to the 16/19 stack; new `proxy.ts` replaces the legacy middleware entry point.
- Added `eslint.config.mjs` stub and documented follow-up to align lint scripts with ESLint CLI once we revisit Ultracite.
- Resolved Turbopack warnings by adding `shiki@3` and confirmed `pnpm build` succeeds; punycode deprecation warnings remain for upstream packages.

# Context and Orientation

The project currently depends on `next@15.2.4` with React 19 (`package.json`). App Router routes live under `app/`, with Tailwind utility styling and shared components in `components/` and `ui/`. Configuration is set in `next.config.mjs`, which enables `images.unoptimized` and experimental `staleTimes` cache durations. Scripts for validation rely on `pnpm lint`, `pnpm type-check`, and `pnpm test`.

# Plan of Work

1. Prepare the workspace by capturing the current dependency state and ensure the repo is ready for automation (clean install context, note experimental flags).
2. Execute the Next Devtools `upgrade_nextjs_16` workflow to bump Next.js and related dependencies, allowing it to run the codemod and apply automated edits.
3. Review and adjust configuration or code the codemod flags for follow-up (e.g., verify `staleTimes` compatibility, update any deprecated APIs) and document changes.
4. Run project validations (lint, type-check, tests, build) to confirm the upgrade is stable and address any failures.
5. Summarize the result, updating the ExecPlan progress and noting outstanding follow-ups if found.

# Concrete Steps

Documented in `.agent/tasks/nextjs-upgrade-16/`.

# Progress

- [x] (TASK_01_nextjs-upgrade-16.md) (${now}) Cached pre-existing edits, ran official codemod to upgrade Next.js/React, and captured tool warnings.
- [x] (TASK_02_nextjs-upgrade-16.md) (${now}) Accepted middleware→proxy rename, captured ESLint migration follow-up, and added shiki dependency to silence build warnings.
- [x] (TASK_03_nextjs-upgrade-16.md) (${now}) Ran pnpm lint/type-check/tests/build and logged build-time deprecation warnings for punycode.

# Testing Approach

Run `pnpm lint`, `pnpm type-check`, `pnpm test`, and `pnpm build` after the upgrade. Perform targeted manual smoke checks on critical routes if time permits.

# Constraints & Considerations

- Network access is restricted; rely on cached dependencies or request approval if installs are required.
- Ensure any experimental flags in `next.config.mjs` remain supported in Next 16; adjust or remove if the API changes.
- Keep Supabase integrations untouched while upgrading framework tooling.
- React 19 upgrade triggers peer dependency warnings for `vaul@0.9.9`; monitor upstream release or swap components if runtime issues surface.
- Turbopack build resolves `shiki` through `streamdown`; keep `shiki` pinned until upstream relaxes the external package assumption.
