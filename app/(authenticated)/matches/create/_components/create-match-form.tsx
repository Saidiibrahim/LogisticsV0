"use client"

import { AlertCircle, Loader2 } from "lucide-react"
import { useActionState, useEffect, useId, useMemo, useState } from "react"
import { getCompetitions } from "@/app/(authenticated)/settings/_actions/competition-actions"
import { getTeams } from "@/app/(authenticated)/settings/_actions/team-actions"
import { getVenues } from "@/app/(authenticated)/settings/_actions/venue-actions"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Combobox, type ComboboxItem } from "@/components/ui/combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

import { createScheduledMatch } from "../actions"

const initialState: { error?: string } = {}

function formatDateTimeLocal(date: Date) {
  const pad = (value: number) => value.toString().padStart(2, "0")
  return [date.getFullYear(), pad(date.getMonth() + 1), pad(date.getDate())]
    .join("-")
    .concat("T")
    .concat([pad(date.getHours()), pad(date.getMinutes())].join(":"))
}

export function CreateMatchForm() {
  const homeTeamId = useId()
  const awayTeamId = useId()
  const kickoffId = useId()
  const competitionId = useId()
  const venueId = useId()
  const notesId = useId()

  const minKickoffValue = useMemo(
    () => formatDateTimeLocal(new Date(Date.now() + 15 * 60 * 1000)),
    []
  )

  const [state, formAction, isPending] = useActionState(
    createScheduledMatch,
    initialState
  )

  const [teams, setTeams] = useState<ComboboxItem[]>([])
  const [venues, setVenues] = useState<ComboboxItem[]>([])
  const [competitions, setCompetitions] = useState<ComboboxItem[]>([])
  const [libraryError, setLibraryError] = useState<string>()
  const [isLoadingLibraries, setIsLoadingLibraries] = useState(true)

  const [selectedHomeTeamId, setSelectedHomeTeamId] = useState("")
  const [selectedAwayTeamId, setSelectedAwayTeamId] = useState("")
  const [selectedVenueId, setSelectedVenueId] = useState("")
  const [selectedCompetitionId, setSelectedCompetitionId] = useState("")

  const [homeTeamName, setHomeTeamName] = useState("")
  const [awayTeamName, setAwayTeamName] = useState("")
  const [venueName, setVenueName] = useState("")
  const [competitionName, setCompetitionName] = useState("")

  useEffect(() => {
    let active = true
    ;(async () => {
      setIsLoadingLibraries(true)
      setLibraryError(undefined)
      try {
        const [teamData, venueData, competitionData] = await Promise.all([
          getTeams(),
          getVenues(),
          getCompetitions(),
        ])

        if (!active) {
          return
        }

        setTeams(
          teamData.map((team) => ({
            value: team.id,
            label: team.name,
            description:
              [team.short_name, team.division].filter(Boolean).join(" • ") ||
              undefined,
          }))
        )
        setVenues(
          venueData.map((venue) => ({
            value: venue.id,
            label: venue.name,
            description:
              [venue.city, venue.country].filter(Boolean).join(", ") ||
              (venue.latitude !== null && venue.longitude !== null
                ? `${venue.latitude.toFixed(2)}°, ${venue.longitude.toFixed(2)}°`
                : undefined),
          }))
        )
        setCompetitions(
          competitionData.map((competition) => ({
            value: competition.id,
            label: competition.name,
            description: competition.level ?? undefined,
          }))
        )
      } catch (error) {
        if (active) {
          console.error("[matches] Failed to load library data:", error)
          setLibraryError(
            "We were unable to load your library data. You can still enter details manually."
          )
        }
      } finally {
        if (active) {
          setIsLoadingLibraries(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const handleHomeTeamSelect = (nextId: string) => {
    setSelectedHomeTeamId(nextId)
    if (!nextId) {
      return
    }
    const match = teams.find((team) => team.value === nextId)
    if (match) {
      setHomeTeamName(match.label)
    }
  }

  const handleAwayTeamSelect = (nextId: string) => {
    setSelectedAwayTeamId(nextId)
    if (!nextId) {
      return
    }
    const match = teams.find((team) => team.value === nextId)
    if (match) {
      setAwayTeamName(match.label)
    }
  }

  const handleVenueSelect = (nextId: string) => {
    setSelectedVenueId(nextId)
    if (!nextId) {
      return
    }
    const match = venues.find((venue) => venue.value === nextId)
    if (match) {
      setVenueName(match.label)
    }
  }

  const handleCompetitionSelect = (nextId: string) => {
    setSelectedCompetitionId(nextId)
    if (!nextId) {
      return
    }
    const match = competitions.find(
      (competition) => competition.value === nextId
    )
    if (match) {
      setCompetitionName(match.label)
    }
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Match Details</CardTitle>
          <CardDescription>
            Provide the key information about your upcoming assignment.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {libraryError ? (
            <Alert variant="default">
              <AlertDescription>{libraryError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Quick Select Home Team</Label>
              <Combobox
                items={teams}
                value={selectedHomeTeamId}
                onValueChange={handleHomeTeamSelect}
                placeholder={
                  isLoadingLibraries
                    ? "Loading teams…"
                    : "Select from teams library"
                }
                emptyMessage="No teams found"
                searchPlaceholder="Search teams..."
                disabled={isPending || isLoadingLibraries}
              />
              <p className="text-muted-foreground text-xs">
                Choose a saved team or type its name manually below.
              </p>
              <Label htmlFor={homeTeamId}>
                Home Team <span className="text-destructive">*</span>
              </Label>
              <Input
                id={homeTeamId}
                name="home_team_name"
                placeholder="Home team name"
                maxLength={120}
                required
                value={homeTeamName}
                onChange={(event) => {
                  setHomeTeamName(event.target.value)
                  if (selectedHomeTeamId) {
                    setSelectedHomeTeamId("")
                  }
                }}
                disabled={isPending}
              />
              <input
                type="hidden"
                name="home_team_id"
                value={selectedHomeTeamId}
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Select Away Team</Label>
              <Combobox
                items={teams}
                value={selectedAwayTeamId}
                onValueChange={handleAwayTeamSelect}
                placeholder={
                  isLoadingLibraries
                    ? "Loading teams…"
                    : "Select from teams library"
                }
                emptyMessage="No teams found"
                searchPlaceholder="Search teams..."
                disabled={isPending || isLoadingLibraries}
              />
              <p className="text-muted-foreground text-xs">
                Choose a saved team or type its name manually below.
              </p>
              <Label htmlFor={awayTeamId}>
                Away Team <span className="text-destructive">*</span>
              </Label>
              <Input
                id={awayTeamId}
                name="away_team_name"
                placeholder="Away team name"
                maxLength={120}
                required
                value={awayTeamName}
                onChange={(event) => {
                  setAwayTeamName(event.target.value)
                  if (selectedAwayTeamId) {
                    setSelectedAwayTeamId("")
                  }
                }}
                disabled={isPending}
              />
              <input
                type="hidden"
                name="away_team_id"
                value={selectedAwayTeamId}
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
              required
              min={minKickoffValue}
              disabled={isPending}
            />
            <p className="text-muted-foreground text-xs">
              Ensure the kickoff time is set in your local timezone.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Quick Select Competition</Label>
              <Combobox
                items={competitions}
                value={selectedCompetitionId}
                onValueChange={handleCompetitionSelect}
                placeholder={
                  isLoadingLibraries
                    ? "Loading competitions…"
                    : "Select from competitions library"
                }
                emptyMessage="No competitions found"
                searchPlaceholder="Search competitions..."
                disabled={isPending || isLoadingLibraries}
              />
              <p className="text-muted-foreground text-xs">
                Choose a saved competition or describe it manually.
              </p>
              <Label htmlFor={competitionId}>Competition</Label>
              <Input
                id={competitionId}
                name="competition_name"
                placeholder="League or competition"
                maxLength={120}
                value={competitionName}
                onChange={(event) => {
                  setCompetitionName(event.target.value)
                  if (selectedCompetitionId) {
                    setSelectedCompetitionId("")
                  }
                }}
                disabled={isPending}
              />
              <input
                type="hidden"
                name="competition_id"
                value={selectedCompetitionId}
              />
            </div>

            <div className="space-y-2">
              <Label>Quick Select Venue</Label>
              <Combobox
                items={venues}
                value={selectedVenueId}
                onValueChange={handleVenueSelect}
                placeholder={
                  isLoadingLibraries
                    ? "Loading venues…"
                    : "Select from venues library"
                }
                emptyMessage="No venues found"
                searchPlaceholder="Search venues..."
                disabled={isPending || isLoadingLibraries}
              />
              <p className="text-muted-foreground text-xs">
                Pick a saved venue or type one manually.
              </p>
              <Label htmlFor={venueId}>Venue</Label>
              <Input
                id={venueId}
                name="venue_name"
                placeholder="Match venue"
                maxLength={120}
                value={venueName}
                onChange={(event) => {
                  setVenueName(event.target.value)
                  if (selectedVenueId) {
                    setSelectedVenueId("")
                  }
                }}
                disabled={isPending}
              />
              <input type="hidden" name="venue_id" value={selectedVenueId} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={notesId}>Notes</Label>
            <Textarea
              id={notesId}
              name="notes"
              placeholder="Add any additional notes..."
              rows={4}
              maxLength={500}
              disabled={isPending}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          disabled={isPending}
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending} className="sm:min-w-[160px]">
          {isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
          Schedule Match
        </Button>
      </div>
    </form>
  )
}
