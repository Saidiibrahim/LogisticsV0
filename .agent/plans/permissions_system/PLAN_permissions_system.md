# PLAN_permissions_system

**Feature:** Application-Level Permission System
**Priority:** CRITICAL
**Estimated Duration:** 2-3 days
**Started:** 2025-10-27

---

## Purpose / Big Picture

After this change, users will see only the features they have permission to use. Drivers won't see "Create Event" or "Publish Roster" buttons. Team leaders will have full access to scheduling and roster management. When users attempt unauthorized actions, they'll receive clear, helpful error messages like "Your role (driver) doesn't have permission to publish rosters" instead of generic database errors.

**User-Visible Behavior:**
- UI buttons/features are hidden based on user role
- Clear permission error messages in forms/dialogs
- Role badge displayed in user profile dropdown
- Smooth UX - no confusion about what users can/cannot do

---

## Surprises & Discoveries

- **Observation:** Database already has comprehensive RLS policies for all tables
- **Evidence:** Found policies for calendar_events, roster_assignments, routes, etc. (verified via `pg_policies` query)
- **Impact:** Security is solid at DB level; only need to improve application layer UX

- **Observation:** Helper functions `user_has_role()` and `get_user_organization_id()` already exist
- **Evidence:** Found in database via Supabase MCP query
- **Impact:** Can reuse these patterns in TypeScript permission utilities

- **Observation:** Five user roles defined: driver, team-leader, customer-support, retail-officer, admin
- **Evidence:** Check constraint on users.role column
- **Impact:** Need to ensure 'admin' role is included in all RLS policies (currently missing from some)

---

## Decision Log

- **Decision:** Implement permissions at application layer, not modify existing RLS policies initially
- **Rationale:** RLS policies work correctly; focus on UX improvements first. Phase 2 can enhance RLS.
- **Date/Author:** 2025-10-27 / Senior Developer Review

- **Decision:** Use React Context to expose `hasPermission()` helper to all components
- **Rationale:** Avoids prop drilling, makes permission checks simple: `{hasPermission('events.create') && <Button>...}`
- **Date/Author:** 2025-10-27 / Senior Developer Review

- **Decision:** Create string-based permission keys like 'events.create' instead of role checking
- **Rationale:** More flexible - can reassign permissions to roles without changing components. Follows principle of least privilege.
- **Date/Author:** 2025-10-27 / Senior Developer Review

- **Decision:** Add role to existing session context rather than separate auth context
- **Rationale:** Session data already fetched in authenticated layout; avoid extra database queries
- **Date/Author:** 2025-10-27 / Senior Developer Review

---

## Outcomes & Retrospective

_To be filled in upon completion_

---

## Context and Orientation

### Current State

**Authentication Flow:**
1. `middleware.ts` - Intercepts all requests, calls `lib/supabase/middleware.ts`
2. `app/(authenticated)/layout.tsx` - Server-side session validation via `getSessionClaims()`
3. `components/layout/app-chrome.tsx` - Receives user data via props, provides to descendants via React Context

**User Context (Current):**
- File: `components/layout/app-chrome.tsx`
- Exports: `UserContext`, `useUser()` hook
- Data: userId, email, fullName, organizationId
- **Missing:** role, hasPermission()

**Database Security:**
- RLS enabled on: users, calendar_events, roster_assignments, deliveries, routes, etc.
- Helper functions: `user_has_role(text[])`, `get_user_organization_id()`, `user_can_access_organization(uuid)`
- Example policy: Team leaders have full access to calendar_events, drivers have read-only

**Server Actions:**
- Location: Co-located with pages (e.g., `app/(authenticated)/calendar/actions.ts`)
- Pattern: Check auth, perform operation, return `{ success, error? }`
- **Problem:** No permission checks - rely on RLS, resulting in generic error messages

