"use client"

import { format } from "date-fns"
import {
  Calendar,
  Clock,
  Dumbbell,
  FileText,
  GraduationCap,
  Loader2,
  MapPin,
  Trash2,
  Trophy,
  User,
  Users,
} from "lucide-react"
import { useState, useTransition } from "react"
import { deleteEvent } from "@/app/(authenticated)/calendar/actions"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import {
  type CalendarEvent,
  eventStatusStyles,
  eventTypeColors,
  isCoachingEvent,
  isMatchEvent,
  isTrainingEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

/**
 * Props for the event details dialog that appears when the user drills into an
 * event from any calendar view.
 */
interface EventDetailsDialogProps {
  event: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * Drawer-style dialog that reveals the full context for a calendar event and
 * exposes event specific actions (currently deletion).
 */
export function EventDetailsDialog({
  event,
  open,
  onOpenChange,
}: EventDetailsDialogProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isPending, startTransition] = useTransition()

  if (!event) return null

  const typeColor = eventTypeColors[event.type]
  const statusStyle = eventStatusStyles[event.status]

  // Choose a contextual icon based on the event type so the dialog feels
  // consistent with the view cards
  const getTypeIcon = () => {
    if (isMatchEvent(event)) return <Trophy className="size-5" />
    if (isTrainingEvent(event)) return <Dumbbell className="size-5" />
    if (isCoachingEvent(event)) return <GraduationCap className="size-5" />
    return null
  }

  const handleDelete = () => {
    startTransition(async () => {
      // Map to the specific table record the event originated from
      let eventId = event.id
      if (isMatchEvent(event)) {
        eventId = event.scheduled_match_id || event.match_id || event.id
      } else if (isTrainingEvent(event)) {
        eventId = event.workout_session_id
      } else if (isCoachingEvent(event)) {
        eventId = event.coaching_session_id
      }

      const result = await deleteEvent(event.type, eventId)
      if (result.success) {
        setShowDeleteDialog(false)
        onOpenChange(false)
      }
    })
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={cn("size-3 rounded-full", typeColor)} />
                  <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Badge
                  variant="secondary"
                  className={cn("capitalize", statusStyle.className)}
                >
                  {statusStyle.label}
                </Badge>
                <Badge variant="outline" className="capitalize">
                  {getTypeIcon()}
                  <span className="ml-1">
                    {event.type === "match"
                      ? "Match"
                      : event.type === "training"
                        ? "Training"
                        : "Coaching"}
                  </span>
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Date and Time */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Calendar className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(event.start, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(event.start, "h:mm a")} -{" "}
                    {format(event.end, "h:mm a")}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Duration:{" "}
                    {Math.round(
                      (event.end.getTime() - event.start.getTime()) /
                        (1000 * 60)
                    )}{" "}
                    minutes
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            {event.location && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    <div className="text-muted-foreground text-sm">
                      {event.location}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Match-specific details */}
            {isMatchEvent(event) && (
              <>
                {event.teams && (
                  <>
                    <div className="flex items-start gap-3">
                      <Users className="mt-0.5 size-5 text-muted-foreground" />
                      <div className="w-full">
                        <div className="font-medium">Teams</div>
                        <div className="mt-2 space-y-2">
                          <div className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-medium">Home</span>
                            <span className="text-muted-foreground">
                              {event.teams.home}
                              {event.home_score !== undefined &&
                                ` (${event.home_score})`}
                            </span>
                          </div>
                          <div className="flex items-center justify-between rounded-md border p-3">
                            <span className="font-medium">Away</span>
                            <span className="text-muted-foreground">
                              {event.teams.away}
                              {event.away_score !== undefined &&
                                ` (${event.away_score})`}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
                {event.competition_name && (
                  <>
                    <div className="flex items-start gap-3">
                      <Trophy className="mt-0.5 size-5 text-muted-foreground" />
                      <div>
                        <div className="font-medium">Competition</div>
                        <div className="text-muted-foreground text-sm">
                          {event.competition_name}
                        </div>
                      </div>
                    </div>
                    <Separator />
                  </>
                )}
              </>
            )}

            {/* Training-specific details */}
            {isTrainingEvent(event) && (
              <>
                <div className="flex items-start gap-3">
                  <Dumbbell className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Training Type</div>
                    <div className="text-muted-foreground text-sm capitalize">
                      {event.trainingKind.replace(/([A-Z])/g, " $1").trim()}
                    </div>
                  </div>
                </div>
                {event.perceived_exertion && (
                  <div className="flex items-start gap-3">
                    <FileText className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Perceived Exertion</div>
                      <div className="text-muted-foreground text-sm">
                        {event.perceived_exertion}/10
                      </div>
                    </div>
                  </div>
                )}
                <Separator />
              </>
            )}

            {/* Coaching-specific details */}
            {isCoachingEvent(event) && (
              <>
                <div className="flex items-start gap-3">
                  <GraduationCap className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Session Type</div>
                    <div className="text-muted-foreground text-sm capitalize">
                      {event.sessionType.replace(/_/g, " ")}
                    </div>
                  </div>
                </div>
                {event.facilitator && (
                  <div className="flex items-start gap-3">
                    <User className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Facilitator</div>
                      <div className="text-muted-foreground text-sm">
                        {event.facilitator}
                      </div>
                    </div>
                  </div>
                )}
                {event.max_attendees && (
                  <div className="flex items-start gap-3">
                    <Users className="mt-0.5 size-5 text-muted-foreground" />
                    <div>
                      <div className="font-medium">Max Attendees</div>
                      <div className="text-muted-foreground text-sm">
                        {event.max_attendees}
                      </div>
                    </div>
                  </div>
                )}
                <Separator />
              </>
            )}

            {/* Notes (common to all events) */}
            {event.notes && (
              <>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Notes</div>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
                      {event.notes}
                    </p>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 size-4" />
                Delete Event
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &ldquo;{event.title}&rdquo;? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
