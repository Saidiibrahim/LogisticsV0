export type RosterStatus = "draft" | "published" | "modified"

export interface Driver {
  id: string
  name: string
  email?: string
  role: "driver" | "admin" | string
  avatar?: string
  color?: string
  vanId?: string
  vanDetails?: string
}

export interface Van {
  id: string
  name?: string
  plate?: string
  details?: string
}

export interface RosterAssignment {
  date: string // yyyy-MM-dd
  driverId: string
  previousDriverId?: string
  notifiedAt?: string
  notificationId?: string
}

export interface Roster {
  id: string
  weekStart: string // yyyy-MM-dd
  status: RosterStatus
  version: number
  assignments: RosterAssignment[]
}

export interface RosterChange {
  date: string
  previousDriverId?: string
  newDriverId?: string
}


