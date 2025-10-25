"use client"

import { AlertCircle, Loader2, Plus } from "lucide-react"
import { useActionState, useId, useMemo, useState } from "react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { createCalendarEvent } from "../actions"

// State shape shared across the action backed forms in this dialog
const initialState = { error: undefined, success: undefined }

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

/**
 * Optional configuration for the event creation dialog.
 */
interface CreateEventDialogProps {
  defaultDate?: Date
}

/**
 * Entry point for creating calendar events for logistics operations.
 */
export function CreateEventDialog({ defaultDate }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false)

  const minDateTime = useMemo(
    // Enforce a 15 minute buffer so newly created events always occur later
    () => formatDateTimeLocal(new Date(Date.now() + 15 * 60 * 1000)),
    []
  )

  const defaultDateTime = useMemo(() => {
    if (defaultDate) {
      const dateWithTime = new Date(defaultDate)
      dateWithTime.setHours(12, 0, 0, 0)
      return formatDateTimeLocal(dateWithTime)
    }
    return minDateTime
  }, [defaultDate, minDateTime])

  const handleClose = () => {
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="mr-2 size-4" />
          New Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create New Event</DialogTitle>
          <DialogDescription>
            Create a delivery, pickup, meeting, or other logistics event
          </DialogDescription>
        </DialogHeader>

        <EventForm
          defaultDateTime={defaultDateTime}
          minDateTime={minDateTime}
          onSuccess={handleClose}
        />
      </DialogContent>
    </Dialog>
  )
}

/**
 * Unified form for creating calendar events.
 */
function EventForm({
  defaultDateTime,
  minDateTime,
  onSuccess,
}: {
  defaultDateTime: string
  minDateTime: string
  onSuccess: () => void
}) {
  const titleId = useId()
  const eventTypeId = useId()
  const startTimeId = useId()
  const endTimeId = useId()
  const locationNameId = useId()
  const locationAddressId = useId()
  const descriptionId = useId()
  const priorityId = useId()

  const [state, formAction, isPending] = useActionState(
    createCalendarEvent,
    initialState
  )

  // Close dialog on success
  if (state.success) {
    setTimeout(onSuccess, 100)
  }

  return (
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
          required
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={eventTypeId}>
            Event Type <span className="text-destructive">*</span>
          </Label>
          <Select name="event_type" required disabled={isPending}>
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
          <Select name="priority" defaultValue="medium" disabled={isPending}>
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={startTimeId}>
            Start Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id={startTimeId}
            name="start_time"
            type="datetime-local"
            defaultValue={defaultDateTime}
            required
            min={minDateTime}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={endTimeId}>End Time</Label>
          <Input
            id={endTimeId}
            name="end_time"
            type="datetime-local"
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
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={locationAddressId}>Location Address</Label>
          <Input
            id={locationAddressId}
            name="location_address"
            placeholder="e.g., 123 Main St"
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
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Event
        </Button>
      </div>
    </form>
  )
}
