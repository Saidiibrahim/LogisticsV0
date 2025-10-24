import type { SupabaseClient } from "@supabase/supabase-js"
import type { Driver } from "@/lib/types/roster"

/**
 * Fetch all active drivers from the users table.
 * Filters by role='driver' and is_active=true.
 */
export async function listActiveDrivers(
  client: SupabaseClient
): Promise<Driver[]> {
  const { data, error } = await client
    .from("users")
    .select(
      "id, full_name, email, role, avatar_url, driver_color, vehicle_id, vehicles:vehicle_id(id, registration_number, make, model)"
    )
    .eq("role", "driver")
    .eq("is_active", true)

  if (error) {
    console.error("[drivers] listActiveDrivers error", error)
    return []
  }

  return (data || []).map((row: any) => ({
    id: row.id,
    name: row.full_name ?? "Unknown Driver",
    email: row.email ?? undefined,
    role: row.role ?? "driver",
    avatar: row.avatar_url ?? undefined,
    color: row.driver_color ?? undefined,
    vanId: row.vehicle_id ?? row?.vehicles?.id ?? undefined,
    vanDetails: row?.vehicles
      ? `${row.vehicles.make || ""} ${row.vehicles.model || ""} (${row.vehicles.registration_number || ""})`
        .trim()
      : undefined,
  }))
}


