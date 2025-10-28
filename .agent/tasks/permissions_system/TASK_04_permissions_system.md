---
task_id: 04
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Update roster server actions
phase: Phase 3 - Server Actions
---

# Task 04: Update Roster Server Actions

## Objective

Add permission checks to roster management server actions. Only team leaders should be able to create, edit, and publish rosters.

## File to Modify

### `app/(authenticated)/calendar/roster-actions.ts`

Add permission checks to saveRoster action while reusing the shared profile helper:

```typescript
import { requirePermission } from '@/lib/auth/permissions'

// ... existing imports ...

/**
 * Save a roster with assignments. Supports empty drafts.
 */
export async function saveRoster(
  weekStartISO: string,
  status: RosterStatus,
  assignments: RosterAssignment[],
  rosterId?: string
): Promise<ActionState> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { success: false, error: 'Not authenticated' }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { success: false, error: 'Could not determine your organization.' }
  }

  if (status === 'published' || status === 'modified') {
    const permissionCheck = requirePermission(profile.role, 'rosters.publish')
    if (!permissionCheck.allowed) {
      return { success: false, error: permissionCheck.error }
    }
  } else {
    const permissionCheck = requirePermission(profile.role, 'rosters.edit')
    if (!permissionCheck.allowed) {
      return { success: false, error: permissionCheck.error }
    }
  }

  // ... rest of existing function ...
}
```

> **Tip:** Reuse the `getUserProfile` helper introduced in Task 03 so roster actions don't trigger a second profile query.

## Acceptance Criteria

- [ ] Import requirePermission at top of file
- [ ] saveRoster checks 'rosters.publish' when status is published/modified
- [ ] saveRoster checks 'rosters.edit' when status is draft
- [ ] Permission check happens before database operation
- [ ] Error messages are clear and helpful
- [ ] TypeScript compiles with no errors
- [ ] No lint errors
- [ ] No redundant Supabase queries introduced

## Testing

### Test Publishing Roster

1. **As Driver** (should be denied):
```bash
# Login as driver@example.com
# Try to publish a roster
# Expected: "Your role (Driver) doesn't have permission to perform this action"
```

2. **As Team Leader** (should succeed):
```bash
# Login as team-leader@example.com
# Try to publish a roster
# Expected: Success, roster published, emails sent
```

### Test Saving Draft

1. **As Driver** (should be denied):
```bash
# Login as driver@example.com
# Try to save roster as draft
# Expected: Permission error
```

2. **As Team Leader** (should succeed):
```bash
# Login as team-leader@example.com
# Try to save roster as draft
# Expected: Success
```

### Edge Cases

- Verify changing draft to published requires publish permission
- Verify changing published to modified requires publish permission

## Notes

- Different permissions for draft vs publish
- Publishing triggers email notifications (existing behavior)
- RLS policies also enforce this at database level
- Permission check improves error messaging
