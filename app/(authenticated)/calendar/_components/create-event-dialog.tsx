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
import {
  createCoachingSession,
  createScheduledMatchFromCalendar,
  createTrainingSession,
} from "../actions"

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
 * High level entry point for creating calendar events. The dialog walks the
 * user through selecting an event type and delegates to the relevant form.
 */
export function CreateEventDialog({ defaultDate }: CreateEventDialogProps) {
  const [open, setOpen] = useState(false)
  const [eventType, setEventType] = useState<
    "match" | "training" | "coaching" | null
  >(null)

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
    setEventType(null)
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
            Select the type of event you want to create
          </DialogDescription>
        </DialogHeader>

        {!eventType ? (
          <div className="grid gap-4 py-4">
            <Button
              variant="outline"
              className="h-20 justify-start"
              onClick={() => setEventType("match")}
            >
              <div className="text-left">
                <div className="font-semibold">Match</div>
                <div className="text-muted-foreground text-sm">
                  Schedule a new match assignment
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 justify-start"
              onClick={() => setEventType("training")}
            >
              <div className="text-left">
                <div className="font-semibold">Training Session</div>
                <div className="text-muted-foreground text-sm">
                  Plan a training or workout session
                </div>
              </div>
            </Button>
            <Button
              variant="outline"
              className="h-20 justify-start"
              onClick={() => setEventType("coaching")}
            >
              <div className="text-left">
                <div className="font-semibold">Coaching Session</div>
                <div className="text-muted-foreground text-sm">
                  Create a coaching or educational session
                </div>
              </div>
            </Button>
          </div>
        ) : eventType === "match" ? (
          <MatchForm
            defaultDateTime={defaultDateTime}
            minDateTime={minDateTime}
            onSuccess={handleClose}
          />
        ) : eventType === "training" ? (
          <TrainingForm
            defaultDateTime={defaultDateTime}
            minDateTime={minDateTime}
            onSuccess={handleClose}
          />
        ) : (
          <CoachingForm
            defaultDateTime={defaultDateTime}
            minDateTime={minDateTime}
            onSuccess={handleClose}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

/**
 * Form used when creating a new scheduled match directly from the calendar.
 * Submits via a server action so we can immediately revalidate the calendar.
 */
function MatchForm({
  defaultDateTime,
  minDateTime,
  onSuccess,
}: {
  defaultDateTime: string
  minDateTime: string
  onSuccess: () => void
}) {
  const homeTeamId = useId()
  const awayTeamId = useId()
  const kickoffId = useId()
  const competitionId = useId()
  const venueId = useId()
  const notesId = useId()

  const [state, formAction, isPending] = useActionState(
    createScheduledMatchFromCalendar,
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

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={homeTeamId}>
            Home Team <span className="text-destructive">*</span>
          </Label>
          <Input
            id={homeTeamId}
            name="home_team_name"
            placeholder="Home team name"
            required
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={awayTeamId}>
            Away Team <span className="text-destructive">*</span>
          </Label>
          <Input
            id={awayTeamId}
            name="away_team_name"
            placeholder="Away team name"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={kickoffId}>
          Kickoff Time <span className="text-destructive">*</span>
        </Label>
        <Input
          id={kickoffId}
          name="kickoff_at"
          type="datetime-local"
          defaultValue={defaultDateTime}
          required
          min={minDateTime}
          disabled={isPending}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={competitionId}>Competition</Label>
          <Input
            id={competitionId}
            name="competition_name"
            placeholder="e.g., Premier League"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={venueId}>Venue</Label>
          <Input
            id={venueId}
            name="venue_name"
            placeholder="e.g., Old Trafford"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          name="notes"
          placeholder="Any additional notes..."
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Match
        </Button>
      </div>
    </form>
  )
}

/**
 * Form for logging a planned training session. Captures the workout metadata
 * expected by the `workout_sessions` table.
 */
function TrainingForm({
  defaultDateTime,
  minDateTime,
  onSuccess,
}: {
  defaultDateTime: string
  minDateTime: string
  onSuccess: () => void
}) {
  const titleId = useId()
  const startTimeId = useId()
  const endTimeId = useId()
  const notesId = useId()

  const [state, formAction, isPending] = useActionState(
    createTrainingSession,
    initialState
  )

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
          placeholder="e.g., Sprint Training"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="kind">
          Training Type <span className="text-destructive">*</span>
        </Label>
        <Select name="kind" required disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="driverTraining">Driver Training</SelectItem>
            <SelectItem value="strength">Strength Training</SelectItem>
            <SelectItem value="mobility">Mobility</SelectItem>
            <SelectItem value="outdoorRun">Outdoor Run</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
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

      <div className="space-y-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          name="notes"
          placeholder="Any additional notes..."
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Training Session
        </Button>
      </div>
    </form>
  )
}

/**
 * Form for scheduling a coaching or educational session. Persists entries into
 * the `coaching_sessions` table.
 */
function CoachingForm({
  defaultDateTime,
  minDateTime,
  onSuccess,
}: {
  defaultDateTime: string
  minDateTime: string
  onSuccess: () => void
}) {
  const titleId = useId()
  const startTimeId = useId()
  const endTimeId = useId()
  const locationId = useId()
  const facilitatorId = useId()
  const maxAttendeesId = useId()
  const notesId = useId()

  const [state, formAction, isPending] = useActionState(
    createCoachingSession,
    initialState
  )

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
          placeholder="e.g., VAR Decision Making"
          required
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="session_type">
          Session Type <span className="text-destructive">*</span>
        </Label>
        <Select name="session_type" required disabled={isPending}>
          <SelectTrigger>
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="video_review">Video Review</SelectItem>
            <SelectItem value="presentation">Presentation</SelectItem>
            <SelectItem value="discussion">Discussion</SelectItem>
            <SelectItem value="workshop">Workshop</SelectItem>
            <SelectItem value="other">Other</SelectItem>
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
            defaultValue={defaultDateTime}
            required
            min={minDateTime}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={endTimeId}>
            End Time <span className="text-destructive">*</span>
          </Label>
          <Input
            id={endTimeId}
            name="end_time"
            type="datetime-local"
            required
            disabled={isPending}
          />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor={locationId}>Location</Label>
          <Input
            id={locationId}
            name="location"
            placeholder="e.g., Conference Room A"
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor={facilitatorId}>Facilitator</Label>
          <Input
            id={facilitatorId}
            name="facilitator"
            placeholder="e.g., John Smith"
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={maxAttendeesId}>Max Attendees</Label>
        <Input
          id={maxAttendeesId}
          name="max_attendees"
          type="number"
          min="1"
          placeholder="e.g., 20"
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor={notesId}>Notes</Label>
        <Textarea
          id={notesId}
          name="notes"
          placeholder="Any additional notes..."
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Create Coaching Session
        </Button>
      </div>
    </form>
  )
}
