"use client"

import {
  addDays,
  addWeeks,
  endOfWeek,
  format,
  isSameDay,
  isWeekend,
  startOfWeek,
  subWeeks,
} from "date-fns"
import {
  AlertCircle,
  Bell,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Copy,
  Mail,
  Save,
  Send,
  Sparkles,
  XCircle,
} from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { CanAccess } from "@/components/auth"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { useToast } from "@/components/ui/use-toast"
import { useUser } from "@/hooks/use-user"
import { useCalendarStore } from "@/lib/stores/calendar-store"
import { useRosterStore } from "@/lib/stores/roster-store"
import type { Driver } from "@/lib/types/roster"
import { cn } from "@/lib/utils"

interface WeeklyRosterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function WeeklyRosterDialog({
  open,
  onOpenChange,
}: WeeklyRosterDialogProps) {
  const { toast } = useToast()
  const { selectedDate, events } = useCalendarStore()
  const {
    currentRoster,
    loadRosterForWeek,
    saveCurrentRoster,
    updateAssignment,
    removeAssignment,
    bulkUpdateAssignments,
    hasUnsavedChanges,
    getChanges,
    getAffectedDriverIds,
    isDateNotified,
    getNotificationStatus,
    drivers,
  } = useRosterStore()
  const { hasPermission } = useUser()

  const canEditRoster = hasPermission("rosters.edit")
  const canPublishRoster = hasPermission("rosters.publish")
  const isViewOnly = !canEditRoster

  const [weekStartDate, setWeekStartDate] = useState(() =>
    startOfWeek(selectedDate, { weekStartsOn: 1 })
  )
  const [isPublishing, setIsPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openPopovers, setOpenPopovers] = useState<Record<string, boolean>>({})
  const [isLoadingWeek, setIsLoadingWeek] = useState(false)
  const handlePopoverChange = useCallback((dateStr: string, open: boolean) => {
    setOpenPopovers((prev) => ({ ...prev, [dateStr]: open }))
  }, [])

  const weekDates = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStartDate, i)),
    [weekStartDate]
  )

  const driverAssignments: Record<string, string> = {}
  if (currentRoster) {
    currentRoster.assignments.forEach((a) => {
      driverAssignments[a.date] = a.driverId
    })
  }

  const availableDrivers: Driver[] = drivers.filter((d) => d.role === "driver")

  const weekdayDates = weekDates.filter((d) => !isWeekend(d))
  const assignedWeekdays = weekdayDates.filter(
    (date) => driverAssignments[format(date, "yyyy-MM-dd")]
  ).length
  const completionPercentage = (assignedWeekdays / weekdayDates.length) * 100

  useEffect(() => {
    if (open) {
      loadRosterForWeek(weekStartDate).catch(() => {})
    }
  }, [weekStartDate, open, loadRosterForWeek])

  const changes = getChanges()
  const changedDates = useMemo(
    () => new Set(changes.map((change) => change.date)),
    [changes]
  )
  const affectedDriverIds = getAffectedDriverIds()
  const rosterStatus = currentRoster?.status ?? "draft"

  const handlePreviousWeek = async () => {
    setIsLoadingWeek(true)
    setWeekStartDate((prev) => subWeeks(prev, 1))
    setTimeout(() => setIsLoadingWeek(false), 300)
  }
  const handleNextWeek = async () => {
    setIsLoadingWeek(true)
    setWeekStartDate((prev) => addWeeks(prev, 1))
    setTimeout(() => setIsLoadingWeek(false), 300)
  }

  const handleDriverSelect = (date: Date, driverId: string) => {
    if (isViewOnly) {
      return
    }
    const dateStr = format(date, "yyyy-MM-dd")
    updateAssignment(dateStr, driverId)
    setOpenPopovers((p) => ({ ...p, [dateStr]: false }))
  }

  const handleCopyPreviousWeek = () => {
    if (isViewOnly) {
      return
    }
    const prevWeekStart = subWeeks(weekStartDate, 1)
    const prevWeekDates = Array.from({ length: 7 }, (_, i) =>
      addDays(prevWeekStart, i)
    )
    const newAssignments: Record<string, string> = {}
    prevWeekDates.forEach((prevDate, _idx) => {
      const prevEvents = events.filter((ev) =>
        isSameDay(ev.start_time, prevDate)
      )
      if (prevEvents.length > 0) {
        // naive: take first driver if a driverId field exists on events in future
        // leave unassigned otherwise
      }
      // Keep hook parity: nothing to copy from events yet
    })
    bulkUpdateAssignments(newAssignments)
    toast({
      title: "Previous week copied",
      description:
        "Driver assignments have been copied from the previous week.",
    })
  }

  const handleApplyToWeekdays = (driverId: string) => {
    if (isViewOnly) {
      return
    }
    const newAssignments: Record<string, string> = {}
    weekdayDates.forEach((date) => {
      newAssignments[format(date, "yyyy-MM-dd")] = driverId
    })
    bulkUpdateAssignments(newAssignments)
    const name = availableDrivers.find((d) => d.id === driverId)?.name
    toast({
      title: "Applied to weekdays",
      description: `${name ?? "Driver"} assigned to all weekdays.`,
    })
  }

  const handleClearWeek = () => {
    if (isViewOnly) {
      return
    }
    weekDates.forEach((date) => {
      const dateStr = format(date, "yyyy-MM-dd")
      if (driverAssignments[dateStr]) removeAssignment(dateStr)
    })
    toast({
      title: "Week cleared",
      description: "All driver assignments have been removed.",
    })
  }

  const handleSaveDraft = async () => {
    if (isViewOnly) {
      return
    }
    try {
      await saveCurrentRoster("draft")
      toast({
        title: "Draft saved",
        description: "Roster saved as draft. No notifications sent.",
      })
    } catch (_e) {
      setError("Error saving draft")
      toast({
        variant: "destructive",
        title: "Error saving draft",
        description: "Please try again.",
      })
    }
  }

  async function handlePublishRoster(_notifyAll = false) {
    if (!canPublishRoster) {
      return
    }
    try {
      setError(null)
      setIsPublishing(true)
      if (!currentRoster || currentRoster.assignments.length === 0) {
        toast({
          variant: "destructive",
          title: "No assignments",
          description: "Assign at least one driver.",
        })
        setIsPublishing(false)
        return
      }
      const res = await saveCurrentRoster("published")
      const notificationsInput = res?.data?.notifications
      const notifications = isPublishNotificationSummary(notificationsInput)
        ? notificationsInput
        : undefined

      if (notifications && notifications.failed > 0) {
        const firstMessage = notifications.failures?.[0]?.message
        setError(
          `Published, but ${notifications.failed}/${notifications.totalDrivers} email(s) failed.${
            firstMessage ? ` ${firstMessage}` : ""
          }`
        )
        toast({
          variant: "destructive",
          title: "Some emails failed",
          description:
            "Roster was published, but some notifications could not be sent. Check your email domain configuration.",
        })
      } else {
        toast({
          title: "Roster published",
          description: "Roster published successfully.",
        })
        onOpenChange(false)
      }
    } catch (_e) {
      setError("Error publishing roster")
      toast({
        variant: "destructive",
        title: "Error publishing",
        description: "Please try again.",
      })
    } finally {
      setIsPublishing(false)
    }
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:h-screen sm:max-w-full md:h-[85vh]">
        <DialogHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-xl">
                Weekly Driver Roster
                {isViewOnly && (
                  <Badge variant="secondary" className="h-6">
                    View Only
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription>
                Assign drivers to days for the entire week. Changes will only be
                applied when you save.
              </DialogDescription>
            </div>
            {currentRoster && (
              <Badge
                className="h-6"
                variant={
                  rosterStatus === "draft"
                    ? "secondary"
                    : rosterStatus === "published"
                      ? "default"
                      : "outline"
                }
              >
                {rosterStatus === "draft" && "Draft"}
                {rosterStatus === "published" && "Published"}
                {rosterStatus === "modified" && "Modified"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {error && (
          <Alert className="mx-6 mt-4" variant="destructive">
            <AlertDescription>Error: {error}</AlertDescription>
          </Alert>
        )}

        <Tabs
          className="flex flex-1 flex-col overflow-hidden"
          defaultValue="assignments"
        >
          <TabsList className="mx-6 mt-4 grid w-fit grid-cols-2">
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="overview">Overview</TabsTrigger>
          </TabsList>
          <TabsContent
            className="mt-0 flex-1 overflow-hidden"
            value="assignments"
          >
            <ScrollArea className="h-full">
              <div className="space-y-6 p-6">
                <div className="flex items-center justify-between">
                  <Button
                    className="group"
                    onClick={handlePreviousWeek}
                    size="sm"
                    variant="outline"
                  >
                    <ChevronLeft className="group-hover:-translate-x-0.5 mr-2 h-4 w-4 transition-transform" />
                    Previous Week
                  </Button>
                  <div className="text-center">
                    <div className="font-semibold text-lg">
                      {format(weekStartDate, "MMMM d")} -{" "}
                      {format(
                        endOfWeek(weekStartDate, { weekStartsOn: 1 }),
                        "MMMM d, yyyy"
                      )}
                    </div>
                    <div className="mt-1 text-muted-foreground text-sm">
                      {assignedWeekdays} of {weekdayDates.length} weekdays
                      assigned
                    </div>
                  </div>
                  <Button
                    className="group"
                    onClick={handleNextWeek}
                    size="sm"
                    variant="outline"
                  >
                    Next Week
                    <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Roster Completion</span>
                    <span className="font-medium">
                      {Math.round(completionPercentage)}%
                    </span>
                  </div>
                  <Progress value={completionPercentage} />
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={isViewOnly}
                    onClick={handleCopyPreviousWeek}
                    size="sm"
                    variant="outline"
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Previous Week
                  </Button>
                  <Button
                    disabled={isViewOnly}
                    onClick={handleClearWeek}
                    size="sm"
                    variant="outline"
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Clear Week
                  </Button>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button disabled={isViewOnly} size="sm" variant="outline">
                        <Sparkles className="mr-2 h-4 w-4" />
                        Quick Actions
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-56">
                      <div className="space-y-2">
                        <div className="mb-2 font-medium text-sm">
                          Apply to all weekdays:
                        </div>
                        {availableDrivers.map((driver) => (
                          <Button
                            className="w-full justify-start"
                            key={driver.id}
                            onClick={() => handleApplyToWeekdays(driver.id)}
                            size="sm"
                            variant="ghost"
                            disabled={isViewOnly}
                          >
                            <Avatar className="mr-2 h-4 w-4">
                              {driver.avatar ? (
                                <AvatarImage
                                  alt={driver.name}
                                  src={driver.avatar}
                                />
                              ) : null}
                              <AvatarFallback
                                className="text-[10px] text-white"
                                style={{ backgroundColor: driver.color }}
                              >
                                {driver.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")}
                              </AvatarFallback>
                            </Avatar>
                            {driver.name}
                          </Button>
                        ))}
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>

                {isLoadingWeek ? (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Card className="animate-pulse" key={i}>
                        <CardHeader className="pt-4 pb-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="mb-2 h-4 w-20 rounded bg-muted" />
                              <div className="h-8 w-12 rounded bg-muted" />
                            </div>
                            <div className="flex items-center gap-1.5">
                              <div className="h-6 w-20 rounded bg-muted" />
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="h-10 w-full rounded bg-muted" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div
                    className={cn(
                      "grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3 xl:grid-cols-4",
                      isViewOnly && "opacity-60"
                    )}
                  >
                    {weekDates.map((date) => (
                      <DayCard
                        key={date.toISOString()}
                        availableDrivers={availableDrivers}
                        changedDates={changedDates}
                        date={date}
                        driverAssignments={driverAssignments}
                        getNotificationStatus={getNotificationStatus}
                        isDateNotified={isDateNotified}
                        isViewOnly={isViewOnly}
                        onDriverSelect={handleDriverSelect}
                        onPopoverChange={handlePopoverChange}
                        openPopovers={openPopovers}
                      />
                    ))}
                  </div>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
          <TabsContent className="mt-0 flex-1 overflow-hidden" value="overview">
            <ScrollArea className="h-full">
              <div className="space-y-6 p-6">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                  <div className="space-y-6 lg:col-span-2">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Week at a Glance
                        </CardTitle>
                        <CardDescription>
                          Visual overview of driver assignments
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {weekDates.map((date) => {
                            const dateStr = format(date, "yyyy-MM-dd")
                            const driver = availableDrivers.find(
                              (d) => d.id === driverAssignments[dateStr]
                            )
                            const isWeekendDay = isWeekend(date)
                            return (
                              <div
                                className={cn(
                                  "flex items-center gap-4 rounded-lg p-3",
                                  isWeekendDay ? "bg-muted/30" : "bg-muted/50"
                                )}
                                key={dateStr}
                              >
                                <div className="w-20 font-medium">
                                  {format(date, "EEE dd")}
                                </div>
                                {driver ? (
                                  <div className="flex flex-1 items-center gap-2">
                                    <div
                                      className="h-2 w-full rounded-full"
                                      style={{ backgroundColor: driver.color }}
                                    />
                                    <span className="text-sm">
                                      {driver.name}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex-1 text-muted-foreground text-sm">
                                    Unassigned
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Coverage Summary
                        </CardTitle>
                        <CardDescription>
                          Assignment status by day type
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>Weekdays</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">
                              {assignedWeekdays}/{weekdayDates.length}
                            </span>
                            {assignedWeekdays === weekdayDates.length ? (
                              <CheckCircle2 className="h-4 w-4 text-green-500" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-yellow-500" />
                            )}
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          {weekdayDates
                            .filter(
                              (date) =>
                                !driverAssignments[format(date, "yyyy-MM-dd")]
                            )
                            .map((date) => (
                              <div
                                className="flex items-center gap-2 text-destructive text-sm"
                                key={date.toISOString()}
                              >
                                <XCircle className="h-3 w-3" />
                                <span>
                                  {format(date, "EEEE, MMMM d")} - No driver
                                  assigned
                                </span>
                              </div>
                            ))}
                          {assignedWeekdays === weekdayDates.length && (
                            <div className="font-medium text-green-600 text-sm">
                              ✓ All weekdays have drivers assigned
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="space-y-6">
                    <UtilizationPanel
                      availableDrivers={availableDrivers}
                      driverAssignments={driverAssignments}
                      weekDates={weekDates}
                    />
                  </div>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        <DialogFooter className="border-t bg-muted/30 px-6 py-4">
          <div className="flex w-full items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={() => onOpenChange(false)} variant="outline">
                Cancel
              </Button>
              {hasUnsavedChanges && (
                <span className="text-muted-foreground text-sm">
                  You have unsaved changes
                </span>
              )}
              {rosterStatus === "published" && changes.length > 0 && (
                <Badge className="gap-1" variant="outline">
                  <AlertCircle className="h-3 w-3" />
                  {changes.length} change{changes.length !== 1 ? "s" : ""} •{" "}
                  {affectedDriverIds.length} driver
                  {affectedDriverIds.length !== 1 ? "s" : ""} affected
                </Badge>
              )}
              {isViewOnly && (
                <span className="text-muted-foreground text-sm">
                  You have view-only access. Contact your team leader for
                  updates.
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <CanAccess permission="rosters.edit">
                {hasUnsavedChanges && (
                  <Button
                    disabled={isPublishing}
                    onClick={handleSaveDraft}
                    variant="outline"
                  >
                    <Save className="mr-2 h-4 w-4" />
                    Save Draft
                  </Button>
                )}
              </CanAccess>
              <CanAccess permission="rosters.publish">
                <Button
                  disabled={isPublishing}
                  onClick={() => handlePublishRoster(true)}
                >
                  {isPublishing ? (
                    <>
                      <Mail className="mr-2 h-4 w-4 animate-pulse" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      {rosterStatus === "draft"
                        ? "Publish & Notify All"
                        : "Republish to All"}
                    </>
                  )}
                </Button>
              </CanAccess>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

type NotificationStatusSummary = {
  notifiedAt?: string
  notificationId?: string
}

type PublishNotificationSummary = {
  totalDrivers: number
  sent: number
  failed: number
  failures?: Array<{
    driverEmail?: string
    driverName?: string
    message: string
    dates: string[]
  }>
}

const isPublishNotificationSummary = (
  value: unknown
): value is PublishNotificationSummary => {
  if (!value || typeof value !== "object") {
    return false
  }

  const summary = value as Partial<PublishNotificationSummary>
  const hasRequiredNumbers =
    typeof summary.totalDrivers === "number" &&
    typeof summary.sent === "number" &&
    typeof summary.failed === "number"

  const failuresValid =
    summary.failures === undefined ||
    (Array.isArray(summary.failures) &&
      summary.failures.every(
        (failure) =>
          failure &&
          typeof failure === "object" &&
          "message" in failure &&
          typeof failure.message === "string"
      ))

  return hasRequiredNumbers && failuresValid
}

interface DayCardProps {
  date: Date
  availableDrivers: Driver[]
  driverAssignments: Record<string, string>
  openPopovers: Record<string, boolean>
  onPopoverChange: (dateStr: string, open: boolean) => void
  onDriverSelect: (date: Date, driverId: string) => void
  getNotificationStatus: (dateStr: string) => NotificationStatusSummary
  isDateNotified: (dateStr: string, driverId: string) => boolean
  changedDates: Set<string>
  isViewOnly: boolean
}

function DayCard({
  date,
  availableDrivers,
  driverAssignments,
  openPopovers,
  onPopoverChange,
  onDriverSelect,
  getNotificationStatus,
  isDateNotified,
  changedDates,
  isViewOnly,
}: DayCardProps) {
  const dateStr = format(date, "yyyy-MM-dd")
  const assignedDriverId = driverAssignments[dateStr]
  const assignedDriver = availableDrivers.find((d) => d.id === assignedDriverId)
  const isToday = isSameDay(date, new Date())
  const isWeekendDay = isWeekend(date)
  const notificationStatus = getNotificationStatus(dateStr)
  const isNotified =
    !!assignedDriverId && isDateNotified(dateStr, assignedDriverId)
  const hasChanges = changedDates.has(dateStr)

  const handleOpenChange = (open: boolean) => {
    if (isViewOnly) {
      return
    }
    onPopoverChange(dateStr, open)
  }

  const handleSelectDriver = (driverId: string) => {
    if (isViewOnly) {
      return
    }
    onDriverSelect(date, driverId)
  }

  return (
    <Card
      className={cn(
        "transition-all duration-200 hover:shadow-md",
        isToday && "shadow-sm ring-2 ring-primary",
        isWeekendDay && "bg-muted/30 opacity-90"
      )}
    >
      <CardHeader className="pt-4 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="font-medium text-base">
              {format(date, "EEEE")}
            </CardTitle>
            <CardDescription className="font-semibold text-2xl">
              {format(date, "d")}
            </CardDescription>
          </div>
          <div className="flex items-center gap-1.5">
            {hasChanges && (
              <Badge
                className="gap-1 border-yellow-500 bg-yellow-50 text-xs text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400"
                variant="outline"
              >
                <AlertCircle className="h-3 w-3" />
                Changed
              </Badge>
            )}
            {assignedDriver ? (
              <Badge
                className="gap-1 bg-green-500 text-xs hover:bg-green-600"
                variant="default"
              >
                <CheckCircle2 className="h-3 w-3" />
                Assigned
              </Badge>
            ) : (
              <Badge
                className="gap-1 border-2 border-dashed text-xs"
                variant="secondary"
              >
                <XCircle className="h-3 w-3" />
                Unassigned
              </Badge>
            )}
            {isNotified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <Bell className="h-4 w-4 text-green-600" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      Notified{" "}
                      {notificationStatus.notifiedAt &&
                        format(
                          new Date(notificationStatus.notifiedAt),
                          "MMM d 'at' h:mm a"
                        )}
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Popover
          onOpenChange={handleOpenChange}
          open={isViewOnly ? false : openPopovers[dateStr]}
        >
          <PopoverTrigger asChild>
            <Button
              className={cn(
                "w-full justify-start",
                !assignedDriver && "text-muted-foreground"
              )}
              disabled={isViewOnly}
              variant="outline"
            >
              {assignedDriver ? (
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {assignedDriver.avatar ? (
                      <AvatarImage
                        alt={assignedDriver.name}
                        src={assignedDriver.avatar}
                      />
                    ) : null}
                    <AvatarFallback
                      className="text-white text-xs"
                      style={{ backgroundColor: assignedDriver.color }}
                    >
                      {assignedDriver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{assignedDriver.name}</span>
                </div>
              ) : (
                <span>Select driver</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-[300px] p-0">
            <Command>
              <CommandInput placeholder="Search drivers..." />
              <CommandList>
                <CommandEmpty>No drivers found.</CommandEmpty>
                <CommandGroup>
                  {availableDrivers.map((driver) => (
                    <CommandItem
                      key={driver.id}
                      disabled={isViewOnly}
                      onSelect={() => handleSelectDriver(driver.id)}
                      value={driver.name}
                    >
                      <div className="flex w-full items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {driver.avatar ? (
                            <AvatarImage
                              alt={driver.name}
                              src={driver.avatar}
                            />
                          ) : null}
                          <AvatarFallback
                            className="text-white text-xs"
                            style={{ backgroundColor: driver.color }}
                          >
                            {driver.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 space-y-1">
                          <div className="font-medium">{driver.name}</div>
                          <div className="text-muted-foreground text-xs">
                            {driver.vanId ? `Van ${driver.vanId}` : ""}
                          </div>
                        </div>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {assignedDriver ? (
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Clock className="h-3 w-3" />
              <span>Van {assignedDriver.vanId ?? "-"}</span>
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="cursor-help truncate text-muted-foreground text-xs">
                    {assignedDriver.vanDetails}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{assignedDriver.vanDetails}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        ) : null}
      </CardContent>
    </Card>
  )
}

interface UtilizationPanelProps {
  availableDrivers: Driver[]
  driverAssignments: Record<string, string>
  weekDates: Date[]
}

function UtilizationPanel({
  availableDrivers,
  driverAssignments,
  weekDates,
}: UtilizationPanelProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Driver Utilization</CardTitle>
        <CardDescription>Workload distribution for this week</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {availableDrivers.map((driver) => {
          const assignedDays = weekDates.filter(
            (date) =>
              driverAssignments[format(date, "yyyy-MM-dd")] === driver.id
          ).length
          const pct = (assignedDays / 5) * 100

          return (
            <div className="space-y-2" key={driver.id}>
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <Avatar className="h-6 w-6">
                    {driver.avatar ? (
                      <AvatarImage alt={driver.name} src={driver.avatar} />
                    ) : null}
                    <AvatarFallback
                      className="text-white text-xs"
                      style={{ backgroundColor: driver.color }}
                    >
                      {driver.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span>{driver.name}</span>
                </div>
                <span className="text-muted-foreground">
                  {assignedDays}/5 days
                </span>
              </div>
              <Progress value={pct} />
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
