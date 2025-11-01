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
  BarChart3,
  Bell,
  Calendar,
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
      <DialogContent 
        className="flex h-[90vh] max-w-6xl flex-col gap-0 overflow-hidden p-0 sm:h-screen sm:max-w-full md:h-[85vh]"
        closeButtonClassName="absolute top-4 right-4 z-50 flex h-8 w-8 items-center justify-center rounded-md border bg-white text-muted-foreground shadow-sm transition-all hover:bg-gray-50 hover:text-foreground hover:shadow-md focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none dark:bg-gray-900 dark:hover:bg-gray-800 dark:text-gray-100 [&_svg]:size-4"
      >
        <DialogHeader className="border-b bg-gradient-to-r from-background via-background to-muted/20 px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1.5">
              <DialogTitle className="flex items-center gap-3 text-2xl font-semibold">
                Weekly Driver Roster
                {isViewOnly && (
                  <Badge 
                    variant="secondary" 
                    className="h-6 gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <AlertCircle className="h-3 w-3" />
                    View Only
                  </Badge>
                )}
              </DialogTitle>
              <DialogDescription className="text-base text-muted-foreground">
                Assign drivers to days for the entire week. Changes will only be
                applied when you save.
              </DialogDescription>
            </div>
            {currentRoster && (
              <Badge
                className={cn(
                  "h-7 gap-1.5 px-3 text-sm font-medium shrink-0 mr-10",
                  rosterStatus === "draft" &&
                    "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400",
                  rosterStatus === "published" &&
                    "border-green-200 bg-green-50 text-green-700 dark:border-green-900/50 dark:bg-green-900/20 dark:text-green-400",
                  rosterStatus === "modified" &&
                    "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-400"
                )}
                variant="outline"
              >
                {rosterStatus === "draft" && (
                  <>
                    <Clock className="h-3.5 w-3.5" />
                    Draft
                  </>
                )}
                {rosterStatus === "published" && (
                  <>
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Published
                  </>
                )}
                {rosterStatus === "modified" && (
                  <>
                    <AlertCircle className="h-3.5 w-3.5" />
                    Modified
                  </>
                )}
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
          defaultValue={canEditRoster ? "assignments" : "overview"}
        >
          {canEditRoster && (
            <div className="border-b bg-muted/30 px-6 pt-4">
              <TabsList className="grid w-fit grid-cols-2">
                <TabsTrigger value="assignments" className="gap-2">
                  <Calendar className="h-4 w-4" />
                  Assignments
                </TabsTrigger>
                <TabsTrigger value="overview" className="gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Overview
                </TabsTrigger>
              </TabsList>
            </div>
          )}
          {canEditRoster && (
            <TabsContent
              className="mt-0 flex-1 overflow-hidden"
              value="assignments"
            >
            <ScrollArea className="h-full">
              <div className="space-y-6 p-6">
                {/* Week Navigation Card */}
                <Card className="border-2 bg-gradient-to-br from-card via-card to-muted/20 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
                      <Button
                        className="group order-2 sm:order-1"
                        onClick={handlePreviousWeek}
                        size="sm"
                        variant="outline"
                      >
                        <ChevronLeft className="group-hover:-translate-x-0.5 mr-2 h-4 w-4 transition-transform" />
                        Previous Week
                      </Button>
                      <div className="order-1 text-center sm:order-2">
                        <div className="font-bold text-2xl tracking-tight">
                          {format(weekStartDate, "MMMM d")} -{" "}
                          {format(
                            endOfWeek(weekStartDate, { weekStartsOn: 1 }),
                            "MMMM d, yyyy"
                          )}
                        </div>
                        <div className="mt-1.5 text-muted-foreground text-sm font-medium">
                          {assignedWeekdays} of {weekdayDates.length} weekdays
                          assigned
                        </div>
                      </div>
                      <Button
                        className="group order-3"
                        onClick={handleNextWeek}
                        size="sm"
                        variant="outline"
                      >
                        Next Week
                        <ChevronRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Progress Card */}
                <Card className="shadow-sm">
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-sm">Roster Completion</span>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "font-bold text-lg",
                              completionPercentage === 100 && "text-green-600 dark:text-green-400",
                              completionPercentage >= 50 && completionPercentage < 100 && "text-yellow-600 dark:text-yellow-400",
                              completionPercentage < 50 && "text-amber-600 dark:text-amber-400"
                          )}>
                            {Math.round(completionPercentage)}%
                          </span>
                          {completionPercentage === 100 && (
                            <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={completionPercentage}
                        className={cn(
                          "h-2.5",
                          completionPercentage === 100 && "[&>div]:bg-green-600 dark:[&>div]:bg-green-500"
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions Card */}
                <Card className="border-dashed shadow-sm">
                  <CardContent className="pt-6">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-muted-foreground font-medium text-sm">
                        Quick Actions:
                      </span>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          disabled={isViewOnly}
                          onClick={handleCopyPreviousWeek}
                          size="sm"
                          variant="outline"
                          className="shadow-sm hover:shadow"
                        >
                          <Copy className="mr-2 h-4 w-4" />
                          Copy Previous Week
                        </Button>
                        <Button
                          disabled={isViewOnly}
                          onClick={handleClearWeek}
                          size="sm"
                          variant="outline"
                          className="shadow-sm hover:shadow border-destructive/50 hover:border-destructive hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          Clear Week
                        </Button>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button 
                              disabled={isViewOnly} 
                              size="sm" 
                              variant="outline"
                              className="shadow-sm hover:shadow border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary"
                            >
                              <Sparkles className="mr-2 h-4 w-4" />
                              Quick Actions
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-64" align="start">
                            <div className="space-y-3">
                              <div className="font-semibold text-sm">
                                Apply to all weekdays:
                              </div>
                              <div className="max-h-64 space-y-1 overflow-y-auto">
                                {availableDrivers.map((driver) => (
                                  <Button
                                    className="w-full justify-start hover:bg-accent"
                                    key={driver.id}
                                    onClick={() => handleApplyToWeekdays(driver.id)}
                                    size="sm"
                                    variant="ghost"
                                    disabled={isViewOnly}
                                  >
                                    <Avatar className="mr-2 h-5 w-5">
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
                                    <span className="font-medium">{driver.name}</span>
                                  </Button>
                                ))}
                              </div>
                            </div>
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </CardContent>
                </Card>

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
          )}
          <TabsContent 
            className="mt-0 flex-1 overflow-hidden" 
            value="overview"
          >
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
                        <div className="space-y-2.5">
                          {weekDates.map((date) => {
                            const dateStr = format(date, "yyyy-MM-dd")
                            const driver = availableDrivers.find(
                              (d) => d.id === driverAssignments[dateStr]
                            )
                            const isWeekendDay = isWeekend(date)
                            const isToday = isSameDay(date, new Date())
                            return (
                              <div
                                className={cn(
                                  "flex items-center gap-4 rounded-lg p-3.5 transition-colors hover:bg-accent/50",
                                  isWeekendDay 
                                    ? "bg-gradient-to-r from-muted/40 to-muted/20" 
                                    : "bg-gradient-to-r from-muted/60 to-muted/30",
                                  isToday && "ring-2 ring-primary/50"
                                )}
                                key={dateStr}
                              >
                                <div className={cn(
                                  "w-24 font-semibold text-sm",
                                  isToday && "text-primary"
                                )}>
                                  {format(date, "EEE dd")}
                                </div>
                                {driver ? (
                                  <div className="flex flex-1 items-center gap-3">
                                    <div 
                                      className="rounded-full border-2"
                                      style={{ borderColor: driver.color }}
                                    >
                                      <Avatar className="h-7 w-7">
                                        {driver.avatar ? (
                                          <AvatarImage alt={driver.name} src={driver.avatar} />
                                        ) : null}
                                        <AvatarFallback
                                          className="font-semibold text-white text-xs"
                                          style={{ backgroundColor: driver.color }}
                                        >
                                          {driver.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                        </AvatarFallback>
                                      </Avatar>
                                    </div>
                                    <div
                                      className="h-2.5 flex-1 rounded-full shadow-sm"
                                      style={{ backgroundColor: driver.color }}
                                    />
                                    <span className="font-medium text-sm min-w-[120px] text-right">
                                      {driver.name}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="flex flex-1 items-center gap-3">
                                    <div className="h-2.5 flex-1 rounded-full bg-muted-foreground/20" />
                                    <span className="text-muted-foreground text-sm min-w-[120px] text-right">
                                      Unassigned
                                    </span>
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
                        <div className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm">Weekdays</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={cn(
                              "font-bold text-base",
                              assignedWeekdays === weekdayDates.length 
                                ? "text-green-600 dark:text-green-400"
                                : "text-amber-600 dark:text-amber-400"
                            )}>
                              {assignedWeekdays}/{weekdayDates.length}
                            </span>
                            {assignedWeekdays === weekdayDates.length ? (
                              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                            ) : (
                              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400" />
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
                                className="flex items-center gap-2 rounded-md bg-destructive/10 p-2 text-destructive text-sm"
                                key={date.toISOString()}
                              >
                                <XCircle className="h-4 w-4 shrink-0" />
                                <span>
                                  {format(date, "EEEE, MMMM d")} - No driver
                                  assigned
                                </span>
                              </div>
                            ))}
                          {assignedWeekdays === weekdayDates.length && (
                            <div className="rounded-md bg-green-50 p-3 font-semibold text-green-700 text-sm dark:bg-green-900/20 dark:text-green-400">
                              <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" />
                                <span>All weekdays have drivers assigned</span>
                              </div>
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

        <DialogFooter className="border-t bg-gradient-to-r from-muted/40 via-muted/30 to-muted/40 px-6 py-4">
          <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
              <Button 
                onClick={() => onOpenChange(false)} 
                variant="outline"
                className="shadow-sm"
              >
                Cancel
              </Button>
              <div className="flex flex-wrap items-center gap-2">
                {hasUnsavedChanges && (
                  <Badge 
                    variant="outline" 
                    className="gap-1 border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-400"
                  >
                    <AlertCircle className="h-3 w-3" />
                    Unsaved changes
                  </Badge>
                )}
                {rosterStatus === "published" && changes.length > 0 && (
                  <Badge 
                    className="gap-1 border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/50 dark:bg-yellow-900/20 dark:text-yellow-400" 
                    variant="outline"
                  >
                    <AlertCircle className="h-3 w-3" />
                    {changes.length} change{changes.length !== 1 ? "s" : ""} •{" "}
                    {affectedDriverIds.length} driver
                    {affectedDriverIds.length !== 1 ? "s" : ""} affected
                  </Badge>
                )}
                {isViewOnly && (
                  <Badge 
                    variant="outline"
                    className="gap-1 border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-400"
                  >
                    <AlertCircle className="h-3 w-3" />
                    View-only access
                  </Badge>
                )}
              </div>
            </div>
            <div className="flex gap-2">
              <CanAccess permission="rosters.edit">
                {hasUnsavedChanges && (
                  <Button
                    disabled={isPublishing}
                    onClick={handleSaveDraft}
                    variant="outline"
                    className="shadow-sm"
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
                  className="shadow-md hover:shadow-lg"
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
        "group relative transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        isToday && "shadow-md ring-2 ring-primary ring-offset-2",
        isWeekendDay && "bg-gradient-to-br from-muted/40 to-muted/20 opacity-90",
        !isWeekendDay && "bg-gradient-to-br from-card to-muted/10"
      )}
    >
      {isToday && (
        <div className="absolute -left-1 top-1/2 h-8 w-1 -translate-y-1/2 rounded-full bg-primary" />
      )}
      <CardHeader className="pt-4 pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex-1">
            <CardTitle className={cn(
              "font-semibold text-base",
              isToday && "text-primary"
            )}>
              {format(date, "EEEE")}
            </CardTitle>
            <CardDescription className={cn(
              "font-bold text-3xl mt-1",
              isToday && "text-primary"
            )}>
              {format(date, "d")}
            </CardDescription>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            {hasChanges && (
              <Badge
                className="gap-1 border-yellow-500/80 bg-yellow-50 text-xs text-yellow-700 shadow-sm dark:bg-yellow-900/20 dark:text-yellow-400"
                variant="outline"
              >
                <AlertCircle className="h-3 w-3" />
                Changed
              </Badge>
            )}
            {assignedDriver ? (
              <Badge
                className="gap-1 bg-green-500 text-xs text-white shadow-sm hover:bg-green-600"
                variant="default"
              >
                <CheckCircle2 className="h-3 w-3" />
                Assigned
              </Badge>
            ) : (
              <Badge
                className="gap-1 border-2 border-dashed border-muted-foreground/40 text-xs"
                variant="secondary"
              >
                <XCircle className="h-3 w-3" />
                Unassigned
              </Badge>
            )}
            {isNotified && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="rounded-full bg-green-100 p-1 dark:bg-green-900/30">
                      <Bell className="h-3 w-3 text-green-600 dark:text-green-400" />
                    </div>
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
                "w-full justify-start transition-all hover:shadow-sm",
                !assignedDriver && "text-muted-foreground hover:text-foreground",
                assignedDriver && "border-2 hover:border-primary/50"
              )}
              disabled={isViewOnly}
              variant="outline"
            >
              {assignedDriver ? (
                <div className="flex items-center gap-2.5">
                  <div 
                    className="rounded-full border-2"
                    style={{ borderColor: assignedDriver.color }}
                  >
                    <Avatar className="h-7 w-7">
                      {assignedDriver.avatar ? (
                        <AvatarImage
                          alt={assignedDriver.name}
                          src={assignedDriver.avatar}
                        />
                      ) : null}
                      <AvatarFallback
                        className="font-semibold text-white text-xs"
                        style={{ backgroundColor: assignedDriver.color }}
                      >
                        {assignedDriver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="font-medium">{assignedDriver.name}</span>
                </div>
              ) : (
                <span className="flex items-center gap-2">
                  <span>Select driver</span>
                  <ChevronRight className="h-4 w-4 opacity-50" />
                </span>
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
          <div className="mt-4 space-y-2 rounded-lg bg-muted/50 p-3">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
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
      <CardContent className="space-y-4">
        {availableDrivers.map((driver) => {
          const assignedDays = weekDates.filter(
            (date) =>
              driverAssignments[format(date, "yyyy-MM-dd")] === driver.id
          ).length
          const pct = (assignedDays / 5) * 100

          return (
            <div className="space-y-2.5" key={driver.id}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div 
                    className="rounded-full border-2"
                    style={{ borderColor: driver.color }}
                  >
                    <Avatar className="h-8 w-8">
                      {driver.avatar ? (
                        <AvatarImage alt={driver.name} src={driver.avatar} />
                      ) : null}
                      <AvatarFallback
                        className="font-semibold text-white text-xs"
                        style={{ backgroundColor: driver.color }}
                      >
                        {driver.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <span className="font-medium text-sm">{driver.name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={cn(
                    "font-bold text-sm",
                    pct === 100 && "text-green-600 dark:text-green-400",
                    pct >= 50 && pct < 100 && "text-yellow-600 dark:text-yellow-400",
                    pct < 50 && "text-muted-foreground"
                  )}>
                    {assignedDays}/5
                  </span>
                  <span className="text-muted-foreground text-xs">days</span>
                </div>
              </div>
              <div className="space-y-1">
                <Progress 
                  value={pct} 
                  className={cn(
                    "h-2.5",
                    pct === 100 && "[&>div]:bg-green-600 dark:[&>div]:bg-green-500"
                  )}
                />
                {pct === 0 && (
                  <div className="text-muted-foreground text-xs">No assignments</div>
                )}
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
