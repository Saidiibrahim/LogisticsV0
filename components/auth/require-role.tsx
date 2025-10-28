"use client"

import type { ReactNode } from "react"

import { useUser } from "@/hooks/use-user"
import type { UserRole } from "@/lib/auth/permissions"

interface RequireRoleProps {
  /** Role or roles allowed to view the children. */
  roles: UserRole | UserRole[]
  /** Content rendered when the active role matches. */
  children: ReactNode
  /** Fallback rendered when the role check fails. */
  fallback?: ReactNode
}

/**
 * Gates UI behind explicit role checks. Prefer {@link CanAccess} for
 * fine-grained permission lookups and reserve this component for
 * exceptional, role-specific scenarios.
 *
 * @example
 * ```tsx
 * <RequireRole roles={['team-leader', 'admin']}>
 *   <ManagementDashboard />
 * </RequireRole>
 * ```
 */
export function RequireRole({
  roles,
  children,
  fallback = null,
}: RequireRoleProps) {
  const { role } = useUser()
  const allowedRoles = Array.isArray(roles) ? roles : [roles]

  if (!allowedRoles.includes(role)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
