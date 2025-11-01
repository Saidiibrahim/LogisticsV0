export const dynamic = "force-dynamic"

import { createClient } from "@/lib/supabase/server"
import type { CalendarEvent } from "@/lib/types/calendar"
import { CalendarClient } from "./_components/calendar-client"

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

  // Fetch calendar events for this organization with driver names
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
      organization_id,
      resolution_type,
      resolution_notes,
      resolved_at,
      driver:assigned_driver_id(full_name)
    `
    )
    .eq("organization_id", userData.organization_id)
    .order("day_date", { ascending: true })
    .order("sequence_number", { ascending: true })

  if (error) {
    console.error("[calendar] Error fetching events:", error)
    return []
  }

  if (!events || events.length === 0) {
    return []
  }

  // Map database events to CalendarEvent type and filter out invalid events
  const mappedEvents: CalendarEvent[] = events
    .filter((event) => {
      // Filter out events with missing critical data
      return event.start_time && event.end_time && event.day_date
    })
    .map((event) => {
      // Extract driver name from joined data
      const driverName =
        event.driver &&
        typeof event.driver === "object" &&
        "full_name" in event.driver
          ? (event.driver as { full_name: string }).full_name
          : undefined

      return {
        id: event.id,
        type: event.event_type as CalendarEvent["type"],
        title: event.title,
        description: event.description || undefined,
        start_time: new Date(event.start_time),
        end_time: new Date(event.end_time),
        status: event.status as CalendarEvent["status"],
        priority: event.priority as CalendarEvent["priority"],
        assigned_driver_id: event.assigned_driver_id || undefined,
        driver_name: driverName,
        location_name: event.location_name || undefined,
        location_address: event.location_address || undefined,
        location_coordinates: event.location_coordinates
          ? (event.location_coordinates as { lat: number; lng: number })
          : undefined,
        site_id: event.site_id || undefined,
        delivery_id: event.delivery_id || undefined,
        order_type: event.order_type
          ? (event.order_type as CalendarEvent["order_type"])
          : undefined,
        order_number: event.order_number || undefined,
        day_date: new Date(event.day_date),
        sequence_number: event.sequence_number,
        tags: event.tags || undefined,
        custom_fields: event.custom_fields
          ? (event.custom_fields as Record<string, unknown>)
          : undefined,
        organization_id: event.organization_id,
        created_by: event.created_by,
        created_at: new Date(event.created_at),
        updated_at: new Date(event.created_at), // Use created_at as fallback since updated_at isn't in SELECT
        resolution_type: event.resolution_type ?? undefined,
        resolution_notes: event.resolution_notes ?? null,
        resolved_at: event.resolved_at ? new Date(event.resolved_at) : null,
      }
    })

  return mappedEvents
}

/**
 * Calendar page - Server component that fetches events and renders the calendar UI
 */
export default async function CalendarPage() {
  const events = await getCalendarEvents()

  return <CalendarClient initialEvents={events} />
}
