"use client"

import { format } from "date-fns"
import {
  Calendar,
  Clock,
  FileText,
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

  // Choose a contextual icon based on the event type
  const getTypeIcon = () => {
    switch (event.type) {
      case "delivery":
      case "pickup":
        return <Trophy className="size-5" />
      case "meeting":
        return <Users className="size-5" />
      case "maintenance":
        return <FileText className="size-5" />
      case "break":
        return <Clock className="size-5" />
      case "collection":
      case "retail":
        return <MapPin className="size-5" />
      default:
        return null
    }
  }

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteEvent(event.id)
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
                    {event.type.replace("-", " ")}
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
                    {format(event.start_time, "EEEE, MMMM d, yyyy")}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">
                    {format(event.start_time, "h:mm a")} -{" "}
                    {format(event.end_time, "h:mm a")}
                  </div>
                  <div className="text-muted-foreground text-sm">
                    Duration:{" "}
                    {Math.round(
                      (event.end_time.getTime() - event.start_time.getTime()) /
                        (1000 * 60)
                    )}{" "}
                    minutes
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Location */}
            {(event.location_name || event.location_address) && (
              <>
                <div className="flex items-start gap-3">
                  <MapPin className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Location</div>
                    {event.location_name && (
                      <div className="font-medium text-sm">
                        {event.location_name}
                      </div>
                    )}
                    {event.location_address && (
                      <div className="text-muted-foreground text-sm">
                        {event.location_address}
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Driver */}
            {event.driver_name && (
              <>
                <div className="flex items-start gap-3">
                  <User className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Assigned Driver</div>
                    <div className="text-muted-foreground text-sm">
                      {event.driver_name}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Order Information */}
            {(event.order_type || event.order_number) && (
              <>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Order Information</div>
                    {event.order_type && (
                      <div className="text-sm capitalize">
                        Type: {event.order_type.replace(/_/g, " ")}
                      </div>
                    )}
                    {event.order_number && (
                      <div className="text-muted-foreground text-sm">
                        Order #: {event.order_number}
                      </div>
                    )}
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-5 text-muted-foreground" />
                  <div>
                    <div className="font-medium">Tags</div>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {event.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                <Separator />
              </>
            )}

            {/* Description */}
            {event.description && (
              <>
                <div className="flex items-start gap-3">
                  <FileText className="mt-0.5 size-5 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="font-medium">Description</div>
                    <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
                      {event.description}
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
