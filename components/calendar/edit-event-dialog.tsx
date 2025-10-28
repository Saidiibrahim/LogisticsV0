"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import { useActionState, useEffect, useId, useState } from "react"
import { updateCalendarEvent } from "@/app/(authenticated)/calendar/actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { createClient } from "@/lib/supabase/client"
import type { CalendarEvent } from "@/lib/types/calendar"

interface Driver {
  id: string
  full_name: string
  driver_color: string | null
}

/**
 * Dialog for editing an existing calendar event
 */
interface EditEventDialogProps {
  event: CalendarEvent
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Convert a Date into the ISO 8601 string format expected by
 * native `datetime-local` inputs.
 */
function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0")
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())]
    .join("-")
    .concat("T")
    .concat([pad(date.getHours()), pad(date.getMinutes())].join(":"))
}

export function EditEventDialog({
  event,
  open,
  onOpenChange,
}: EditEventDialogProps) {
  const titleId = useId()
  const eventTypeId = useId()
  const startTimeId = useId()
  const endTimeId = useId()
  const locationNameId = useId()
  const locationAddressId = useId()
  const descriptionId = useId()
  const priorityId = useId()
  const driverIdFieldId = useId()

  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loadingDrivers, setLoadingDrivers] = useState(true)

  const [state, formAction, isPending] = useActionState(
    updateCalendarEvent.bind(null, event.id),
    { error: undefined, success: undefined }
  )

  // Fetch available drivers
  useEffect(() => {
    async function fetchDrivers() {
      const supabase = createClient()
      const { data, error } = await supabase
        .from("users")
        .select("id, full_name, driver_color")
        .eq("role", "driver")
        .eq("is_active", true)
        .order("full_name")

      if (!error && data) {
        setDrivers(data)
      }
      setLoadingDrivers(false)
    }

    fetchDrivers()
  }, [])

  // Close dialog on success
  if (state.success) {
    setTimeout(() => onOpenChange(false), 100)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Event</DialogTitle>
          <DialogDescription>
            Update the details of this logistics event
          </DialogDescription>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          {state.error && (
            <Alert variant="destructive">
              <AlertCircle className="size-4" />
              <AlertDescription>{state.error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor={titleId}>
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id={titleId}
              name="title"
              placeholder="e.g., Downtown Depot Delivery"
              defaultValue={event.title}
              required
              disabled={isPending}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={eventTypeId}>
                Event Type <span className="text-destructive">*</span>
              </Label>
              <Select
                name="event_type"
                defaultValue={event.type}
                required
                disabled={isPending}
              >
                <SelectTrigger id={eventTypeId}>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="delivery">Delivery</SelectItem>
                  <SelectItem value="pickup">Pickup</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="collection">Collection</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor={priorityId}>Priority</Label>
              <Select
                name="priority"
                defaultValue={event.priority}
                disabled={isPending}
              >
                <SelectTrigger id={priorityId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={driverIdFieldId}>Assigned Driver</Label>
            <Select
              name="assigned_driver_id"
              defaultValue={event.assigned_driver_id || "unassigned"}
              disabled={isPending || loadingDrivers}
            >
              <SelectTrigger id={driverIdFieldId}>
                <SelectValue
                  placeholder={
                    loadingDrivers
                      ? "Loading drivers..."
                      : "Select a driver (optional)"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">Unassigned</SelectItem>
                {drivers.map((driver) => (
                  <SelectItem key={driver.id} value={driver.id}>
                    {driver.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={startTimeId}>
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id={startTimeId}
                name="start_time"
                type="datetime-local"
                defaultValue={formatDateTimeLocal(event.start_time)}
                required
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={endTimeId}>End Time</Label>
              <Input
                id={endTimeId}
                name="end_time"
                type="datetime-local"
                defaultValue={formatDateTimeLocal(event.end_time)}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={locationNameId}>Location Name</Label>
              <Input
                id={locationNameId}
                name="location_name"
                placeholder="e.g., Downtown Depot"
                defaultValue={event.location_name || ""}
                disabled={isPending}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={locationAddressId}>Location Address</Label>
              <Input
                id={locationAddressId}
                name="location_address"
                placeholder="e.g., 123 Main St"
                defaultValue={event.location_address || ""}
                disabled={isPending}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={descriptionId}>Description</Label>
            <Textarea
              id={descriptionId}
              name="description"
              placeholder="Any additional notes or special instructions..."
              defaultValue={event.description || ""}
              disabled={isPending}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Update Event
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
