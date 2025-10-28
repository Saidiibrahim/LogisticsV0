---
task_id: 02
plan_id: PLAN_permissions_system
plan_file: ../../plans/permissions_system/PLAN_permissions_system.md
title: Add role to session context
phase: Phase 2 - Context Enhancement
---

# Task 02: Add Role to Session Context

## Objective

Extend the existing session and user context to include the user's role and a `hasPermission()` helper function. This makes role-based UI rendering simple and efficient.

## Files to Modify

### 1. `lib/supabase/session.ts`

Add `role` to SessionClaims interface and fetch it in getSessionClaims:

```typescript
import type { UserRole } from '@/lib/auth/permissions'

export interface SessionClaims {
  userId: string
  email: string | null
  fullName: string | null
  organizationId: string
  role: UserRole  // ADD THIS
}

export const getSessionClaims = cache(
  async (): Promise<SessionClaims | null> => {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData } = await supabase
      .from('users')
      .select('organization_id, role, full_name')  // ADD 'role'
      .eq('id', user.id)
      .single()

    if (!userData) return null

    return {
      userId: user.id,
      email: user.email ?? null,
      fullName: userData.full_name,
      organizationId: userData.organization_id,
      role: userData.role as UserRole,  // ADD THIS
    }
  }
)
```

### 2. `components/layout/app-chrome.tsx`

Update UserContextValue and provide hasPermission helper:

```typescript
import { hasPermission as checkPermission, ROLE_PERMISSIONS, type UserRole, type Permission } from '@/lib/auth/permissions'

export interface UserContextValue {
  userId: string
  email: string | null
  fullName: string | null
  organizationId: string
  role: UserRole  // ADD THIS
  hasPermission: (permission: Permission) => boolean  // ADD THIS
}

// In the AppChrome component:
export function AppChrome({ session, children }: AppChromeProps) {
  // ... existing code ...

  // ADD THIS helper function
  const hasPermission = (permission: Permission): boolean => {
    return checkPermission(session.role, permission)
  }

  return (
    <UserContext.Provider
      value={{
        userId: session.userId,
        email: session.email,
        fullName: session.fullName,
        organizationId: session.organizationId,
        role: session.role,  // ADD THIS
        hasPermission,  // ADD THIS
      }}
    >
      {/* ... rest of component ... */}
    </UserContext.Provider>
  )
}
```

### 3. `app/(authenticated)/layout.tsx`

Update the AppChrome props to pass role (verify session typing):

```typescript
// Should already work if getSessionClaims returns the updated SessionClaims type
// Just verify the component compiles correctly

export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSessionClaims()

  if (!session) {
    redirect('/auth/login')
  }

  return (
    <AppChrome session={session}>  {/* session now includes role */}
      {children}
    </AppChrome>
  )
}
```

## Acceptance Criteria

- [ ] SessionClaims interface includes role field
- [ ] getSessionClaims() fetches role from database
- [ ] UserContextValue interface includes role and hasPermission
- [ ] AppChrome provides hasPermission helper in context
- [ ] useUser() hook returns role and hasPermission
- [ ] TypeScript compiles with no errors
- [ ] No lint errors
- [ ] Session caching still works (React cache())

## Testing

### Manual Test

1. Add temporary debug output to AppChrome:
```typescript
console.log('User role:', session.role)
console.log('Can create events:', hasPermission('events.create'))
```

2. Login as different users and verify console output:
   - `driver@example.com` - should show role: 'driver', can create: false
   - `team-leader@example.com` - should show role: 'team-leader', can create: true

3. Remove debug output after verification

### Component Test

Create a test component to verify hook works:
```typescript
'use client'

import { useUser } from '@/components/layout/app-chrome'

export function DebugRole() {
  const { role, hasPermission } = useUser()

  return (
    <div>
      <p>Role: {role}</p>
      <p>Can create events: {hasPermission('events.create').toString()}</p>
    </div>
  )
}
```

## Notes

- Session is cached per request using React cache()
- hasPermission checks are client-side only (UX layer)
- Server actions still need their own permission checks
- Role is fetched once when session loads, not on every permission check
