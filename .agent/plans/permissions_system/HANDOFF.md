# Permission System Implementation - Developer Handoff

**Project:** CourierRun Logistics Management Platform
**Feature:** Application-Level Role-Based Access Control (RBAC)
**Priority:** CRITICAL
**Estimated Duration:** 2-3 days
**Date:** October 27, 2025

---

## Executive Summary

This handoff provides everything you need to implement a role-based permission system for CourierRun. The **database security is already solid** with RLS (Row Level Security) policies in place. Your job is to improve the **application layer UX** by hiding unauthorized features and providing clear error messages.

**Current Problem:**
- Drivers see "Create Event" and "Publish Roster" buttons
- When they click these buttons, they get generic database errors
- No way to know what their role is or what they can do

**Your Solution:**
- Hide features users don't have permission to use
- Show user's role in UI (badge in profile menu)
- Return helpful error messages from server actions
- Provide `<CanAccess>` component for permission-based rendering

**End Result:**
- Drivers only see features they can use
- Drivers can still update the status of events assigned to them
- Team leaders have full access to scheduling/rosters
- Clear, role-based error messages
- Better UX overall

---

## 📚 Essential Reading

**Before you start, read these documents in order:**

1. **ExecPlan:** `.agent/plans/permissions_system/PLAN_permissions_system.md`
   - Complete implementation plan with context
   - Read "Context and Orientation" section first
   - Review "Plan of Work" for step-by-step guidance

2. **Task Files:** `.agent/tasks/permissions_system/TASK_01_*.md` through `TASK_09_*.md`
   - Each task is a discrete unit of work
   - Contains code snippets and acceptance criteria
   - Follow tasks sequentially (01 → 09)

3. **Project Docs:** `CLAUDE.md` in project root
   - Project architecture and patterns
   - Authentication flow (critical for understanding session context)
   - State management (Zustand)
   - Database schema notes

---

## 🔍 What We Discovered (Save You Time)

### Database Layer - Already Done ✅

During analysis, we discovered the database is **already secure**:

**RLS Policies Exist:**
```sql
-- Example: calendar_events table
"Team leaders full access to calendar events"
  - Allows: team-leader role to SELECT, INSERT, UPDATE, DELETE

"Drivers read calendar events"
  - Allows: driver role to SELECT only

"Customer support read calendar events"
  - Allows: customer-support role to SELECT only
```

**Helper Functions Exist:**
- `user_has_role(text[])` - Check if current user has one of the roles
- `get_user_organization_id()` - Get user's organization (multi-tenant)
- `user_can_access_organization(uuid)` - Check org access

**Verified via Supabase MCP:**
```bash
# We ran this query to verify:
SELECT schemaname, tablename, policyname, roles, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename;
```

### User Roles - Already Defined ✅

**Five roles in the system** (from `users.role` column constraint):
1. `driver` - Can view events/rosters, update own delivery status
2. `team-leader` - Full access to scheduling, rosters, routes
3. `customer-support` - Read-only access for customer inquiries
4. `retail-officer` - Can manage orders and sites
5. `admin` - Full system access

**Test Users Available:**
```
driver@example.com - Password: Password123!
team-leader@example.com - Password: Password123!
customer-support@example.com - Password: Password123!
```

### What's Missing - Your Job ❌

**Application Layer has no permission checks:**

1. **UI Shows Everything:**
   - `components/calendar/event-details-dialog.tsx` - Shows edit/delete to all users
   - `app/(authenticated)/calendar/_components/create-event-dialog.tsx` - Everyone sees create button
   - `components/calendar/weekly-roster-dialog.tsx` - Drivers can see publish button

2. **Server Actions Return Generic Errors:**
   - `app/(authenticated)/calendar/actions.ts` - No permission checks
   - `app/(authenticated)/calendar/roster-actions.ts` - No permission checks
   - When RLS blocks operation: "Failed to update event" (not helpful)

3. **No Role Visibility:**
   - Users don't know what role they have
   - No way to see why features are unavailable

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (4-6 hours)

