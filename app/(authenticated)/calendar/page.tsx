export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import { CalendarClient } from "./_components/calendar-client"
import type { CalendarEvent } from "@/lib/types/calendar"
import { format } from "date-fns"

/**
 * Fetch calendar events from the database for the authenticated user's organization
 */
async function getCalendarEvents(): Promise<CalendarEvent[]> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return []
  }

  // Get user's organization
  const { data: userData } = await supabase
    .from("users")
    .select("organization_id")
    .eq("id", user.id)
    .single()

  if (!userData?.organization_id) {
    return []
  }

  // Fetch calendar events for this organization
  const { data: events, error } = await supabase
    .from("calendar_events")
    .select(
      `
      id,
      title,
      description,
      event_type,
      status,
      priority,
      start_time,
      end_time,
      day_date,
      sequence_number,
      location_name,
      location_address,
      location_coordinates,
      site_id,
      delivery_id,
      assigned_driver_id,
      tags,
      custom_fields,
      order_type,
      order_number,
      created_at,
      created_by,
      organization_id
    `
    )
    .eq("organization_id", userData.organization_id)
    .order("day_date", { ascending: true })
    .order("sequence_number", { ascending: true })

  if (error) {
    console.error("[calendar] Error fetching events:", error)
    return []
  }

  // TODO: Map roster events to proper CalendarEvent (ShiftEvent) type
  // For now, return empty array until proper shift event mapping is implemented
  return []
}

/**
 * Calendar page - Server component that fetches events and renders the calendar UI
 */
export default async function CalendarPage() {
  const events = await getCalendarEvents()

  return <CalendarClient initialEvents={events} />
}
