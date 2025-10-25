# Repository Guidelines

## Project Structure & Module Organization

- `app/` holds App Router segments with their `page.tsx`, loading states, server actions, and any route-scoped hooks or types.
- Reuse shared widgets from `components/`, primitives from `ui/`, and Tailwind tokens in `styles/` before adding new variants.
- Keep Supabase clients and domain helpers in `lib/`; cross-cutting code lives in `hooks/`, `types/`, long-form docs in `docs/`, and shared tests in `test/`.

## Build, Test, and Development Commands

- `pnpm dev` runs the hot reload server; pair `pnpm build` and `pnpm start` to sanity-check the production bundle pre-merge.
- `pnpm lint`, `pnpm type-check`, and `pnpm format` wrap Ultracite and TypeScript—iterate until the output is clean.
- `pnpm test` (watch or run) covers day-to-day feedback, while `pnpm test:coverage` guards release branches.

## Coding Style & Naming Conventions

- Stick to TypeScript with 2-space indentation and typed component props or helper signatures.
- Components use PascalCase (`AssignmentTable`), hooks use camelCase (`useInventoryFeed`), and shared constants use `SCREAMING_SNAKE_CASE`.
- Favor Tailwind utilities, extracting repeated patterns into `ui/` atoms or `components/` widgets; touch Supabase only via `lib/`.

## Testing Guidelines

- Vitest plus Testing Library powers unit and integration suites; store `<name>.test.ts(x)` beside the code or in `test/` for shared flows.
- Mock Supabase and network dependencies locally—CI should stay offline-safe.
- Run `pnpm lint` and `pnpm test` before every push; layer `pnpm test:coverage` when touching riskier paths.

## Commit & Pull Request Guidelines

- Write short, imperative commit subjects under 72 characters; add Conventional prefixes (`feat:`, `fix:`) when they clarify intent.
- Reference tickets in bodies and group related edits into logical commits to ease review.
- PRs should summarize the change, link issues, attach UI screenshots for visual updates, list executed commands, and flag follow-up or env notes.

## Security & Configuration Tips

- Never commit secrets—use `.env.local` and document new keys in the PR description.
- Update `next.config.mjs` when adding runtime config and mention schema or storage migrations in `docs/`; Supabase access should stay funneled through `lib/`.

## ExecPlans

When writing complex features or refactoring, you should create an ExecPlan as described in the .agent/plans/PLANS.md file. This plan should be stored in the `.agent/plans/{feature_name}/` directory and it should be accompanied by a task list in the `.agent/tasks/{feature_name}/` directory. Place any temporary research, clones, etc., in the .gitignored subdirectory of the .agent/ directory.
