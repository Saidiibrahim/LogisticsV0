"use client"

import { format } from "date-fns"
import {
  AlertCircle,
  Calendar,
  CheckCircle2,
  Clock,
  Edit,
  FileText,
  Loader2,
  MapPin,
  Trash2,
  Trophy,
  User,
  Users,
  XCircle,
} from "lucide-react"
import { useId, useState, useTransition } from "react"
import {
  deleteEvent,
  updateEventStatus,
} from "@/app/(authenticated)/calendar/actions"
import { CanAccess } from "@/components/auth"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { StatusBadge } from "@/components/ui/status-badge"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/hooks/use-user"
import {
  type CalendarEvent,
  type EventResolutionType,
  type EventStatus,
  eventTypeColors,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"
import { EditEventDialog } from "./edit-event-dialog"

const STATUS_LABELS: Record<EventStatus, string> = {
  scheduled: "Scheduled",
  "in-progress": "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
}

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
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [showResolutionDialog, setShowResolutionDialog] = useState(false)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [updatingStatus, setUpdatingStatus] = useState<EventStatus | null>(null)
  const [pendingStatus, setPendingStatus] = useState<EventStatus | null>(null)
  const [resolutionType, setResolutionType] =
    useState<EventResolutionType>("done")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [isPending, startTransition] = useTransition()
  const resolutionBaseId = useId()
  const resolutionTypeId = `${resolutionBaseId}-type`
  const resolutionNotesId = `${resolutionBaseId}-notes`
  const { toast } = useToast()
  const { userId, hasPermission } = useUser()

  if (!event) return null

  const typeColor = eventTypeColors[event.type]
  const canManageAnyStatus = hasPermission("events.status.update.any")
  const canManageOwnStatus =
    hasPermission("events.status.update.own") &&
    event.assigned_driver_id === userId
  const showStatusControls = canManageAnyStatus || canManageOwnStatus
  const isTerminalStatus =
    event.status === "completed" || event.status === "cancelled"
  const canUpdateStatus = showStatusControls && !isTerminalStatus
  const canEditEvent = hasPermission("events.edit.any")
  const canDeleteEvent = hasPermission("events.delete")

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

  const resetResolutionState = () => {
    setShowResolutionDialog(false)
    setPendingStatus(null)
    setResolutionNotes("")
    setResolutionType("done")
  }

  const handleStatusUpdate = async (newStatus: EventStatus) => {
    if (isUpdatingStatus) return

    const isTerminalTarget =
      newStatus === "completed" || newStatus === "cancelled"

    if (isTerminalTarget) {
      setPendingStatus(newStatus)
      setResolutionType(newStatus === "completed" ? "done" : "wont_do")
      setResolutionNotes("")
      setShowResolutionDialog(true)
      return
    }

    setIsUpdatingStatus(true)
    setUpdatingStatus(newStatus)
    try {
      const result = await updateEventStatus(event.id, newStatus)
      if (result.success) {
        toast({
          title: "Status updated",
          description: `Event marked as ${STATUS_LABELS[newStatus].toLowerCase()}.`,
        })
      } else if (result.error) {
        toast({
          title: "Unable to update status",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[calendar] Unexpected status update error:", error)
      toast({
        title: "Unexpected error",
        description: "Something went wrong while updating the status.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
      setUpdatingStatus(null)
    }
  }

  const handleResolutionConfirm = async () => {
    if (!pendingStatus) {
      return
    }

    setIsUpdatingStatus(true)
    setUpdatingStatus(pendingStatus)

    try {
      const result = await updateEventStatus(event.id, pendingStatus, {
        resolutionType,
        resolutionNotes: resolutionNotes.trim() || undefined,
      })

      if (result.success) {
        toast({
          title: "Status updated",
          description: `Event marked as ${STATUS_LABELS[
            pendingStatus
          ].toLowerCase()}.`,
        })
        resetResolutionState()
      } else if (result.error) {
        toast({
          title: "Unable to update status",
          description: result.error,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[calendar] Unexpected resolution error:", error)
      toast({
        title: "Unexpected error",
        description: "Something went wrong while capturing the resolution.",
        variant: "destructive",
      })
    } finally {
      setIsUpdatingStatus(false)
      setUpdatingStatus(null)
    }
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
              <div className="flex flex-col items-end gap-2">
                <StatusBadge status={event.status} />
                <Badge variant="outline" className="capitalize">
                  {getTypeIcon()}
                  <span className="ml-1">{event.type.replace("-", " ")}</span>
                </Badge>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Quick Status Change */}
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-muted-foreground text-sm">
                  Quick Status:
                </span>
                <StatusBadge status={event.status} />
              </div>
              {canUpdateStatus ? (
                <div className="flex flex-wrap gap-2">
                  {event.status !== "scheduled" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("scheduled")}
                      className="border-blue-200 text-blue-700 hover:bg-blue-50"
                    >
                      {isUpdatingStatus && updatingStatus === "scheduled" ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <Clock className="mr-2 size-4" />
                      )}
                      {isUpdatingStatus && updatingStatus === "scheduled"
                        ? "Updating..."
                        : "Reset to Scheduled"}
                    </Button>
                  )}

                  {event.status !== "in-progress" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={isUpdatingStatus}
                      onClick={() => handleStatusUpdate("in-progress")}
                      className="border-yellow-200 text-yellow-700 hover:bg-yellow-50"
                    >
                      {isUpdatingStatus && updatingStatus === "in-progress" ? (
                        <Loader2 className="mr-2 size-4 animate-spin" />
                      ) : (
                        <AlertCircle className="mr-2 size-4" />
                      )}
                      {isUpdatingStatus && updatingStatus === "in-progress"
                        ? "Updating..."
                        : "Start Progress"}
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusUpdate("cancelled")}
                    className="border-red-200 text-red-600 hover:bg-red-50"
                  >
                    {isUpdatingStatus && updatingStatus === "cancelled" ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <XCircle className="mr-2 size-4" />
                    )}
                    {isUpdatingStatus && updatingStatus === "cancelled"
                      ? "Updating..."
                      : "Cancel"}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    disabled={isUpdatingStatus}
                    onClick={() => handleStatusUpdate("completed")}
                    className="border-green-200 text-green-600 hover:bg-green-50"
                  >
                    {isUpdatingStatus && updatingStatus === "completed" ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 size-4" />
                    )}
                    {isUpdatingStatus && updatingStatus === "completed"
                      ? "Updating..."
                      : "Mark as Resolved"}
                  </Button>
                </div>
              ) : (
                <span className="text-xs text-muted-foreground">
                  {isTerminalStatus
                    ? "Status updates are disabled because this event is already resolved."
                    : "View only"}
                </span>
              )}
            </div>

            <Separator />
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
                        <Badge
                          key={tag}
                          variant="secondary"
                          className="text-xs"
                        >
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
            {(canEditEvent || canDeleteEvent) && (
              <div className="flex justify-end gap-2">
                <CanAccess permission="events.edit.any">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowEditDialog(true)
                      onOpenChange(false)
                    }}
                  >
                    <Edit className="mr-2 size-4" />
                    Edit Event
                  </Button>
                </CanAccess>

                <CanAccess permission="events.delete">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="mr-2 size-4" />
                    Delete Event
                  </Button>
                </CanAccess>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={showResolutionDialog}
        onOpenChange={(open) => {
          setShowResolutionDialog(open)
          if (!open) {
            resetResolutionState()
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingStatus === "cancelled" ? "Cancel Event" : "Resolve Event"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide details about this update so the team has the full
              context.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor={resolutionTypeId}>
                Resolution Type
              </label>
              <Select
                value={resolutionType}
                onValueChange={(value) =>
                  setResolutionType(value as EventResolutionType)
                }
              >
                <SelectTrigger id={resolutionTypeId}>
                  <SelectValue placeholder="Select a resolution" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="done">
                    Done — Completed successfully
                  </SelectItem>
                  <SelectItem value="wont_do">
                    Won&apos;t do — Cannot complete
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label
                className="text-sm font-medium"
                htmlFor={resolutionNotesId}
              >
                Notes (Optional)
              </label>
              <Textarea
                id={resolutionNotesId}
                placeholder="Add any additional details for dispatch..."
                value={resolutionNotes}
                onChange={(event) => setResolutionNotes(event.target.value)}
                className="min-h-[96px]"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={resetResolutionState}
              disabled={isUpdatingStatus}
            >
              Never mind
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResolutionConfirm}
              disabled={isUpdatingStatus}
              className="min-w-[120px]"
            >
              {isUpdatingStatus && pendingStatus ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Confirm"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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

      <EditEventDialog
        event={event}
        open={showEditDialog}
        onOpenChange={(open) => {
          setShowEditDialog(open)
          if (!open) {
            // Re-open the details dialog when edit dialog closes
            onOpenChange(true)
          }
        }}
      />
    </>
  )
}
