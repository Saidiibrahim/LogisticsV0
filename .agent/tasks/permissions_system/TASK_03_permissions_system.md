---
task_id: 03
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Update calendar server actions
phase: Phase 3 - Server Actions
---

# Task 03: Update Calendar Server Actions

## Objective

Add permission checks to all calendar event server actions. Return clear, helpful error messages when users don't have permission.

## File to Modify

### `app/(authenticated)/calendar/actions.ts`

Add permission checks to each action while reusing the single profile lookup:

```typescript
import { requirePermission, type UserRole } from '@/lib/auth/permissions'

// ... existing imports ...

interface UserProfile {
  organizationId: string
  role: UserRole
}

async function getUserProfile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
): Promise<UserProfile | null> {
  const { data, error } = await supabase
    .from('users')
    .select('organization_id, role')
    .eq('id', userId)
    .single()

  if (error || !data) {
    console.error('[calendar] Error fetching user profile:', error)
    return null
  }

  return {
    organizationId: data.organization_id,
    role: data.role as UserRole,
  }
}

/**
 * Create a calendar event in the calendar_events table.
 */
export async function createCalendarEvent(
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to create an event.' }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  const permissionCheck = requirePermission(profile.role, 'events.create')
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  // ... rest of existing function (use profile.organizationId) ...
}

/**
 * Update a calendar event in the calendar_events table.
 */
export async function updateCalendarEvent(
  eventId: string,
  _prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update an event.' }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  const permissionCheck = requirePermission(profile.role, 'events.edit.any')
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  // ... rest of existing function ...
}

/**
 * Quick update event status action for rapid state changes
 */
export async function updateEventStatus(
  eventId: string,
  newStatus: 'scheduled' | 'in-progress' | 'completed' | 'cancelled'
): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to update events.' }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  const anyStatus = requirePermission(profile.role, 'events.status.update.any')
  if (!anyStatus.allowed) {
    const ownStatus = requirePermission(
      profile.role,
      'events.status.update.own'
    )

    if (!ownStatus.allowed) {
      return { error: ownStatus.error }
    }

    const { data: eventRecord } = await supabase
      .from('calendar_events')
      .select('assigned_driver_id')
      .eq('id', eventId)
      .single()

    if (!eventRecord || eventRecord.assigned_driver_id !== user.id) {
      return {
        error:
          'You can only update the status for events assigned to you.',
      }
    }
  }

  // ... rest of existing function ...
}

/**
 * Delete a calendar event from the calendar_events table.
 */
export async function deleteEvent(eventId: string): Promise<ActionState> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'You must be logged in to delete events.' }
  }

  const profile = await getUserProfile(supabase, user.id)
  if (!profile) {
    return { error: 'Could not determine your organization.' }
  }

  const permissionCheck = requirePermission(profile.role, 'events.delete')
  if (!permissionCheck.allowed) {
    return { error: permissionCheck.error }
  }

  // ... rest of existing function ...
}
```

> **Tip:** Replace the existing `getUserOrganizationId` helper with this `getUserProfile` version and update call sites to use `profile.organizationId` so the query only runs once per action.

## Acceptance Criteria

- [ ] Import requirePermission at top of file
- [ ] createCalendarEvent checks 'events.create' permission
- [ ] updateCalendarEvent checks 'events.edit.any' permission
- [ ] updateEventStatus allows 'events.status.update.any' and falls back to 'events.status.update.own' when the user is the assigned driver
- [ ] deleteEvent checks 'events.delete' permission
- [ ] All permission checks return error before attempting database operation
- [ ] Error messages are clear and helpful
- [ ] TypeScript compiles with no errors
- [ ] No lint errors
- [ ] No redundant Supabase queries introduced

## Testing

### Test with API Client or Browser

1. **As Driver** (should be denied):
```bash
# Login as driver@example.com
# Try to create event via form
# Expected: "Your role (Driver) doesn't have permission to perform this action"
```

2. **As Team Leader** (should succeed):
```bash
# Login as team-leader@example.com
# Try to create event via form
# Expected: Success
```

3. **Test each action:**
   - Create event
   - Update event
   - Update event status
   - Delete event

### Verify Error Messages

- Error messages should mention the role
- Error messages should be user-friendly
- Error should appear in UI toast/alert (check existing error handling)

## Notes

- Permission check happens BEFORE database operation
- RLS policies are still the final security boundary
- These checks improve UX by providing clear feedback
- Database errors are still caught separately
