/**
 * Shared types for Teams, Venues, and Competitions library management.
 *
 * @packageDocumentation
 */

/**
 * Team entity representing a sports team saved in a user's library.
 */
export interface Team {
  id: string
  owner_id: string
  name: string
  short_name: string | null
  division: string | null
  color_primary: string | null
  color_secondary: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new team library entry.
 */
export interface CreateTeamInput {
  name: string
  short_name?: string
  division?: string
  color_primary?: string
  color_secondary?: string
}

/**
 * Payload for updating an existing team library entry.
 */
export interface UpdateTeamInput {
  name?: string
  short_name?: string | null
  division?: string | null
  color_primary?: string | null
  color_secondary?: string | null
}

/**
 * Venue entity representing a match location saved in a user's library.
 */
export interface Venue {
  id: string
  owner_id: string
  name: string
  city: string | null
  country: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new venue library entry.
 */
export interface CreateVenueInput {
  name: string
  city?: string
  country?: string
  latitude?: number
  longitude?: number
}

/**
 * Payload for updating an existing venue library entry.
 */
export interface UpdateVenueInput {
  name?: string
  city?: string | null
  country?: string | null
  latitude?: number | null
  longitude?: number | null
}

/**
 * Competition entity representing an organized competition saved in a user's library.
 */
export interface Competition {
  id: string
  owner_id: string
  name: string
  level: string | null
  created_at: string
  updated_at: string
}

/**
 * Payload for creating a new competition library entry.
 */
export interface CreateCompetitionInput {
  name: string
  level?: string
}

/**
 * Payload for updating an existing competition library entry.
 */
export interface UpdateCompetitionInput {
  name?: string
  level?: string | null
}

/**
 * Lightweight representation of a library item for combobox usage.
 */
export interface LibraryItem {
  id: string
  name: string
}
