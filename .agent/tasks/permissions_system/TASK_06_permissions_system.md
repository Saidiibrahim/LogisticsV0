---
task_id: 06
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Update event management UI
phase: Phase 5 - UI Updates
---

# Task 06: Update Event Management UI

## Objective

Update calendar event UI components to hide edit/delete/create buttons based on user permissions.

## Files to Modify

### 1. `components/calendar/event-details-dialog.tsx`

Wrap action buttons with permission checks:

```typescript
import { CanAccess } from '@/components/auth'
import { useUser } from '@/components/layout/app-chrome'

// ... existing imports and component code ...

// In the render section, compute access for the quick status buttons:
const { userId, hasPermission } = useUser()
const canManageAnyStatus = hasPermission('events.status.update.any')
const canManageOwnStatus =
  hasPermission('events.status.update.own') &&
  event.assigned_driver_id === userId

const showStatusControls = canManageAnyStatus || canManageOwnStatus

return (
  <div className="flex flex-wrap items-center gap-2">
    <span className="text-muted-foreground text-sm">Quick Status:</span>

    {showStatusControls ? (
      <div className="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant={event.status === 'scheduled' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('scheduled')}
          disabled={isPending || event.status === 'scheduled'}
          className="h-7"
        >
          Scheduled
        </Button>
        <Button
          size="sm"
          variant={event.status === 'in-progress' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('in-progress')}
          disabled={isPending || event.status === 'in-progress'}
          className="h-7"
        >
          In Progress
        </Button>
        <Button
          size="sm"
          variant={event.status === 'completed' ? 'default' : 'outline'}
          onClick={() => handleStatusChange('completed')}
          disabled={isPending || event.status === 'completed'}
          className="h-7"
        >
          Completed
        </Button>
        <Button
          size="sm"
          variant={event.status === 'cancelled' ? 'destructive' : 'outline'}
          onClick={() => handleStatusChange('cancelled')}
          disabled={isPending || event.status === 'cancelled'}
          className="h-7"
        >
          Cancelled
        </Button>
      </div>
    ) : (
      <span className="text-xs text-muted-foreground">View only</span>
    )}
  </div>
)

// ... later in the component, wrap the action buttons:

<div className="flex justify-end gap-2">
  <CanAccess permission="events.edit.any">
    <Button
      variant="outline"
      size="sm"
      onClick={() => {
        setShowEditDialog(true)
        onOpenChange(false)
      }}
    >
      <Edit className="mr-2 size-4" />
      Edit Event
    </Button>
  </CanAccess>

  <CanAccess permission="events.delete">
    <Button
      variant="destructive"
      size="sm"
      onClick={() => setShowDeleteDialog(true)}
    >
      <Trash2 className="mr-2 size-4" />
      Delete Event
    </Button>
  </CanAccess>
</div>
```

### 2. `app/(authenticated)/calendar/_components/create-event-dialog.tsx`

Find where the dialog is triggered (likely a button in the calendar page) and wrap it:

```typescript
// In the parent component that shows the "Create Event" button:
import { CanAccess } from '@/components/auth'

<CanAccess permission="events.create">
  <Button onClick={() => setShowCreateDialog(true)}>
    <Plus className="mr-2 size-4" />
    Create Event
  </Button>
</CanAccess>
```

### 3. `app/(authenticated)/calendar/page.tsx` (if button is there)

If the create button is in the calendar page component, wrap it:

```typescript
import { CanAccess } from '@/components/auth'

<CanAccess permission="events.create">
  <CreateEventDialog />
</CanAccess>
```

## Acceptance Criteria

- [ ] Import CanAccess in event-details-dialog.tsx
- [ ] Wrap status change buttons with conditional logic that allows assigned drivers to update their own events
- [ ] Wrap edit button with permission check
- [ ] Wrap delete button with permission check
- [ ] Import CanAccess in create dialog parent component
- [ ] Wrap create event trigger with permission check
- [ ] TypeScript compiles with no errors
- [ ] No lint errors
- [ ] No visual regressions for authorized users

## Testing

### As Driver (Restricted)
1. Login as `driver@example.com`
2. Navigate to calendar
3. Verify:
   - [ ] "Create Event" button is hidden
   - [ ] Open an existing event
   - [ ] "Edit Event" button is hidden
   - [ ] "Delete Event" button is hidden
   - [ ] Status change buttons show only when the driver is assigned to the event

### As Team Leader (Full Access)
1. Login as `team-leader@example.com`
2. Navigate to calendar
3. Verify:
   - [ ] "Create Event" button is visible
   - [ ] Open an existing event
   - [ ] "Edit Event" button is visible
   - [ ] "Delete Event" button is visible
   - [ ] Status change buttons are visible for all events
   - [ ] Can successfully create, edit, delete events

### Edge Cases
- Verify dialog closes properly when edit button is hidden
- Verify no console errors or warnings
- Verify buttons don't flash before hiding

## Notes

- Buttons are hidden (not disabled) for better UX
- Permission checks are client-side (UX only)
- Server actions still validate permissions
- May need to adjust spacing when buttons are hidden
