# Repository Guidelines

## Project Structure & Module Organization
This Next.js 15 app uses the App Router in `app/` where each route folder holds its `page.tsx`, loading states, and server actions. Shared feature widgets live in `components/`, while `ui/` stores shadcn design primitives. `lib/` centralizes Supabase clients, helpers, and domain utilities. Styling tokens stay in `styles/`, and static assets belong in `public/`. When adding features, co-locate hooks and types with the owning route or component.

## Build, Test, and Development Commands
Stick with `pnpm` to stay aligned with the lockfile.
```bash
pnpm dev      # run local dev server with hot reload
pnpm build    # produce optimized production output
pnpm start    # serve the build locally
pnpm lint     # run ESLint + TypeScript checks
```
Re-install dependencies with `pnpm install` whenever `package.json` or the lockfile changes.

## Coding Style & Naming Conventions
The repo relies on the default Next.js lint config; resolve warnings before committing. Use 2-space indentation, TypeScript types for component props, and keep components PascalCase (`AssignmentTable`) while hooks remain camelCase (`useMatchFeed`). Tailwind utilities are preferred for layout; extract patterns into `ui/` atoms when reused. Supabase logic should flow through helpers in `lib/` rather than being called directly from components.

## Testing Guidelines
A dedicated test runner is not yet configured. Add lightweight unit or integration tests next to the code in `__tests__/` folders when you introduce non-trivial logic, and document manual verification steps in the PR. At minimum execute `pnpm lint` before opening or updating a pull request. If you add tooling such as Vitest or Playwright, wire new scripts in `package.json` and update this guide.

## Commit & Pull Request Guidelines
Recent commits use short, descriptive subjects (`fixed google auth cookie issue`). Prefer an imperative summary under 72 characters, optionally adopting Conventional Commit prefixes when it clarifies intent (`feat: add assignment calendar`). Link issues or tickets in the body. Pull requests should explain the change, highlight UI impacts with screenshots, list tests performed, and call out follow-up work.

## Environment & Configuration
Secrets belong in `.env.local`; never commit them. Declare new runtime variables in `next.config.mjs` and document required keys in your PR so reviewers can reproduce the environment.
