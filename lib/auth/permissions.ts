/**
 * Centralized permission mapping used across the app layer.
 * These utilities keep the UX aligned with the enforced RLS policies.
 */
export type UserRole =
  | "driver"
  | "team-leader"
  | "customer-support"
  | "retail-officer"
  | "admin"

export type Permission =
  // Calendar Events
  | "events.create"
  | "events.edit.own"
  | "events.edit.any"
  | "events.delete"
  | "events.status.update.own"
  | "events.status.update.any"
  | "events.view"
  // Rosters
  | "rosters.create"
  | "rosters.publish"
  | "rosters.edit"
  | "rosters.view"
  // Routes
  | "routes.create"
  | "routes.optimize"
  | "routes.assign"
  | "routes.view"
  // Deliveries
  | "deliveries.create"
  | "deliveries.update.own"
  | "deliveries.update.any"
  | "deliveries.complete"
  | "deliveries.view"
  // Users & Admin
  | "users.manage"
  | "organizations.manage"

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  driver: [
    "events.view",
    "events.status.update.own",
    "rosters.view",
    "routes.view",
    "deliveries.update.own",
    "deliveries.complete",
    "deliveries.view",
  ],
  "team-leader": [
    "events.create",
    "events.edit.any",
    "events.delete",
    "events.status.update.any",
    "events.view",
    "rosters.create",
    "rosters.publish",
    "rosters.edit",
    "rosters.view",
    "routes.create",
    "routes.optimize",
    "routes.assign",
    "routes.view",
    "deliveries.create",
    "deliveries.update.any",
    "deliveries.complete",
    "deliveries.view",
  ],
  "customer-support": [
    "events.view",
    "rosters.view",
    "routes.view",
    "deliveries.view",
  ],
  "retail-officer": [
    "events.create",
    "events.view",
    "rosters.view",
    "routes.view",
    "deliveries.create",
    "deliveries.view",
  ],
  admin: [
    "events.create",
    "events.edit.any",
    "events.delete",
    "events.status.update.any",
    "events.view",
    "rosters.create",
    "rosters.publish",
    "rosters.edit",
    "rosters.view",
    "routes.create",
    "routes.optimize",
    "routes.assign",
    "routes.view",
    "deliveries.create",
    "deliveries.update.any",
    "deliveries.complete",
    "deliveries.view",
    "users.manage",
    "organizations.manage",
  ],
}

export function hasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.includes(permission) ?? false
}

export function requirePermission(
  role: UserRole | null | undefined,
  permission: Permission
): { allowed: boolean; error?: string } {
  if (!role) {
    return { allowed: false, error: "Not authenticated" }
  }

  if (!hasPermission(role, permission)) {
    return {
      allowed: false,
      error: `Your role (${formatRole(role)}) doesn't have permission to perform this action`,
    }
  }

  return { allowed: true }
}

export function formatRole(role: UserRole): string {
  const roleLabels: Record<UserRole, string> = {
    driver: "Driver",
    "team-leader": "Team Leader",
    "customer-support": "Customer Support",
    "retail-officer": "Retail Officer",
    admin: "Administrator",
  }

  return roleLabels[role] ?? role
}