**TASK_01:** Create Permission Utilities
```typescript
// You'll create: lib/auth/permissions.ts
export type UserRole = 'driver' | 'team-leader' | 'customer-support' | 'retail-officer' | 'admin'
export type Permission = 'events.create' | 'events.edit.any' | ...

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  driver: ['events.view', 'rosters.view', ...],
  'team-leader': ['events.create', 'events.edit.any', 'rosters.publish', ...],
  // ...
}

export function hasPermission(role: UserRole, permission: Permission): boolean
export function formatRole(role: UserRole): string
export function requirePermission(role: UserRole | null | undefined, permission: Permission): { allowed: boolean; error?: string }
```

**TASK_02:** Add Role to Session Context
```typescript
// Update: lib/supabase/session.ts
export interface SessionClaims {
  userId: string
  role: UserRole  // ADD THIS
  // ...
}

// Update: components/layout/app-chrome.tsx
export interface UserContextValue {
  role: UserRole  // ADD THIS
  hasPermission: (permission: Permission) => boolean  // ADD THIS
}
```

**Key Files to Modify:**
- `lib/supabase/session.ts` - Add role to SessionClaims
- `components/layout/app-chrome.tsx` - Add hasPermission to context
- `app/(authenticated)/layout.tsx` - Verify it compiles (should work automatically)

**Why This Works:**
- Session is cached via React `cache()` - no extra DB queries
- Role fetched once per request when session loads
- `hasPermission()` is pure function (in-memory lookup)

### Phase 2: Server Actions (3-4 hours)

**TASK_03 & TASK_04:** Add Permission Guards

```typescript
// Pattern for all server actions:
export async function createCalendarEvent(...) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return { error: 'Not authenticated' }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  const permissionCheck = requirePermission(profile.role, 'events.create')
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  // ... rest of function
}
```

**Files to Update:**
- `app/(authenticated)/calendar/actions.ts` - 4 functions
  - Introduce a shared `getUserProfile()` helper that returns `{ organizationId, role }`
  - createCalendarEvent → require 'events.create'
  - updateCalendarEvent → require 'events.edit.any'
  - updateEventStatus → allow 'events.status.update.any'; otherwise allow 'events.status.update.own' only when the user is the assigned driver
  - deleteEvent → require 'events.delete'

- `app/(authenticated)/calendar/roster-actions.ts` - 1 function
  - Reuse `getUserProfile()`
  - saveRoster → require 'rosters.publish' or 'rosters.edit' (based on status)

**Error Message Format:**
```
"Your role (Driver) doesn't have permission to perform this action"
```

### Phase 3: UI Components (2-3 hours)

**TASK_05:** Create Permission Components

```typescript
// You'll create: components/auth/can-access.tsx
export function CanAccess({ permission, children, fallback }) {
  const { hasPermission } = useUser()
  return hasPermission(permission) ? children : fallback
}

// You'll create: components/auth/require-role.tsx
export function RequireRole({ roles, children, fallback }) {
  const { role } = useUser()
  return (Array.isArray(roles) ? roles : [roles]).includes(role) ? children : fallback
}
```

**Pattern for Using:**
```tsx
<CanAccess permission="events.create">
  <Button>Create Event</Button>
</CanAccess>

// With fallback (optional):
<CanAccess
  permission="events.delete"
  fallback={<p className="text-muted-foreground text-sm">Only team leaders can delete events</p>}
>
  <Button variant="destructive">Delete</Button>
</CanAccess>
```

### Phase 4: UI Updates (4-5 hours)

**TASK_06:** Update Event Management UI

Files to modify:
- `components/calendar/event-details-dialog.tsx`
  - Wrap edit button: `<CanAccess permission="events.edit.any">`
  - Wrap delete button: `<CanAccess permission="events.delete">`
  - Compute `showStatusControls` using `hasPermission('events.status.update.any')` **or** (`hasPermission('events.status.update.own') && event.assigned_driver_id === userId`)

- Find where create event dialog is triggered (likely in calendar page)
  - Wrap trigger: `<CanAccess permission="events.create">`

