---
task_id: 07
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Update roster management UI
phase: Phase 5 - UI Updates
---

# Task 07: Update Roster Management UI

## Objective

Update roster management UI to hide publish/save buttons for unauthorized users and show view-only mode for drivers.

## Files to Modify

### 1. `components/calendar/weekly-roster-dialog.tsx`

Wrap action buttons and add view-only mode:

```typescript
import { CanAccess } from '@/components/auth'
import { useUser } from '@/components/layout/app-chrome'

// ... existing imports and component code ...

export function WeeklyRosterDialog({ /* props */ }) {
  const { hasPermission } = useUser()

  // Determine if user is in view-only mode
  const isViewOnly = !hasPermission('rosters.edit')

  // ... existing component code ...

  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Weekly Roster
            {isViewOnly && (
              <Badge variant="secondary" className="ml-2">
                View Only
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {/* Roster content - disable editing if view-only */}
        <div className={isViewOnly ? 'pointer-events-none opacity-60' : ''}>
          {/* Existing roster grid/calendar */}
        </div>

        <DialogFooter>
          {/* Only show action buttons if user has permission */}
          <CanAccess permission="rosters.edit">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={isSaving}
            >
              Save Draft
            </Button>
          </CanAccess>

          <CanAccess permission="rosters.publish">
            <Button
              onClick={handlePublish}
              disabled={isSaving}
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Publish Roster
            </Button>
          </CanAccess>

          {isViewOnly && (
            <p className="text-muted-foreground text-sm">
              You have view-only access to rosters. Contact your team leader to make changes.
            </p>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

### 2. `app/(authenticated)/calendar/page.tsx` (or wherever roster is triggered)

If there's a "Create Roster" or "Manage Roster" button, wrap it:

```typescript
import { CanAccess } from '@/components/auth'

// Show roster button to all, but it will be view-only for drivers
<Button onClick={() => setShowRoster(true)}>
  View Roster
</Button>

// OR if there's a separate create button:
<CanAccess permission="rosters.create">
  <Button onClick={() => setShowCreateRoster(true)}>
    Create New Roster
  </Button>
</CanAccess>
```

## Acceptance Criteria

- [ ] Import CanAccess and useUser in weekly-roster-dialog.tsx
- [ ] Detect view-only mode based on permissions
- [ ] Show "View Only" badge when in read-only mode
- [ ] Disable roster editing in view-only mode
- [ ] Wrap "Save Draft" button with permission check
- [ ] Wrap "Publish Roster" button with permission check
- [ ] Show helpful message in view-only mode
- [ ] TypeScript compiles with no errors
- [ ] No lint errors

## Testing

### As Driver (View Only)
1. Login as `driver@example.com`
2. Navigate to calendar/roster
3. Verify:
   - [ ] Can view roster
   - [ ] "View Only" badge is visible
   - [ ] Cannot edit assignments (pointer-events-none)
   - [ ] "Save Draft" button is hidden
   - [ ] "Publish Roster" button is hidden
   - [ ] Helpful message explains view-only access

### As Team Leader (Full Access)
1. Login as `team-leader@example.com`
2. Navigate to calendar/roster
3. Verify:
   - [ ] Can edit roster
   - [ ] No "View Only" badge
   - [ ] "Save Draft" button is visible
   - [ ] "Publish Roster" button is visible
   - [ ] Can successfully save and publish

### Edge Cases
- Verify drivers can still see published rosters (read access)
- Verify helpful error if driver tries to edit via keyboard
- Verify no console errors
- Verify smooth transition between edit and view modes

## Notes

- Drivers need to VIEW rosters (their schedule)
- But they cannot EDIT or PUBLISH
- View-only mode disables clicking but keeps visual feedback
- Use opacity to indicate disabled state
- Provide clear messaging about why editing is disabled
