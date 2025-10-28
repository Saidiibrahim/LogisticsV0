---
task_id: 08
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Add role badge and polish
phase: Phase 5 - UI Updates
---

# Task 08: Add Role Badge and Polish

## Objective

Display the user's role in the UI (likely in the user menu/profile dropdown) and add final polish to the permission system.

## Files to Modify

### 1. User Menu/Profile Component

Find the user menu component (likely in `components/layout/` directory):

```typescript
import { useUser } from '@/components/layout/app-chrome'
import { formatRole } from '@/lib/auth/permissions'
import { Badge } from '@/components/ui/badge'

export function UserMenu() {
  const { fullName, email, role } = useUser()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {/* Avatar or button */}
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{fullName}</p>
            <p className="text-muted-foreground text-xs leading-none">{email}</p>

            {/* ADD THIS - Role badge */}
            <Badge variant="secondary" className="mt-2 w-fit text-xs">
              {formatRole(role)}
            </Badge>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/* Existing menu items */}
        <DropdownMenuItem>Profile</DropdownMenuItem>
        <DropdownMenuItem>Settings</DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem>Sign Out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

### 2. Add Tooltips to Hidden Features (Optional Polish)

For features that are hidden, add tooltips explaining why:

```typescript
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// Wrap hidden buttons with tooltip for context
<CanAccess
  permission="events.create"
  fallback={
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span>
            <Button disabled className="opacity-50">
              <Plus className="mr-2 size-4" />
              Create Event
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent>
          <p>Only team leaders can create events</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  }
>
  <Button>
    <Plus className="mr-2 size-4" />
    Create Event
  </Button>
</CanAccess>
```

**Note:** This tooltip approach is optional. Hiding features completely (no tooltip) is often cleaner UX.

### 3. Add Permission Denied Toast (Optional)

Enhance error handling to show toast notifications:

```typescript
// In components that call server actions with permission errors:
import { toast } from '@/components/ui/use-toast'

async function handleAction() {
  const result = await serverAction()

  if (!result.success) {
    toast({
      title: 'Permission Denied',
      description: result.error,
      variant: 'destructive',
    })
    return
  }

  toast({
    title: 'Success',
    description: 'Action completed successfully',
  })
}
```

## Acceptance Criteria

- [ ] User menu displays role badge
- [ ] Role badge uses formatRole() for proper display name
- [ ] Badge is styled with secondary variant
- [ ] Role is visible but not prominent (subtle display)
- [ ] (Optional) Tooltips added to disabled features
- [ ] (Optional) Toast notifications for permission errors
- [ ] TypeScript compiles with no errors
- [ ] No lint errors
- [ ] UI looks polished and professional

## Testing

### Visual Testing
1. Login as different roles
2. Open user menu
3. Verify role badge displays correctly:
   - Driver → "Driver"
   - Team Leader → "Team Leader"
   - Customer Support → "Customer Support"
   - Retail Officer → "Retail Officer"
   - Admin → "Administrator"

### Tooltip Testing (if implemented)
1. Login as driver
2. Hover over disabled "Create Event" button
3. Verify tooltip shows helpful message
4. Verify tooltip doesn't block interaction

### Toast Testing (if implemented)
1. Trigger a permission-denied action
2. Verify toast appears with clear message
3. Verify toast is dismissible
4. Verify toast auto-dismisses after timeout

## Notes

- Role badge should be subtle, not dominating the menu
- Use secondary variant for softer visual impact
- Consider adding role to mobile navigation if applicable
- Keep UI clean - don't clutter with too many badges/labels
- Prefer hiding features over showing disabled features