**UI Components:**
- Event details dialog: `components/calendar/event-details-dialog.tsx`
- Create event dialog: `app/(authenticated)/calendar/_components/create-event-dialog.tsx`
- Roster management: `components/calendar/weekly-roster-dialog.tsx`
- **Problem:** All users see all buttons; only blocked by RLS on submit

### Key Files

1. `lib/supabase/session.ts` - Session helper (exists, exports `getSessionClaims()`)
2. `components/layout/app-chrome.tsx` - User context provider
3. `app/(authenticated)/layout.tsx` - Authenticated layout, calls `getSessionClaims()`
4. `app/(authenticated)/calendar/actions.ts` - Calendar server actions
5. `app/(authenticated)/calendar/roster-actions.ts` - Roster server actions
6. `components/calendar/event-details-dialog.tsx` - Event UI with edit/delete buttons
7. `lib/types/roster.ts` - Roster type definitions

---

## Plan of Work

### Phase 1: Permission Utilities & Types (Day 1 Morning)

**Step 1:** Create permission type definitions
- File: `lib/auth/permissions.ts` (new file)
- Add `UserRole` type (driver, team-leader, customer-support, retail-officer, admin)
- Add `Permission` type (events.create, events.edit.any, rosters.publish, etc.)
- Create `ROLE_PERMISSIONS` mapping: which permissions each role has

**Step 2:** Implement permission helper functions
- Same file: `lib/auth/permissions.ts`
- Keep helpers pure so callers can reuse existing user data (no Supabase dependency)
- Function: `hasPermission(role, permission)` - returns boolean
- Function: `formatRole(role)` - maps to human-readable label
- Function: `requirePermission(role, permission)` - returns `{ allowed, error? }`

### Phase 2: Session Context Enhancement (Day 1 Afternoon)

**Step 3:** Add role to session claims
- File: `lib/supabase/session.ts`
- Update `SessionClaims` interface to include `role: UserRole`
- Update `getSessionClaims()` to fetch role from users table
- Verify cache works correctly (using React `cache()`)

**Step 4:** Enhance user context
- File: `components/layout/app-chrome.tsx`
- Update `UserContextValue` interface to include `role` and `hasPermission()`
- Import `ROLE_PERMISSIONS` from permissions utilities
- Create `hasPermission` function in component
- Add to context provider value

**Step 5:** Update authenticated layout
- File: `app/(authenticated)/layout.tsx`
- Pass `role` from session to AppChrome
- No other changes needed (already calls `getSessionClaims()`)

### Phase 3: Server Action Guards (Day 2 Morning)

**Step 6:** Update calendar actions
- File: `app/(authenticated)/calendar/actions.ts`
- Update the local helper to return both organization ID **and** role in one query (e.g., rename to `getUserProfile`)
- Add permission checks to:
  - `createCalendarEvent()` - require 'events.create'
  - `updateCalendarEvent()` - require 'events.edit.any'
  - `updateEventStatus()` - allow 'events.status.update.any'; otherwise allow 'events.status.update.own' only when the user is the assigned driver
  - `deleteEvent()` - require 'events.delete'
- Return helpful error messages when permission denied and reuse the single profile query to avoid extra database calls

**Step 7:** Update roster actions
- File: `app/(authenticated)/calendar/roster-actions.ts`
- Add permission checks to:
  - `saveRoster()` with status='published' - require 'rosters.publish'
  - `saveRoster()` with status='draft' - require 'rosters.edit'
- Return helpful error messages

### Phase 4: UI Permission Components (Day 2 Afternoon)

**Step 8:** Create CanAccess component
- File: `components/auth/can-access.tsx` (new file)
- Component takes: `permission`, `children`, `fallback?`
- Uses `useUser()` hook to access `hasPermission()`
- Conditionally renders children or fallback

**Step 9:** Create RequireRole component (optional, for specific role checks)
- File: `components/auth/require-role.tsx` (new file)
- Component takes: `roles[]`, `children`, `fallback?`
- Uses `useUser()` hook to access `role`
- Renders children only if user role matches

### Phase 5: UI Updates (Day 3)

