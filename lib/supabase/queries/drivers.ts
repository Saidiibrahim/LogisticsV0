import type { SupabaseClient } from "@supabase/supabase-js"
import type { Driver } from "@/lib/types/roster"

type DriverRow = {
  id: string
  full_name: string | null
  email: string | null
  role: string | null
  avatar_url: string | null
  driver_color: string | null
  vehicle_id: string | null
  vehicles: {
    id: string | null
    registration_number: string | null
    make: string | null
    model: string | null
  } | null
}

/**
 * Fetch all active drivers from the users table.
 * Filters by role='driver' and is_active=true.
 */
export async function listActiveDrivers(
  client: SupabaseClient
): Promise<Driver[]> {
  const { data, error } = (await client
    .from("users")
    .select(
      "id, full_name, email, role, avatar_url, driver_color, vehicle_id, vehicles:vehicle_id(id, registration_number, make, model)"
    )
    .eq("role", "driver")
    .eq("is_active", true)) as { data: DriverRow[] | null; error: unknown }

  if (error) {
    console.error("[drivers] listActiveDrivers error", error)
    return []
  }

  return (data ?? []).map((row) => {
    const hasVehicleDetails = Boolean(
      row.vehicles?.make ||
        row.vehicles?.model ||
        row.vehicles?.registration_number
    )

    const vanDetails = hasVehicleDetails
      ? `${row.vehicles?.make ?? ""} ${row.vehicles?.model ?? ""} (${row.vehicles?.registration_number ?? ""})`.trim()
      : undefined

    return {
      id: row.id,
      name: row.full_name ?? "Unknown Driver",
      email: row.email ?? undefined,
      role: (row.role as Driver["role"]) ?? "driver",
      avatar: row.avatar_url ?? undefined,
      color: row.driver_color ?? undefined,
      vanId: row.vehicle_id ?? row.vehicles?.id ?? undefined,
      vanDetails,
    }
  })
}
