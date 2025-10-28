"use client"

import { format, startOfWeek } from "date-fns"
import { create } from "zustand"
import { devtools } from "zustand/middleware"
import {
  type ActionState,
  loadRosterForWeek,
  saveRoster,
} from "@/app/(authenticated)/calendar/roster-actions"
import type {
  Driver,
  Roster,
  RosterAssignment,
  RosterChange,
  RosterStatus,
} from "@/lib/types/roster"

type NotificationStatus = { notifiedAt?: string; notificationId?: string }

interface RosterState {
  currentRoster: Roster | null
  originalAssignments: RosterAssignment[]
  drivers: Driver[]
  hasUnsavedChanges: boolean

  loadRosterForWeek: (weekStartDate: Date) => Promise<void>
  saveCurrentRoster: (
    status: RosterStatus
  ) => Promise<ActionState<{ notifications?: unknown }> | undefined>
  updateAssignment: (dateStr: string, driverId: string) => void
  removeAssignment: (dateStr: string) => void
  bulkUpdateAssignments: (map: Record<string, string>) => void
  getChanges: () => RosterChange[]
  getAffectedDriverIds: () => string[]
  isDateNotified: (dateStr: string, driverId: string) => boolean
  getNotificationStatus: (dateStr: string) => NotificationStatus
}

function toDateKey(date: Date) {
  return format(date, "yyyy-MM-dd")
}

function diffAssignments(
  prev: RosterAssignment[],
  cur: RosterAssignment[]
): RosterChange[] {
  const prevMap = new Map(prev.map((a) => [a.date, a.driverId]))
  const curMap = new Map(cur.map((a) => [a.date, a.driverId]))
  const dates = new Set<string>([...prevMap.keys(), ...curMap.keys()])
  const changes: RosterChange[] = []
  dates.forEach((d) => {
    const p = prevMap.get(d)
    const c = curMap.get(d)
    if (p !== c) {
      changes.push({ date: d, previousDriverId: p, newDriverId: c })
    }
  })
  return changes
}

export const useRosterStore = create<RosterState>()(
  devtools(
    (set, get) => ({
      currentRoster: null,
      originalAssignments: [],
      drivers: [],
      hasUnsavedChanges: false,

      async loadRosterForWeek(weekStartDate) {
        const weekStartISO = toDateKey(
          startOfWeek(weekStartDate, { weekStartsOn: 1 })
        )
        const result = await loadRosterForWeek(weekStartISO)
        if (result?.success) {
          set({
            currentRoster: result.roster,
            originalAssignments: result.roster?.assignments ?? [],
            drivers: result.drivers ?? [],
            hasUnsavedChanges: false,
          })
        }
      },

      async saveCurrentRoster(status) {
        const { currentRoster } = get()
        if (!currentRoster) return
        const res = await saveRoster(
          currentRoster.weekStart,
          status,
          currentRoster.assignments,
          currentRoster.id
        )
        if (res?.success && res.roster) {
          set({
            currentRoster: res.roster,
            originalAssignments: res.roster.assignments,
            hasUnsavedChanges: false,
          })
        }
        return res
      },

      updateAssignment(dateStr, driverId) {
        const { currentRoster } = get()
        if (!currentRoster) return
        const others = currentRoster.assignments.filter(
          (a) => a.date !== dateStr
        )
        const next: RosterAssignment[] = [
          ...others,
          { date: dateStr, driverId },
        ]
        const updated: Roster = { ...currentRoster, assignments: next }
        const changes = diffAssignments(get().originalAssignments, next)
        set({ currentRoster: updated, hasUnsavedChanges: changes.length > 0 })
      },

      removeAssignment(dateStr) {
        const { currentRoster } = get()
        if (!currentRoster) return
        const next = currentRoster.assignments.filter((a) => a.date !== dateStr)
        const updated: Roster = { ...currentRoster, assignments: next }
        const changes = diffAssignments(get().originalAssignments, next)
        set({ currentRoster: updated, hasUnsavedChanges: changes.length > 0 })
      },

      bulkUpdateAssignments(map) {
        const { currentRoster } = get()
        if (!currentRoster) return
        const filtered = currentRoster.assignments.filter((a) => !map[a.date])
        // Preserve notifiedAt and notificationId when updating
        const added = Object.entries(map).map(([date, driverId]) => {
          const existing = currentRoster.assignments.find(
            (a) => a.date === date
          )
          return {
            date,
            driverId,
            notifiedAt: existing?.notifiedAt,
            notificationId: existing?.notificationId,
          }
        })
        const next = [...filtered, ...added]
        const updated: Roster = { ...currentRoster, assignments: next }
        const changes = diffAssignments(get().originalAssignments, next)
        set({ currentRoster: updated, hasUnsavedChanges: changes.length > 0 })
      },

      getChanges() {
        const { originalAssignments, currentRoster } = get()
        const cur = currentRoster?.assignments ?? []
        return diffAssignments(originalAssignments, cur)
      },

      getAffectedDriverIds() {
        const changes = get().getChanges()
        return Array.from(
          new Set(changes.map((c) => c.newDriverId).filter(Boolean))
        ) as string[]
      },

      isDateNotified(dateStr, driverId) {
        const { currentRoster } = get()
        const a = currentRoster?.assignments.find(
          (x) => x.date === dateStr && x.driverId === driverId
        )
        return !!a?.notifiedAt
      },

      getNotificationStatus(dateStr) {
        const { currentRoster } = get()
        const a = currentRoster?.assignments.find((x) => x.date === dateStr)
        return { notifiedAt: a?.notifiedAt, notificationId: a?.notificationId }
      },
    }),
    { name: "RosterStore", enabled: process.env.NODE_ENV !== "production" }
  )
)
