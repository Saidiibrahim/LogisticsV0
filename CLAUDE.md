# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 15 application with Supabase authentication, built using v0.app. Uses React 19, TypeScript, Tailwind CSS 4, and shadcn/ui components.

## Commands

### Package Manager
**IMPORTANT**: This project uses `pnpm` as the package manager (note the `pnpm-lock.yaml` file). Always use `pnpm` commands, not `npm` commands.

### Development
- `pnpm run dev` - Start development server
- `pnpm run build` - Build for production
- `pnpm run start` - Start production server
- `pnpm run lint` - Run Ultracite linter (check only)
- `pnpm run lint:fix` - Run Ultracite linter and apply fixes
- `pnpm run format` - Format and fix code with Ultracite
- `pnpm run type-check` - Check for TypeScript type errors

## Architecture

### Authentication Flow
- **Middleware**: `middleware.ts` intercepts all requests and calls `lib/supabase/middleware.ts`
- **Session Management**: Middleware automatically redirects unauthenticated users to `/auth/login` (except for `/login` and `/auth/*` routes)
- **Supabase Clients**:
  - `lib/supabase/client.ts` - Browser client for client components
  - `lib/supabase/server.ts` - Server client for server components/actions
  - `lib/supabase/middleware.ts` - Middleware client with session refresh logic
- **Cookie Encoding**: All Supabase clients use `cookieEncoding: 'raw'` - maintain this setting

### Directory Structure
- `app/` - Next.js App Router pages
  - `app/auth/*` - Authentication pages (login, sign-up, forgot-password, callback, etc.)
  - `app/protected/` - Protected/authenticated routes
  - `app/globals.css` - Global styles with Tailwind
  - `app/layout.tsx` - Root layout
- `components/` - React components
  - `components/ui/` - shadcn/ui components
  - Form components: `login-form.tsx`, `sign-up-form.tsx`, `forgot-password-form.tsx`, `update-password-form.tsx`
- `lib/` - Utility functions and shared logic
  - `lib/supabase/` - Supabase client configurations
  - `lib/utils.ts` - Utility functions (cn helper, etc.)
- `public/` - Static assets
- `styles/` - Additional stylesheets

### Key Patterns

**Supabase Client Usage**:
- Client components: Import from `@/lib/supabase/client` and call `createClient()`
- Server components: Import from `@/lib/supabase/server` and call `await createClient()`
- Always create new clients within functions (never store in global variables) - critical for Fluid compute

**Import Aliases** (defined in `tsconfig.json` and `components.json`):
- `@/*` - Root directory
- `@/components` - Components directory
- `@/lib` - Lib directory
- `@/ui` or `@/components/ui` - UI components

**Authentication Components**:
- Forms use client-side validation with state management
- Support email/password and OAuth providers (Google, Apple)
- After successful auth, redirect to `/protected`
- Use `createClient()` from `@/lib/supabase/client` for auth actions

### Build Configuration
- `next.config.mjs` disables ESLint and TypeScript errors during builds (`ignoreDuringBuilds: true`)
- Images are unoptimized (`unoptimized: true`)
- Strict TypeScript mode enabled in `tsconfig.json`

### Code Formatting & Linting
- Uses **Ultracite** (built on Biome) for fast code formatting and linting
- Configuration in `biome.jsonc` extends Ultracite presets
- VSCode integration configured in `.vscode/settings.json` with format-on-save enabled
- Automatically formats TypeScript, JavaScript, React, JSON, CSS, and GraphQL files
- Run `npm run format` to auto-fix formatting and safe linting issues
- ESLint has been removed in favor of Ultracite's faster Rust-based tooling

### Environment Variables
Required in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY`

### UI Components
Uses shadcn/ui with:
- Style: `new-york`
- Base color: `neutral`
- Icon library: `lucide-react`
- CSS variables enabled
- Component library includes: accordion, alert-dialog, avatar, button, card, checkbox, dialog, dropdown-menu, form elements, navigation, tabs, toast, and more

### Middleware Critical Notes
From `lib/supabase/middleware.ts`:
1. Always call `supabase.auth.getClaims()` immediately after creating the client
2. Must return the `supabaseResponse` object unmodified
3. If creating a new response, copy cookies using `myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())`
4. Routes `/login` and `/auth/*` are excluded from auth checks

## Best Practices

### State Management

- Prefer Zustand for state management over React Context

### Code Quality

- Always check for critical linting errors after making significant code changes. Non-critical errors can be ignored (style preferences and minor accessibility enhancements)
- Always run `npm run type-check` after making significant code changes to ensure type safety
- Always document your code. Use a mixture of normal comments and JSDocs where appropriate