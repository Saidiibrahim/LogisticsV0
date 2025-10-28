"use client"

import type { ReactNode } from "react"

import { useUser } from "@/hooks/use-user"
import type { Permission } from "@/lib/auth/permissions"

interface CanAccessProps {
  /** Permission required to render the children. */
  permission: Permission
  /** Content shown when the user holds the permission. */
  children: ReactNode
  /** Fallback rendered when the permission check fails. */
  fallback?: ReactNode
}

/**
 * Conditionally renders UI based on the active user's permission set.
 *
 * @example
 * ```tsx
 * <CanAccess permission="events.create">
 *   <Button>Create Event</Button>
 * </CanAccess>
 * ```
 */
export function CanAccess({
  permission,
  children,
  fallback = null,
}: CanAccessProps) {
  const { hasPermission } = useUser()

  if (!hasPermission(permission)) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