**TASK_07:** Update Roster Management UI

File to modify:
- `components/calendar/weekly-roster-dialog.tsx`
  - Add view-only mode detection: `const isViewOnly = !hasPermission('rosters.edit')`
  - Show "View Only" badge when read-only
  - Disable editing in view-only mode
  - Wrap publish button: `<CanAccess permission="rosters.publish">`
  - Wrap save draft button: `<CanAccess permission="rosters.edit">`

**TASK_08:** Polish & Role Badge

- Find user menu component (check `components/layout/` directory)
- Add role badge to dropdown:
  ```tsx
  import { formatRole } from '@/lib/auth/permissions'

  <Badge variant="secondary" className="mt-2 w-fit text-xs">
    {formatRole(role)}
  </Badge>
  ```

### Phase 5: Testing (4-6 hours)

**TASK_09:** Comprehensive Testing

**Unit Tests:**
```bash
# Create these test files:
lib/auth/__tests__/permissions.test.ts
components/auth/__tests__/can-access.test.tsx

# Run tests:
pnpm test
```

**Manual Testing Matrix:**

| Role | Create Event | Edit Event | Delete Event | Publish Roster | View Roster |
|------|--------------|------------|--------------|----------------|-------------|
| Driver | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ View Only |
| Team Leader | ✅ Works | ✅ Works | ✅ Works | ✅ Works | ✅ Full Edit |
| Customer Support | ❌ Hidden | ❌ Hidden | ❌ Hidden | ❌ Hidden | ✅ View Only |
| Admin | ✅ Works | ✅ Works | ✅ Works | ✅ Works | ✅ Full Edit |

---

## 🚨 Critical Gotchas & Important Notes

### 1. Session Caching is Critical

```typescript
// This is already set up in lib/supabase/session.ts:
export const getSessionClaims = cache(async () => {
  // React cache() ensures this only runs once per request
  // DO NOT remove cache() wrapper!
})
```

**Why it matters:**
- Without `cache()`, you'd query the database every time a component checks permissions
- With `cache()`, session is fetched once per server request
- This is a React Server Components pattern

### 2. Fluid Compute Constraint

From CLAUDE.md:
> **Fluid Compute Critical**: NEVER store Supabase clients in global variables. Always create new clients within functions.

**Good:**
```typescript
export async function createCalendarEvent(...) {
  const supabase = await createClient()
  const profile = await getUserProfile(supabase, user.id)
  const check = requirePermission(profile.role, 'events.create')
}
```

**Bad:**
```typescript
const supabase = createClient() // DON'T DO THIS AT MODULE LEVEL
```

### 3. Client vs Server Components

**Server Components (async functions):**
- Fetch the profile once, then call the synchronous `requirePermission(profile.role, ...)`
- Examples: `app/(authenticated)/calendar/actions.ts`, `app/(authenticated)/calendar/roster-actions.ts`

**Client Components ('use client'):**
- Use `hasPermission()` from context for simple checks
- Combine `hasPermission('events.status.update.own')` with local data when you need ownership logic

**How to tell:**
```typescript
// Server action
export async function createEvent(...) {
  const profile = await getUserProfile(supabase, user.id)
  const check = requirePermission(profile.role, 'events.create')
  if (!check.allowed) return { error: check.error }
}

// Client component
'use client'
export function MyComponent({ event }) {
  const { hasPermission, userId } = useUser()
  const canUpdate = hasPermission('events.status.update.any') ||
    (hasPermission('events.status.update.own') && event.assigned_driver_id === userId)
  if (canUpdate) { ... }
}
```

### 4. RLS Policies Are The Real Security

**Important:** Your UI permission checks are **UX only**, not security.

```
UI Layer (Your Code)        → Hides buttons, shows helpful errors
Application Layer (Actions) → Returns clear error messages
Database Layer (RLS)        → ACTUAL SECURITY BOUNDARY
```

**Why this matters:**
- Someone could bypass UI and call server actions directly
- Server actions have permission checks → helpful error
- But RLS policies are the final enforcement → blocks malicious requests

