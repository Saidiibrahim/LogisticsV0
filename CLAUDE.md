# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CourierRun** is a logistics management platform built with Next.js 15 for managing driver rosters, delivery tracking, and fleet operations. The application uses Supabase for authentication and PostgreSQL database, with real-time features and email notifications.

## Commands

### Package Manager

**IMPORTANT**: This project uses `pnpm` as the package manager (note the `pnpm-lock.yaml` file). Always use `pnpm` commands, not `npm` commands.

### Development

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Ultracite linter (check only)
- `pnpm lint:fix` - Run Ultracite linter and apply fixes
- `pnpm format` - Format and fix code with Ultracite
- `pnpm type-check` - Check for TypeScript type errors
- `pnpm test` - Run tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:coverage` - Generate test coverage reports

## Architecture

### Authentication Flow

- **Middleware**: `middleware.ts` intercepts all requests and calls `lib/supabase/middleware.ts`
- **Session Management**: Middleware automatically redirects unauthenticated users to `/auth/login` (except for `/login` and `/auth/*` routes)
- **Authenticated Layout**: `app/(authenticated)/layout.tsx` performs server-side session validation once per request, using React `cache()` via `getSessionClaims()` to deduplicate fetches within a single render
- **Session Context**: User data is passed from the authenticated layout to `AppChrome`, which provides it to all descendant components via React Context
- **Supabase Clients**:
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for server components/actions
  - `lib/supabase/middleware.ts` - Middleware client with session refresh logic
- **Cookie Encoding**: All Supabase clients use `cookieEncoding: 'raw'` - maintain this setting
- **Fluid Compute Critical**: NEVER store Supabase clients in global variables. Always create new clients within functions to ensure compatibility with Fluid compute environments

### Directory Structure

- `app/` - Next.js App Router pages
  - `app/(authenticated)/` - Protected routes with shared layout
    - `app/(authenticated)/welcome/` - Dashboard/home page
    - `app/(authenticated)/calendar/` - Weekly roster management
    - `app/(authenticated)/chat/` - AI chat interface with widgets
  - `app/auth/*` - Authentication pages (login, sign-up, forgot-password, callback, etc.)
  - `app/api/*` - API routes (e.g., `/api/chat` for AI streaming)
  - `app/globals.css` - Global styles with Tailwind
  - `app/layout.tsx` - Root layout
- `components/` - React components
  - `components/ui/` - shadcn/ui components
  - `components/layout/` - Layout components (sidebar, top bar, navigation)
  - `components/calendar/` - Calendar-specific components
  - Form components: `login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`
- `lib/` - Utility functions and shared logic
  - `lib/supabase/` - Supabase client configurations
    - `lib/supabase/queries/` - Database query functions (drivers, roster)
    - `lib/supabase/session.ts` - Session helper functions
  - `lib/stores/` - Zustand state management stores
  - `lib/types/` - TypeScript type definitions
  - `lib/actions/` - Server actions (e.g., email notifications)
  - `lib/utils.ts` - Utility functions (cn helper, etc.)
- `test/` - Test utilities and setup
- `public/` - Static assets

### Key Patterns

**Supabase Client Usage**:

- Client components: Import from `@/lib/supabase/client` and call `createClient()`
- Server components: Import from `@/lib/supabase/server` and call `await createClient()`
- Always create new clients within functions (never store in global variables) - critical for Fluid compute
- Database queries are organized in `lib/supabase/queries/` as reusable functions that accept a Supabase client

**Import Aliases** (defined in `tsconfig.json`):

- `@/*` - Root directory
- `@/components` - Components directory
- `@/lib` - Lib directory
- `@/ui` or `@/components/ui` - UI components
- `test-utils` - Test utilities

**Authentication Components**:

- Forms use client-side validation with state management
- Support email/password and OAuth providers (Google, Apple)
- After successful auth, redirect to `/welcome` (authenticated home page)
- Use `createClient()` from `@/lib/supabase/client` for auth actions

**State Management**:

- Uses **Zustand** for all state management (not React Context for app state)
- Key stores in `lib/stores/`:
  - `calendar-store.ts` - Calendar view state, events, and filters
  - `chat-store.ts` - Chat UI state, active widgets, layout mode
  - `roster-store.ts` - Roster management state
  - `use-user-store.ts` - User profile and preferences
  - `use-sidebar-store.ts` - Sidebar open/closed state
  - `use-search-store.ts` - Global search dialog state
- All stores export selector functions for optimized component subscriptions
- Stores include `reset()` actions for clearing state
- Dev tools enabled in development for Redux DevTools integration

**Server Actions Pattern**:

- Server actions are co-located with pages in `actions.ts` files (e.g., `app/(authenticated)/calendar/actions.ts`)
- Return type: `ActionState<T>` with `{ success: boolean, error?: string, data?: T }`
- Always validate authentication before performing operations
- Use `"use server"` directive at the top of files

**Database Schema & Multi-tenancy**:

- Uses Row Level Security (RLS) for multi-tenant data isolation
- All data is scoped to `organization_id`
- Key tables:
  - `users` - User profiles with organization reference
  - `organizations` - Tenant data
  - `drivers` - Driver profiles
  - `roster_assignments` - Weekly rosters with JSONB assignments column
- Roster assignments use JSONB for flexible storage of driver-date mappings
- Unique constraint on `(organization_id, week_start_date)` enables upserts

**Email Notifications**:

- Uses **Resend** for transactional emails
- Email actions in `lib/actions/email-actions.ts`
- Email templates are HTML with inline styles
- Roster notifications sent when rosters are published or modified
- Requires `RESEND_API_KEY` environment variable

**AI Chat Features**:

- AI chat powered by OpenAI via Vercel AI SDK
- Streaming responses via `/api/chat` route
- Chat widgets can display contextual information (e.g., calendar, driver performance)
- Widget system uses split-panel layout for side-by-side chat and data
- Requires `OPENAI_API_KEY` environment variable

### Build Configuration

- `next.config.mjs` has experimental `staleTimes` configuration for caching
- Images are unoptimized (`unoptimized: true`)
- Strict TypeScript mode enabled in `tsconfig.json`

### Code Formatting & Linting

- Uses **Ultracite** (built on Biome) for fast code formatting and linting
- Configuration in `biome.jsonc` extends Ultracite presets
- VSCode integration configured in `.vscode/settings.json` with format-on-save enabled
- Automatically formats TypeScript, JavaScript, React, JSON, CSS, and GraphQL files
- Run `pnpm format` to auto-fix formatting and safe linting issues
- ESLint has been removed in favor of Ultracite's faster Rust-based tooling

### Testing

- Uses **Vitest** with React Testing Library
- Test files use `.test.ts` or `.test.tsx` extension
- Global test setup in `test/setup.ts`
- Test utilities in `test/utils/` (aliased as `test-utils`)
- Coverage thresholds: 60% branches, 70% functions/lines/statements
- Run `pnpm test` for interactive mode, `pnpm test:run` for CI

### Environment Variables

Required in `.env.local` (see `.env.example`):

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY` - Supabase anonymous key
- `RESEND_API_KEY` - Email service API key
- `OPENAI_API_KEY` - OpenAI API key for chat features

### UI Components

Uses shadcn/ui with:

- Style: `new-york`
- Base color: `neutral`
- Icon library: `lucide-react`
- CSS variables enabled
- Extensive component library including: accordion, alert-dialog, avatar, button, card, checkbox, dialog, dropdown-menu, form elements, navigation, tabs, toast, and more

### Middleware Critical Notes

From `lib/supabase/middleware.ts`:

1. Always call `supabase.auth.getClaims()` immediately after creating the client
2. Must return the `supabaseResponse` object unmodified
3. If creating a new response, copy cookies using `myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())`
4. Routes `/login` and `/auth/*` are excluded from auth checks
5. Do not run any code between `createServerClient()` and `supabase.auth.getClaims()` - this can cause users to be randomly logged out

## Best Practices

### State Management

- Always use Zustand for client-side state management
- Use selector functions to prevent unnecessary re-renders
- Store instances should be created with `create<T>()` pattern
- Include `reset()` action in all stores

### Code Quality

- Always check for critical linting errors after making significant code changes
- Always run `pnpm type-check` after making significant code changes
- Document code using a mixture of normal comments and JSDocs where appropriate
- Write unit tests for utilities and stores

### Performance

- Leverage React Suspense for streaming server components
- Use React `cache()` for deduplicating server-side fetches
- Minimize client JavaScript by preferring server components
- Use selective Zustand subscriptions to prevent unnecessary re-renders

## Test Credentials

For development and testing:

- Email: `testuser@logisticsv0.com`
- Password: `Password123!`

## ExecPlans

When writing complex features or refactoring, you should create an ExecPlan as described in the .agent/plans/PLANS.md file. This plan should be stored in the `.agent/plans/{feature_name}/` directory and it should be accompanied by a task list in the `.agent/tasks/{feature_name}/` directory. Place any temporary research, clones, etc., in the .gitignored subdirectory of the .agent/ directory.
