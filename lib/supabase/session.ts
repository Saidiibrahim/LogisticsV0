import { cache } from "react"

import { ROLE_PERMISSIONS, type UserRole } from "@/lib/auth/permissions"

import { createClient } from "./server"

export interface SessionClaims {
  userId: string
  email: string | null
  fullName: string | null
  organizationId: string
  role: UserRole
}

const VALID_ROLES: Set<UserRole> = new Set(
  Object.keys(ROLE_PERMISSIONS) as UserRole[]
)

function coerceRole(role: unknown): UserRole {
  if (typeof role === "string" && VALID_ROLES.has(role as UserRole)) {
    return role as UserRole
  }

  return "driver"
}

export const getSessionClaims = cache(
  async (): Promise<SessionClaims | null> => {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError) {
      console.error("[session] Failed to fetch auth user", authError)
    }

    if (!user) {
      return null
    }

    const { data, error } = await supabase
      .from("users")
      .select("organization_id, role, full_name")
      .eq("id", user.id)
      .single()

    if (error || !data) {
      if (error) {
        console.error("[session] Failed to fetch user profile", error)
      }
      return null
    }

    const role = coerceRole(data.role)

    return {
      userId: user.id,
      email: user.email ?? null,
      fullName: data.full_name ?? null,
      organizationId: data.organization_id,
      role,
    }
  }
)

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  return supabase.auth.getUser()
})