**Example Attack:**
```bash
# Attacker bypasses UI and calls API directly:
POST /api/calendar/create-event
Authorization: Bearer driver_token

# Your server action returns:
{ "error": "Your role (Driver) doesn't have permission to perform this action" }

# Even if they bypass that, RLS policy blocks at database:
ERROR: new row violates row-level security policy
```

### 5. Permission Denied vs Not Authenticated

```typescript
// Not authenticated - user not logged in
if (!user) {
  return { error: 'You must be logged in to perform this action' }
}

// Permission denied - user logged in but lacks permission
const profile = await getUserProfile(supabase, user.id)
const check = requirePermission(profile?.role, 'events.create')
if (!check.allowed) {
  return { error: check.error } // "Your role (Driver) doesn't have permission..."
}
```

**Why distinguish:**
- Not authenticated → redirect to login
- Permission denied → show error message, explain role limitations

### 6. Role Changes Require Re-login

```typescript
// Current design:
// - Role is fetched when session is created
// - Cached for the duration of the session
// - If admin changes user's role in database, user must sign out and back in

// Future enhancement (not in this plan):
// - Add role change notification
// - Invalidate session on role change
// - Force re-authentication
```

**For this implementation:**
- Document this limitation in code comments
- Add TODO for future enhancement
- It's acceptable for MVP

### 7. Admin Role Not in All RLS Policies

During analysis, we found 'admin' role exists but isn't in all RLS policies:

```sql
-- Some policies have this:
WHERE user_has_role(ARRAY['team-leader'::text])

-- But should have:
WHERE user_has_role(ARRAY['team-leader'::text, 'admin'::text])
```

**For this task:**
- Focus on application layer first
- Document this as Phase 2 improvement (see plan)
- Don't block on fixing RLS policies

---

## 🛠 Development Environment Setup

### Prerequisites

```bash
# Verify you have:
node --version  # Should be 18+
pnpm --version  # Should be 8+

# Install dependencies:
pnpm install
```

### Environment Variables

Already set up in `.env.local`:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_key
```

### Test Users

**Login credentials (all use same password: `Password123!`):**
```
driver@example.com           → Role: driver
team-leader@example.com      → Role: team-leader
customer-support@example.com → Role: customer-support
```

**Quick test command:**
```bash
# Start dev server:
pnpm dev

# Open http://localhost:3000
# Login as driver@example.com
# You should currently see ALL buttons (that's the bug we're fixing)
```

### Running Tests

```bash
# Run all tests:
pnpm test

# Run tests in watch mode (recommended during development):
pnpm test:watch

# Check coverage:
pnpm test:coverage

# Type checking:
pnpm type-check

# Linting:
pnpm lint
```

---

## 📝 Code Patterns & Best Practices

### Pattern 1: Server Action Permission Check

```typescript
// File: app/(authenticated)/calendar/actions.ts

import { requirePermission } from '@/lib/auth/permissions'
import { createClient } from '@/lib/supabase/server'
// getUserProfile is a local helper that returns { organizationId, role }

export async function myServerAction(params) {
  const supabase = await createClient()

  // 1. Check authentication
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { error: 'You must be logged in to perform this action' }
  }

  // 2. Fetch profile once (role + organization)
  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  // 3. Check permission (ADD THIS)
  const permissionCheck = requirePermission(profile.role, 'events.create')
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  // 4. Perform operation (existing code)
  const { error } = await supabase.from('calendar_events').insert({ ... })

  if (error) {
    return { error: 'Failed to create event' }
  }

  return { success: true }
}
```

### Pattern 2: Client Component Permission Check

```typescript
// File: components/calendar/my-component.tsx

'use client'

import { CanAccess } from '@/components/auth'
import { useUser } from '@/components/layout/app-chrome'

