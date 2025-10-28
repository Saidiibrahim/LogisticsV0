---
task_id: 05
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Create UI permission components
phase: Phase 4 - UI Components
---

# Task 05: Create UI Permission Components

## Objective

Create reusable React components for permission-based UI rendering. These components will conditionally show/hide features based on user permissions.

## Files to Create

### 1. `components/auth/can-access.tsx` (new file)

```typescript
'use client'

import { useUser } from '@/components/layout/app-chrome'
import type { Permission } from '@/lib/auth/permissions'

interface CanAccessProps {
  /**
   * The permission required to view the children
   */
  permission: Permission

  /**
   * Content to show when permission is granted
   */
  children: React.ReactNode

  /**
   * Optional fallback content when permission is denied
   */
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on user permission.
 *
 * @example
 * ```tsx
 * <CanAccess permission="events.create">
 *   <Button>Create Event</Button>
 * </CanAccess>
 * ```
 *
 * @example With fallback
 * ```tsx
 * <CanAccess
 *   permission="events.edit.any"
 *   fallback={<p>You don't have permission to edit events</p>}
 * >
 *   <EditEventForm />
 * </CanAccess>
 * ```
 */
export function CanAccess({ permission, children, fallback = null }: CanAccessProps) {
  const { hasPermission } = useUser()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

### 2. `components/auth/require-role.tsx` (new file)

```typescript
'use client'

import { useUser } from '@/components/layout/app-chrome'
import type { UserRole } from '@/lib/auth/permissions'

interface RequireRoleProps {
  /**
   * Role or array of roles allowed to view the children
   */
  roles: UserRole | UserRole[]

  /**
   * Content to show when role matches
   */
  children: React.ReactNode

  /**
   * Optional fallback content when role doesn't match
   */
  fallback?: React.ReactNode
}

/**
 * Conditionally renders children based on user role.
 * Use CanAccess for permission-based rendering when possible.
 *
 * @example
 * ```tsx
 * <RequireRole roles="admin">
 *   <AdminPanel />
 * </RequireRole>
 * ```
 *
 * @example Multiple roles
 * ```tsx
 * <RequireRole roles={['team-leader', 'admin']}>
 *   <ManagementDashboard />
 * </RequireRole>
 * ```
 */
export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const { role } = useUser()

  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
```

### 3. `components/auth/index.ts` (new file)

```typescript
export { CanAccess } from './can-access'
export { RequireRole } from './require-role'
```

## Acceptance Criteria

- [ ] CanAccess component created with correct props
- [ ] CanAccess uses useUser() hook correctly
- [ ] CanAccess shows children when permission granted
- [ ] CanAccess shows fallback when permission denied
- [ ] RequireRole component created with correct props
- [ ] RequireRole uses useUser() hook correctly
- [ ] RequireRole handles single role
- [ ] RequireRole handles array of roles
- [ ] Both components have JSDoc comments
- [ ] Both components exported from index.ts
- [ ] TypeScript compiles with no errors
- [ ] No lint errors

## Testing

### Manual Test Component

Create a test page to verify both components work:

```typescript
// app/(authenticated)/test-permissions/page.tsx

'use client'

import { CanAccess, RequireRole } from '@/components/auth'
import { useUser } from '@/components/layout/app-chrome'

export default function TestPermissionsPage() {
  const { role } = useUser()

  return (
    <div className="space-y-4 p-8">
      <h1>Permission Testing</h1>
      <p>Current role: {role}</p>

      <div>
        <h2>CanAccess Tests</h2>

        <CanAccess permission="events.create">
          <p>✅ You can create events</p>
        </CanAccess>

        <CanAccess
          permission="events.create"
          fallback={<p>❌ You cannot create events</p>}
        >
          <p>✅ You can create events</p>
        </CanAccess>

        <CanAccess permission="rosters.publish">
          <button className="btn">Publish Roster</button>
        </CanAccess>
      </div>

      <div>
        <h2>RequireRole Tests</h2>

        <RequireRole roles="team-leader">
          <p>✅ You are a team leader</p>
        </RequireRole>

        <RequireRole roles={['team-leader', 'admin']}>
          <p>✅ You are a team leader or admin</p>
        </RequireRole>

        <RequireRole
          roles="driver"
          fallback={<p>❌ You are not a driver</p>}
        >
          <p>✅ You are a driver</p>
        </RequireRole>
      </div>
    </div>
  )
}
```

### Test Cases

1. Login as driver - verify "create events" is hidden
2. Login as team-leader - verify "create events" is shown
3. Verify fallback content renders when permission denied
4. Verify RequireRole works with single role
5. Verify RequireRole works with array of roles

Delete test page after verification.

## Notes

- These components are client-side only
- They control UI visibility, not security
- Server actions still enforce permissions
- Use CanAccess for permission checks (preferred)
- Use RequireRole only when you need role-specific logic