**Step 10:** Update event details dialog
- File: `components/calendar/event-details-dialog.tsx`
- Wrap "Edit Event" button in `<CanAccess permission="events.edit.any">`
- Wrap "Delete Event" button in `<CanAccess permission="events.delete">`
- Show status change buttons for:
  - Users with `events.status.update.any`
  - Drivers with `events.status.update.own` when they are the assigned driver (check against `event.assigned_driver_id`)

**Step 11:** Update create event dialog
- File: `app/(authenticated)/calendar/_components/create-event-dialog.tsx`
- Wrap trigger button in `<CanAccess permission="events.create">`
- Or move to parent component and wrap there

**Step 12:** Update roster management UI
- File: `components/calendar/weekly-roster-dialog.tsx`
- Wrap "Publish" button in `<CanAccess permission="rosters.publish">`
- Wrap "Save Draft" in `<CanAccess permission="rosters.edit">`
- Show view-only mode for drivers

**Step 13:** Add role badge to user menu
- File: `components/layout/app-chrome.tsx` or user menu component
- Display user's role in dropdown (e.g., "Team Leader", "Driver")
- Style with badge component

### Phase 6: Testing & Validation (Day 3)

**Step 14:** Manual testing with different roles
- Test as driver: verify cannot see edit/delete/publish buttons
- Test as team-leader: verify full access
- Test permission denied errors: clear messages
- Test all calendar and roster actions

**Step 15:** Write unit tests
- File: `lib/auth/__tests__/permissions.test.ts` (new)
- Test `hasPermission()` for each role
- Test `ROLE_PERMISSIONS` mapping completeness
- File: `components/auth/__tests__/can-access.test.tsx` (new)
- Test CanAccess component shows/hides correctly

---

## Concrete Steps

Tasks are located in `.agent/tasks/permissions_system/`:

1. `TASK_01_permissions_system.md` - Create permission utilities and types
2. `TASK_02_permissions_system.md` - Add role to session context
3. `TASK_03_permissions_system.md` - Update calendar server actions
4. `TASK_04_permissions_system.md` - Update roster server actions
5. `TASK_05_permissions_system.md` - Create UI permission components
6. `TASK_06_permissions_system.md` - Update event management UI
7. `TASK_07_permissions_system.md` - Update roster management UI
8. `TASK_08_permissions_system.md` - Add role badge and polish
9. `TASK_09_permissions_system.md` - Testing and validation

---

## Progress

### Phase 1: Foundation
- [ ] (TASK_01_permissions_system.md) Create permission utilities and types
  - [ ] Define UserRole and Permission types
  - [ ] Create ROLE_PERMISSIONS mapping
  - [ ] Implement hasPermission() helper
  - [ ] Implement formatRole() helper
  - [ ] Implement requirePermission() helper

### Phase 2: Context Enhancement
- [ ] (TASK_02_permissions_system.md) Add role to session context
  - [ ] Update SessionClaims interface
  - [ ] Update getSessionClaims() to fetch role
  - [ ] Update AppChrome UserContextValue
  - [ ] Add hasPermission to context provider

### Phase 3: Server Actions
- [ ] (TASK_03_permissions_system.md) Update calendar server actions
  - [ ] Add permission check to createCalendarEvent
  - [ ] Add permission check to updateCalendarEvent
  - [ ] Add permission check to updateEventStatus
  - [ ] Add permission check to deleteEvent

- [ ] (TASK_04_permissions_system.md) Update roster server actions
  - [ ] Add permission check to saveRoster (publish)
  - [ ] Add permission check to saveRoster (draft)

### Phase 4: UI Components
- [ ] (TASK_05_permissions_system.md) Create UI permission components
  - [ ] Create CanAccess component
  - [ ] Create RequireRole component
  - [ ] Export from components/auth

### Phase 5: UI Updates
- [ ] (TASK_06_permissions_system.md) Update event management UI
  - [ ] Wrap edit button with permission check
  - [ ] Wrap delete button with permission check
  - [ ] Wrap status buttons with permission check
  - [ ] Wrap create event trigger with permission check