export function MyComponent() {
  const { role, hasPermission } = useUser()

  // Option 1: Conditional rendering with hasPermission
  return (
    <div>
      {hasPermission('events.create') && (
        <Button>Create Event</Button>
      )}

      {/* Option 2: Using CanAccess component (cleaner) */}
      <CanAccess permission="events.create">
        <Button>Create Event</Button>
      </CanAccess>

      {/* Option 3: With fallback */}
      <CanAccess
        permission="events.delete"
        fallback={<p className="text-sm text-muted-foreground">Team leaders only</p>}
      >
        <Button variant="destructive">Delete</Button>
      </CanAccess>
    </div>
  )
}
```

### Pattern 3: View-Only Mode

```typescript
// File: components/calendar/roster-dialog.tsx

'use client'

import { useUser } from '@/components/layout/app-chrome'

export function RosterDialog() {
  const { hasPermission } = useUser()

  const isViewOnly = !hasPermission('rosters.edit')

  return (
    <Dialog>
      <DialogHeader>
        <DialogTitle>
          Weekly Roster
          {isViewOnly && (
            <Badge variant="secondary">View Only</Badge>
          )}
        </DialogTitle>
      </DialogHeader>

      {/* Disable interactions in view-only mode */}
      <div className={isViewOnly ? 'pointer-events-none opacity-60' : ''}>
        {/* Roster content */}
      </div>

      <DialogFooter>
        {!isViewOnly && (
          <Button onClick={handleSave}>Save</Button>
        )}

        {isViewOnly && (
          <p className="text-sm text-muted-foreground">
            Contact your team leader to make changes
          </p>
        )}
      </DialogFooter>
    </Dialog>
  )
}
```

### Pattern 4: Role Badge Display

```typescript
// File: components/layout/user-menu.tsx (or similar)

'use client'

import { useUser } from '@/components/layout/app-chrome'
import { formatRole } from '@/lib/auth/permissions'
import { Badge } from '@/components/ui/badge'

