"use client"

import { format } from "date-fns"
import { Calendar, Clock, FileText, MapPin, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
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
  isMatchEvent,
} from "@/lib/types/calendar"
import { cn } from "@/lib/utils"

interface MatchDetailsDialogProps {
  match: CalendarEvent | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function MatchDetailsDialog({
  match,
  open,
  onOpenChange,
}: MatchDetailsDialogProps) {
  if (!match) return null

  const typeColor = eventTypeColors[match.type]
  const statusStyle = eventStatusStyles[match.status]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <div className={cn("size-3 rounded-full", typeColor)} />
                <DialogTitle className="text-2xl">{match.title}</DialogTitle>
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
                {match.type}
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
                  {format(match.start, "EEEE, MMMM d, yyyy")}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Clock className="size-5 text-muted-foreground" />
              <div>
                <div className="font-medium">
                  {format(match.start, "h:mm a")} -{" "}
                  {format(match.end, "h:mm a")}
                </div>
                <div className="text-muted-foreground text-sm">
                  Duration:{" "}
                  {Math.round(
                    (match.end.getTime() - match.start.getTime()) / (1000 * 60)
                  )}{" "}
                  minutes
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          {match.location && (
            <>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 size-5 text-muted-foreground" />
                <div>
                  <div className="font-medium">Location</div>
                  <div className="text-muted-foreground text-sm">
                    {match.location}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Teams */}
          {isMatchEvent(match) && match.teams && (
            <>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 size-5 text-muted-foreground" />
                <div className="w-full">
                  <div className="font-medium">Teams</div>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="font-medium">Home</span>
                      <span className="text-muted-foreground">
                        {match.teams.home}
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-md border p-3">
                      <span className="font-medium">Away</span>
                      <span className="text-muted-foreground">
                        {match.teams.away}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          {match.notes && (
            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-5 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">Notes</div>
                <p className="mt-2 whitespace-pre-wrap text-muted-foreground text-sm">
                  {match.notes}
                </p>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
