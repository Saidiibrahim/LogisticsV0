---
task_id: 01
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Create permission utilities and types
phase: Phase 1 - Foundation
---

# Task 01: Create Permission Utilities and Types

## Objective

Create the foundational TypeScript utilities for role-based permission checking. This includes type definitions for roles and permissions, the permission mapping, and helper functions.

## Files to Create

### `lib/auth/permissions.ts` (new file)

```typescript
/**
 * User roles in the system.
 * Matches the role column constraint in the users table.
 */
export type UserRole =
  | 'driver'
  | 'team-leader'
  | 'customer-support'
  | 'retail-officer'
  | 'admin'

/**
 * Fine-grained permissions for actions in the system.
 * Format: {resource}.{action}.{scope?}
 */
export type Permission =
  // Calendar Events
  | 'events.create'
  | 'events.edit.own'
  | 'events.edit.any'
  | 'events.delete'
  | 'events.status.update.own'
  | 'events.status.update.any'
  | 'events.view'

  // Rosters
  | 'rosters.create'
  | 'rosters.publish'
  | 'rosters.edit'
  | 'rosters.view'

  // Routes
  | 'routes.create'
  | 'routes.optimize'
  | 'routes.assign'
  | 'routes.view'

  // Deliveries
  | 'deliveries.create'
  | 'deliveries.update.own'
  | 'deliveries.update.any'
  | 'deliveries.complete'
  | 'deliveries.view'

  // Users & Admin
  | 'users.manage'
  | 'organizations.manage'

/**
 * Maps each role to the permissions it has.
 * This is the single source of truth for permission assignments.
 */
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  driver: [
    'events.view',
    'events.status.update.own',
    'rosters.view',
    'routes.view',
    'deliveries.update.own',
    'deliveries.complete',
    'deliveries.view',
  ],
  'team-leader': [
    'events.create',
    'events.edit.any',
    'events.delete',
    'events.status.update.any',
    'events.view',
    'rosters.create',
    'rosters.publish',
    'rosters.edit',
    'rosters.view',
    'routes.create',
    'routes.optimize',
    'routes.assign',
    'routes.view',
    'deliveries.create',
    'deliveries.update.any',
    'deliveries.complete',
    'deliveries.view',
  ],
  'customer-support': [
    'events.view',
    'rosters.view',
    'routes.view',
    'deliveries.view',
  ],
  'retail-officer': [
    'events.create',
    'events.view',
    'rosters.view',
    'routes.view',
    'deliveries.create',
    'deliveries.view',
  ],
  admin: [
    'events.create',
    'events.edit.any',
    'events.delete',
    'events.status.update.any',
    'events.view',
    'rosters.create',
    'rosters.publish',
    'rosters.edit',
    'rosters.view',
    'routes.create',
    'routes.optimize',
    'routes.assign',
    'routes.view',
    'deliveries.create',
    'deliveries.update.any',
    'deliveries.complete',
    'deliveries.view',
    'users.manage',
    'organizations.manage',
  ],
}

/**
 * Check if a role has a specific permission.
 */
export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

/**
 * Check if the current user has a specific permission.
 * Use this in server actions to validate permissions before operations.
 *
 * @returns Object with allowed boolean and optional error message
 */
export function requirePermission(
  role: UserRole | null | undefined,
  permission: Permission
): { allowed: boolean; error?: string } {
  if (!role) {
    return { allowed: false, error: 'Not authenticated' }
  }

  if (!hasPermission(role, permission)) {
    return {
      allowed: false,
      error: `Your role (${formatRole(role)}) doesn't have permission to perform this action`,
    }
  }

  return { allowed: true }
}

/**
 * Format role for display to users.
 */
export function formatRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    driver: 'Driver',
    'team-leader': 'Team Leader',
    'customer-support': 'Customer Support',
    'retail-officer': 'Retail Officer',
    admin: 'Administrator',
  }
  return roleLabels[role] ?? role
}
```

## Acceptance Criteria

- [ ] File created at `lib/auth/permissions.ts`
- [ ] All 5 user roles defined in UserRole type
- [ ] All permissions defined in Permission type
- [ ] ROLE_PERMISSIONS mapping complete for all roles
- [ ] hasPermission() function works correctly
- [ ] requirePermission() function works correctly
- [ ] formatRole() function works correctly
- [ ] TypeScript compiles with no errors
- [ ] No lint errors

## Testing

Manual test via TypeScript playground or simple test file:
```typescript
import { hasPermission } from '@/lib/auth/permissions'

console.log(hasPermission('driver', 'events.view')) // true
console.log(hasPermission('driver', 'events.create')) // false
console.log(hasPermission('team-leader', 'events.create')) // true
```

## Notes

- This file is the single source of truth for permissions
- Keep helpers synchronous so server actions can reuse existing user data (no extra queries)
- When adding new features, add new permissions here first
- Keep permission naming consistent: {resource}.{action}.{scope?}