export function UserMenu() {
  const { fullName, email, role } = useUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost">
          <Avatar>
            <AvatarFallback>{fullName?.[0]}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col gap-1">
            <p className="text-sm font-medium">{fullName}</p>
            <p className="text-xs text-muted-foreground">{email}</p>

            {/* ADD THIS */}
            <Badge variant="secondary" className="mt-1 w-fit text-xs">
              {formatRole(role)}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />
        <DropdownMenuItem>Settings</DropdownMenuItem>
        <DropdownMenuItem>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

## 🧪 Testing Strategy

### Unit Tests (TASK_09)

**Test File:** `lib/auth/__tests__/permissions.test.ts`

```typescript
import { describe, expect, it } from 'vitest'
import { hasPermission } from '../permissions'

describe('hasPermission', () => {
  it('should grant drivers view permissions', () => {
    expect(hasPermission('driver', 'events.view')).toBe(true)
  })

  it('should deny drivers create permissions', () => {
    expect(hasPermission('driver', 'events.create')).toBe(false)
  })

  // ... more tests
})
```

**Run:**
```bash
pnpm test permissions.test.ts
```

### Component Tests

**Test File:** `components/auth/__tests__/can-access.test.tsx`

```typescript
import { render, screen } from '@testing-library/react'
import { CanAccess } from '../can-access'
import * as AppChrome from '@/components/layout/app-chrome'

vi.mock('@/components/layout/app-chrome')

it('should render children when permission granted', () => {
  vi.mocked(AppChrome.useUser).mockReturnValue({
    hasPermission: () => true,
  } as any)

  render(
    <CanAccess permission="events.create">
      <button>Create</button>
    </CanAccess>
  )

  expect(screen.getByText('Create')).toBeInTheDocument()
})
```

### Manual Testing Checklist

**Before marking task complete, test as each role:**

1. **Driver** (`driver@example.com`):
   - [ ] Cannot see create event button
   - [ ] Cannot see edit/delete buttons in event dialog
   - [ ] Can view events (read-only)
   - [ ] Can update status only on events assigned to them
   - [ ] Can view rosters (view-only mode)
   - [ ] See role badge: "Driver"

2. **Team Leader** (`team-leader@example.com`):
   - [ ] Can create events
   - [ ] Can edit events
   - [ ] Can delete events
   - [ ] Can update status on any event
   - [ ] Can publish rosters
   - [ ] Can save roster drafts
   - [ ] See role badge: "Team Leader"

3. **Customer Support** (`customer-support@example.com`):
   - [ ] Can view events (read-only)
   - [ ] Can view rosters (read-only)
   - [ ] Cannot create/edit/delete
   - [ ] See role badge: "Customer Support"

### Testing Error Messages

**Test permission denied errors:**

1. Use browser DevTools Network tab
2. Login as driver
3. Attempt to create event via form
4. Check response body for error message
5. Should see: `"Your role (Driver) doesn't have permission to perform this action"`
6. Attempt to update the status of an event that is not assigned to the driver → expect `"You can only update the status for events assigned to you."`

**NOT acceptable:**
- "Permission denied"
- "Database error"
- "Policy violation"

---

## 🐛 Debugging Tips

### Issue: Role is undefined/null

```typescript
// Check 1: Is getSessionClaims fetching role?
// Add temporary logging in lib/supabase/session.ts:

export const getSessionClaims = cache(async () => {
  // ... existing code ...
  console.log('Session claims:', { userId, role, organizationId }) // ADD THIS
  return { userId, email, fullName, organizationId, role }
})
```

### Issue: hasPermission always returns false

```typescript
// Check 1: Is role being passed to context?
// Add logging in components/layout/app-chrome.tsx:

console.log('AppChrome session:', session) // Should include role

// Check 2: Is ROLE_PERMISSIONS mapping correct?
// In lib/auth/permissions.ts:

console.log('Checking permission:', { role, permission, result: hasPermission(role, permission) })
```

### Issue: Permission check passes but RLS blocks

**This is expected!** Remember:
- Your permission checks improve UX
- RLS policies are the security boundary
- If RLS blocks but permission check passes, the permission mapping might be wrong

**Fix:**
```typescript
// Update ROLE_PERMISSIONS in lib/auth/permissions.ts
// Make sure it matches what RLS policies allow
```

### Issue: Session cache not working

```typescript
// Verify React cache() is imported:
import { cache } from 'react'

// Verify getSessionClaims is exported:
export const getSessionClaims = cache(async () => { ... })

// NOT:
const getSessionClaims = cache(async () => { ... }) // Missing export
```

---

## 📋 Definition of Done

**This feature is complete when:**

### Code Complete
- [ ] All 9 tasks completed and checked off in PLAN_permissions_system.md
- [ ] All files created as specified in tasks
- [ ] All files modified as specified in tasks
- [ ] No TypeScript errors (`pnpm type-check` passes)
- [ ] No lint errors (`pnpm lint` passes)

### Tests Pass
- [ ] All unit tests pass (`pnpm test`)
- [ ] Test coverage meets thresholds (60% branches, 70% functions/lines)
- [ ] Manual testing complete for all 5 roles
- [ ] Error messages verified

### UX Validated
- [ ] Driver cannot see unauthorized buttons (create, edit, delete, publish)
- [ ] Team leader has full access to all features
- [ ] Role badge visible in user menu
- [ ] View-only mode works in roster dialog
- [ ] No console errors or warnings
- [ ] No visual regressions

### Documentation Updated
- [ ] Update PLAN_permissions_system.md Progress section with completion dates
- [ ] Add "Outcomes & Retrospective" section to plan
- [ ] Update CLAUDE.md with permission patterns (if needed)
- [ ] Update README.md with roles/permissions section (if needed)

### Ready for Review
- [ ] Create Git commit with descriptive message
- [ ] Push to feature branch
- [ ] Create pull request with:
  - Link to ExecPlan
  - Summary of changes
  - Screenshots of UI before/after
  - Test results
  - Manual testing checklist

---

## 🚀 Getting Started Checklist

**Day 1 - Morning (2-3 hours):**
- [ ] Read this handoff document completely
- [ ] Read PLAN_permissions_system.md "Context and Orientation" section
- [ ] Read CLAUDE.md authentication flow section
- [ ] Explore existing code:
  - `lib/supabase/session.ts`
  - `components/layout/app-chrome.tsx`
  - `app/(authenticated)/calendar/actions.ts`
- [ ] Test current behavior (login as driver, see wrong buttons)

**Day 1 - Afternoon (3-4 hours):**
- [ ] Start TASK_01: Create permission utilities
- [ ] Test TASK_01: Verify hasPermission works
- [ ] Start TASK_02: Add role to session context
- [ ] Test TASK_02: Verify role appears in console log

**Day 2 - Morning (3-4 hours):**
- [ ] Complete TASK_03: Update calendar actions
- [ ] Complete TASK_04: Update roster actions
- [ ] Test: Verify permission denied errors are helpful

**Day 2 - Afternoon (3-4 hours):**
- [ ] Complete TASK_05: Create UI components
- [ ] Test TASK_05: Create test page, verify CanAccess works
- [ ] Start TASK_06: Update event UI

**Day 3 - Morning (3-4 hours):**
- [ ] Complete TASK_06: Update event UI
- [ ] Complete TASK_07: Update roster UI
- [ ] Complete TASK_08: Add role badge

**Day 3 - Afternoon (4-6 hours):**
- [ ] Complete TASK_09: Testing
- [ ] Write unit tests
- [ ] Manual testing as all roles
- [ ] Fix any bugs found
- [ ] Update documentation
- [ ] Create pull request

---

## 📞 Support & Questions

### If You Get Stuck

1. **Check the ExecPlan:** Most answers are in `PLAN_permissions_system.md`
2. **Check task files:** Each task has detailed code snippets
3. **Check this handoff:** Search for your issue (Ctrl+F)
4. **Check CLAUDE.md:** Project-wide patterns and architecture

### Common Questions

**Q: Can I skip the unit tests?**
A: No. Tests are critical for verifying permission logic. They're also quick to write (30-60 min for all tests).

**Q: Can I implement features in a different order?**
A: Follow the task order (01 → 09). Each task builds on the previous one. Skipping ahead will cause issues.

**Q: Should I fix the RLS policies that are missing 'admin' role?**
A: No, not in this task. Focus on application layer. RLS improvements are Phase 2 (documented in plan).

**Q: What if I find bugs in the existing code?**
A: Document them in the plan's "Surprises & Discoveries" section. Fix critical bugs, defer nice-to-haves.

**Q: Can I refactor the existing code while I'm in there?**
A: Minimize refactoring. Focus on permission system. Document refactoring ideas as TODOs for later.

**Q: The test users don't exist in my database. How do I create them?**
A: Ask your team lead to create them via Supabase dashboard, or use the existing testuser@logisticsv0.com account and manually change its role via SQL.

---

## 🎯 Success Criteria

**You'll know you're done when:**

1. **Demo to stakeholder:**
   - Login as driver → Can only VIEW events, rosters
   - Login as team leader → Can CREATE, EDIT, DELETE, PUBLISH
   - Role badge visible in both accounts
   - Error messages are clear and helpful

2. **Code review passes:**
   - All tests green
   - No TypeScript errors
   - Clean, readable code following project patterns
   - Proper error handling

3. **Product owner happy:**
   - Drivers aren't confused by buttons they can't use
   - Team leaders can do their job efficiently
   - Error messages help users understand limitations

---

## 📚 Additional Resources

### Supabase RLS Documentation
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Auth Helpers Next.js](https://supabase.com/docs/guides/auth/auth-helpers/nextjs)

### Next.js Documentation
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [React Cache](https://nextjs.org/docs/app/building-your-application/caching#react-cache-function)

### Project-Specific
- `CLAUDE.md` - Complete project documentation
- `PLAN_permissions_system.md` - Your implementation plan
- `todo.md` - Project roadmap and priorities

---

**Good luck! You've got this. The plan is solid, the tasks are clear, and the end result will significantly improve the user experience. 🚀**

If you have questions, document them in the plan's "Surprises & Discoveries" section as you work. Future developers will thank you!
