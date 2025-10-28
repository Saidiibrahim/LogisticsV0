---
task_id: 09
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Testing and validation
phase: Phase 6 - Testing
---

# Task 09: Testing and Validation

## Objective

Comprehensive testing of the permission system, including unit tests, component tests, and manual testing across all user roles.

## Unit Tests

### 1. `lib/auth/__tests__/permissions.test.ts` (new file)

```typescript
import { describe, expect, it } from 'vitest'
import { hasPermission, formatRole, ROLE_PERMISSIONS } from '../permissions'

describe('permissions utilities', () => {
  describe('hasPermission', () => {
    it('should grant drivers permission to view events', () => {
      expect(hasPermission('driver', 'events.view')).toBe(true)
    })

    it('should deny drivers permission to create events', () => {
      expect(hasPermission('driver', 'events.create')).toBe(false)
    })

    it('should grant team leaders permission to create events', () => {
      expect(hasPermission('team-leader', 'events.create')).toBe(true)
    })

    it('should grant team leaders permission to publish rosters', () => {
      expect(hasPermission('team-leader', 'rosters.publish')).toBe(true)
    })

    it('should grant admins all permissions', () => {
      expect(hasPermission('admin', 'events.create')).toBe(true)
      expect(hasPermission('admin', 'rosters.publish')).toBe(true)
      expect(hasPermission('admin', 'users.manage')).toBe(true)
      expect(hasPermission('admin', 'organizations.manage')).toBe(true)
    })

    it('should deny customer support write permissions', () => {
      expect(hasPermission('customer-support', 'events.create')).toBe(false)
      expect(hasPermission('customer-support', 'rosters.publish')).toBe(false)
    })

    it('should grant customer support read permissions', () => {
      expect(hasPermission('customer-support', 'events.view')).toBe(true)
      expect(hasPermission('customer-support', 'rosters.view')).toBe(true)
    })
  })

  describe('formatRole', () => {
    it('should format driver role', () => {
      expect(formatRole('driver')).toBe('Driver')
    })

    it('should format team-leader role', () => {
      expect(formatRole('team-leader')).toBe('Team Leader')
    })

    it('should format customer-support role', () => {
      expect(formatRole('customer-support')).toBe('Customer Support')
    })

    it('should format retail-officer role', () => {
      expect(formatRole('retail-officer')).toBe('Retail Officer')
    })

    it('should format admin role', () => {
      expect(formatRole('admin')).toBe('Administrator')
    })
  })

  describe('ROLE_PERMISSIONS mapping', () => {
    it('should have permissions for all roles', () => {
      expect(ROLE_PERMISSIONS.driver).toBeDefined()
      expect(ROLE_PERMISSIONS['team-leader']).toBeDefined()
      expect(ROLE_PERMISSIONS['customer-support']).toBeDefined()
      expect(ROLE_PERMISSIONS['retail-officer']).toBeDefined()
      expect(ROLE_PERMISSIONS.admin).toBeDefined()
    })

    it('should have array of permissions for each role', () => {
      expect(Array.isArray(ROLE_PERMISSIONS.driver)).toBe(true)
      expect(ROLE_PERMISSIONS.driver.length).toBeGreaterThan(0)
    })
  })
})
```

### 2. `components/auth/__tests__/can-access.test.tsx` (new file)

```typescript
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { CanAccess } from '../can-access'
import * as AppChrome from '@/components/layout/app-chrome'

// Mock useUser hook
vi.mock('@/components/layout/app-chrome', () => ({
  useUser: vi.fn(),
}))

describe('CanAccess component', () => {
  it('should render children when permission is granted', () => {
    vi.mocked(AppChrome.useUser).mockReturnValue({
      hasPermission: (permission) => permission === 'events.create',
      // ... other user context values
    } as any)

    render(
      <CanAccess permission="events.create">
        <button>Create Event</button>
      </CanAccess>
    )

    expect(screen.getByText('Create Event')).toBeInTheDocument()
  })

  it('should render fallback when permission is denied', () => {
    vi.mocked(AppChrome.useUser).mockReturnValue({
      hasPermission: () => false,
    } as any)

    render(
      <CanAccess
        permission="events.create"
        fallback={<p>Access denied</p>}
      >
        <button>Create Event</button>
      </CanAccess>
    )

    expect(screen.queryByText('Create Event')).not.toBeInTheDocument()
    expect(screen.getByText('Access denied')).toBeInTheDocument()
  })

  it('should render nothing when permission is denied and no fallback', () => {
    vi.mocked(AppChrome.useUser).mockReturnValue({
      hasPermission: () => false,
    } as any)

    const { container } = render(
      <CanAccess permission="events.create">
        <button>Create Event</button>
      </CanAccess>
    )

    expect(container.textContent).toBe('')
  })
})
```