- [ ] (TASK_07_permissions_system.md) Update roster management UI
  - [ ] Wrap publish button with permission check
  - [ ] Wrap save draft button with permission check
  - [ ] Show view-only mode for drivers

- [ ] (TASK_08_permissions_system.md) Add role badge and polish
  - [ ] Display role in user menu
  - [ ] Style role badge
  - [ ] Add tooltips for disabled features

### Phase 6: Testing
- [ ] (TASK_09_permissions_system.md) Testing and validation
  - [ ] Write unit tests for permission utilities
  - [ ] Write component tests for CanAccess
  - [ ] Manual testing as driver role
  - [ ] Manual testing as team-leader role
  - [ ] Verify error messages are clear

---

## Testing Approach

### Unit Tests
- **Permission utilities** (`lib/auth/permissions.ts`)
  - Test each role's permission set
  - Test `hasPermission()` returns correct boolean
  - Test `requirePermission()` returns correct error messages

### Component Tests
- **CanAccess component**
  - Renders children when permission granted
  - Renders fallback when permission denied
  - Works with useUser() hook

### Integration Tests (Manual)
1. **As Driver:**
   - Login as `driver@example.com`
   - Navigate to calendar
   - Verify cannot see "Create Event" button
   - Open existing event - verify cannot see edit/delete buttons
   - Can change status of own assigned events only
   - Navigate to roster - verify view-only mode

2. **As Team Leader:**
   - Login as `team-leader@example.com`
   - Navigate to calendar
   - Verify can create events
   - Verify can edit/delete any event
   - Navigate to roster - verify can publish

3. **Permission Denied Errors:**
   - Attempt to use server action without permission (via API)
   - Verify error message is clear and helpful

### Test Coverage Goals
- Permission utilities: 100% coverage
- CanAccess component: 100% coverage
- Server actions: At least one test per permission check

---

## Constraints & Considerations

### Technical Constraints
1. **Cannot modify RLS policies initially** - Leave database security unchanged for Phase 1
2. **Must use existing session infrastructure** - Avoid adding extra database queries
3. **React Server Components** - Permission checks in server actions must be async
4. **TypeScript strict mode** - All types must be properly defined

### UX Considerations
1. **Progressive disclosure** - Don't overwhelm users with permission error messages
2. **Clear feedback** - When permission denied, explain why (role-based)
3. **Graceful degradation** - Hide features rather than showing disabled buttons when possible
4. **Role visibility** - Users should know their role (display in profile)

### Security Considerations
1. **Defense in depth** - UI hiding is UX only; RLS policies are real security boundary
2. **Never trust client** - Always validate permissions in server actions
3. **Audit logging** - Future enhancement: log permission denials for security monitoring

### Performance Considerations
1. **Single session query** - Role fetched once per request via `cache()`
2. **No extra renders** - Permission checks don't trigger re-renders
3. **Bundle size** - Permission mapping is small (<1KB)

### Backwards Compatibility
1. **Existing users** - All users have roles in database (verified via query)
2. **No migration needed** - Database schema already supports this
3. **Graceful fallback** - If role missing, default to most restrictive (driver)

### Edge Cases
1. **Role changes** - User must sign out and back in to see new permissions
2. **Multiple tabs** - Role cached per tab session
3. **Stale data** - Permission denials might occur if role changed server-side
4. **API access** - RLS policies protect API routes; UI is just UX layer

---

## Future Enhancements (Post Phase 1)

### Phase 2 (Week 2)
- Add 'admin' role to all RLS policies that are missing it
- Implement audit logging for permission denials
- Create admin panel for viewing user roles
- Add role change functionality for admins

### Phase 3 (Month 2)
- Fine-grained permissions (e.g., events.edit.own vs events.edit.any)
- Permission groups/teams within organization
- Custom permission sets per organization
- Permission analytics dashboard
