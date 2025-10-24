import { fetchAllCalendarEvents } from "@/lib/data/calendar-events"
import { CalendarClient } from "./_components/calendar-client"

/**
 * Server-rendered calendar route that preloads the user's events so the CSR
 * experience can bootstrap instantly with real data.
 */
export default async function CalendarPage() {
  // Fetch all calendar events from the database prior to rendering
  const events = await fetchAllCalendarEvents()

  return <CalendarClient initialEvents={events} />
}