## Manual Testing Checklist

### As Driver (`driver@example.com`)

**Calendar Events:**
- [ ] Cannot see "Create Event" button
- [ ] Can view existing events
- [ ] Cannot see "Edit Event" button in event details
- [ ] Cannot see "Delete Event" button in event details
- [ ] Status change buttons appear only on events assigned to the driver and the updates succeed
- [ ] Attempting to update status for an unassigned event returns permission error
- [ ] Attempting to create event via API returns permission error

**Rosters:**
- [ ] Can view published rosters
- [ ] Cannot view draft rosters (RLS blocks this)
- [ ] Cannot see "Publish Roster" button
- [ ] Cannot see "Save Draft" button
- [ ] Sees "View Only" badge in roster dialog
- [ ] Attempting to publish roster via API returns permission error

**User Menu:**
- [ ] Role badge shows "Driver"
- [ ] Email and name display correctly

### As Team Leader (`team-leader@example.com`)

**Calendar Events:**
- [ ] Can see "Create Event" button
- [ ] Can create events successfully
- [ ] Can see "Edit Event" button in event details
- [ ] Can edit events successfully
- [ ] Can see "Delete Event" button
- [ ] Can delete events successfully
- [ ] Can see and use status change buttons on every event

**Rosters:**
- [ ] Can view all rosters (draft and published)
- [ ] Can see "Publish Roster" button
- [ ] Can publish rosters successfully
- [ ] Can see "Save Draft" button
- [ ] Can save draft rosters
- [ ] No "View Only" badge in roster dialog
- [ ] Email notifications sent when publishing

**User Menu:**
- [ ] Role badge shows "Team Leader"

### As Customer Support (`customer-support@example.com`)

**Calendar Events:**
- [ ] Cannot see "Create Event" button
- [ ] Can view existing events
- [ ] Cannot see "Edit Event" button
- [ ] Cannot see "Delete Event" button

**Rosters:**
- [ ] Can view rosters
- [ ] Cannot publish or edit
- [ ] Sees "View Only" badge

**User Menu:**
- [ ] Role badge shows "Customer Support"

### As Admin (if user exists)

**All Features:**
- [ ] Can access all features
- [ ] Can create, edit, delete events
- [ ] Can publish rosters
- [ ] Can manage users (if admin panel exists)

**User Menu:**
- [ ] Role badge shows "Administrator"

## Error Message Testing

1. **Direct API Calls:**
   - Use browser DevTools or Postman
   - Call server actions without permission
   - Verify error messages are clear and mention role

2. **Example Error Messages:**
   ```
   ✅ Good: "Your role (Driver) doesn't have permission to perform this action"
   ✅ Good: "You can only update the status for events assigned to you."
   ❌ Bad: "Permission denied"
   ❌ Bad: "Database error: policy violation"
   ```

## Performance Testing

1. **Page Load:**
   - Verify the profile lookup (organization + role) happens once per action
   - Check React DevTools for unnecessary re-renders
   - Verify session cache works (role fetched once per request)

2. **Permission Checks:**
   - Verify hasPermission() is fast (in-memory lookup)
   - No database calls during UI rendering

## Accessibility Testing

1. **Keyboard Navigation:**
   - Verify tab order works with hidden buttons
   - No focus traps

2. **Screen Readers:**
   - Role badge is announced correctly
   - Hidden features don't confuse screen readers

## Cross-Browser Testing

- [ ] Chrome - All features work
- [ ] Safari - All features work
- [ ] Firefox - All features work
- [ ] Edge - All features work

## Acceptance Criteria

- [ ] All unit tests pass
- [ ] All component tests pass
- [ ] Manual testing completed for all roles
- [ ] Error messages are clear and helpful
- [ ] No console errors or warnings
- [ ] No performance regressions
- [ ] Accessibility requirements met
- [ ] Cross-browser compatibility confirmed

## Run Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Check coverage meets thresholds (60% branches, 70% functions/lines)
```

## Documentation

After testing, update:
- [ ] README.md - Add section on user roles and permissions
- [ ] CLAUDE.md - Document permission system patterns
- [ ] Create quick reference guide for developers

## Notes

- Permission system is defense in depth (UI + server + database)
- RLS policies are the real security boundary
- These tests verify UX layer works correctly
- Report any bugs or unexpected behavior immediately
