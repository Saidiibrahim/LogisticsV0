"use client"

import { Loader2, MapPin, Pencil, Plus, Trash2 } from "lucide-react"
import {
  type FormEvent,
  useCallback,
  useEffect,
  useId,
  useMemo,
  useState,
} from "react"

import { Alert, AlertDescription } from "@/components/ui/alert"
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
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type {
  CreateVenueInput,
  UpdateVenueInput,
  Venue,
} from "@/lib/types/library"
import {
  createVenue,
  deleteVenue,
  getVenues,
  updateVenue,
} from "../_actions/venue-actions"

interface ManagedVenue extends Venue {
  isDeleting?: boolean
}

interface VenueFormPayloads {
  createPayload: CreateVenueInput
  updatePayload: UpdateVenueInput
}

function parseVenueForm(form: HTMLFormElement): VenueFormPayloads {
  const formData = new FormData(form)

  const name = formData.get("name")?.toString().trim() ?? ""
  const city = formData.get("city")?.toString().trim() ?? ""
  const country = formData.get("country")?.toString().trim() ?? ""
  const latitudeRaw = formData.get("latitude")?.toString().trim() ?? ""
  const longitudeRaw = formData.get("longitude")?.toString().trim() ?? ""

  if (!name) {
    throw new Error("Please provide a venue name.")
  }

  const latitude =
    latitudeRaw.length > 0 ? Number.parseFloat(latitudeRaw) : undefined
  const longitude =
    longitudeRaw.length > 0 ? Number.parseFloat(longitudeRaw) : undefined

  if (latitudeRaw.length > 0 && Number.isNaN(latitude)) {
    throw new Error("Latitude must be a number.")
  }

  if (longitudeRaw.length > 0 && Number.isNaN(longitude)) {
    throw new Error("Longitude must be a number.")
  }

  const createPayload: CreateVenueInput = {
    name,
    city: city || undefined,
    country: country || undefined,
    latitude,
    longitude,
  }

  const updatePayload: UpdateVenueInput = {
    name,
    city: city || null,
    country: country || null,
    latitude: latitudeRaw.length > 0 ? Number.parseFloat(latitudeRaw) : null,
    longitude: longitudeRaw.length > 0 ? Number.parseFloat(longitudeRaw) : null,
  }

  return { createPayload, updatePayload }
}

function sortVenues(venues: ManagedVenue[]): ManagedVenue[] {
  return [...venues].sort((a, b) => a.name.localeCompare(b.name))
}

function formatCoordinates(latitude: number | null, longitude: number | null) {
  if (latitude === null || longitude === null) {
    return "—"
  }

  return `${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
}

/**
 * Venues library section for Settings. Allows creation and maintenance of
 * frequently used stadiums/grounds, improving match form efficiency.
 */
export function VenuesLibrarySection() {
  const [venues, setVenues] = useState<ManagedVenue[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingVenue, setEditingVenue] = useState<ManagedVenue | null>(null)
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedVenue | null>(null)

  const venueNameInputId = useId()
  const venueCityInputId = useId()
  const venueCountryInputId = useId()
  const venueLatitudeInputId = useId()
  const venueLongitudeInputId = useId()

  const sortedVenues = useMemo(() => sortVenues(venues), [venues])

  const refreshVenues = useCallback(async () => {
    setIsLoading(true)
    setLoadError(undefined)
    try {
      const data = await getVenues()
      setVenues(sortVenues(data))
    } catch (error) {
      console.error("[settings] Failed to fetch venues:", error)
      setLoadError("We could not load your venues. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getVenues()
        if (active) {
          setVenues(sortVenues(data))
          setLoadError(undefined)
        }
      } catch (error) {
        if (active) {
          console.error("[settings] Failed to fetch venues:", error)
          setLoadError("We could not load your venues. Please try again.")
        }
      } finally {
        if (active) {
          setIsLoading(false)
        }
      }
    })()

    return () => {
      active = false
    }
  }, [])

  const closeDialog = () => {
    setIsDialogOpen(false)
    setEditingVenue(null)
    setActionError(undefined)
    setIsDialogSubmitting(false)
  }

  const handleCreateVenue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const { createPayload } = parseVenueForm(
        event.currentTarget as HTMLFormElement
      )
      const created = await createVenue(createPayload)
      setVenues((prev) => sortVenues([...prev, created]))
      ;(event.currentTarget as HTMLFormElement).reset()
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to create venue:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to create venue."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleUpdateVenue = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const target = editingVenue
      if (!target) {
        throw new Error("No venue selected for editing.")
      }

      const { updatePayload } = parseVenueForm(
        event.currentTarget as HTMLFormElement
      )
      const updated = await updateVenue(target.id, updatePayload)
      setVenues((prev) =>
        sortVenues(
          prev.map((venue) => (venue.id === updated.id ? updated : venue))
        )
      )
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to update venue:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to update venue."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleDeleteVenue = async () => {
    if (!deleteTarget) {
      return
    }

    setVenues((prev) =>
      prev.map((venue) =>
        venue.id === deleteTarget.id ? { ...venue, isDeleting: true } : venue
      )
    )
    setActionError(undefined)

    try {
      await deleteVenue(deleteTarget.id)
      setVenues((prev) => prev.filter((venue) => venue.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error("[settings] Failed to delete venue:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to delete venue."
      )
      setVenues((prev) =>
        prev.map((venue) =>
          venue.id === deleteTarget.id ? { ...venue, isDeleting: false } : venue
        )
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-base">Venues</h3>
          <p className="text-muted-foreground text-sm">
            Save match locations and reuse them quickly.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingVenue(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Venue
        </Button>
      </div>

      {actionError && (
        <Alert variant="destructive">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          Loading venues…
        </div>
      ) : loadError ? (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={refreshVenues}>
            Retry
          </Button>
        </div>
      ) : sortedVenues.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You have not added any venues yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Name</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Coordinates</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedVenues.map((venue) => (
                <TableRow key={venue.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="size-4 text-muted-foreground" />
                      {venue.name}
                    </div>
                  </TableCell>
                  <TableCell>
                    {venue.city || venue.country
                      ? [venue.city, venue.country].filter(Boolean).join(", ")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {formatCoordinates(venue.latitude, venue.longitude)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingVenue(venue)
                          setIsDialogOpen(true)
                        }}
                        aria-label={`Edit ${venue.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(venue)}
                        aria-label={`Delete ${venue.name}`}
                        disabled={venue.isDeleting}
                      >
                        {venue.isDeleting ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Trash2 className="size-4 text-destructive" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog
        open={isDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingVenue ? "Edit Venue" : "Add New Venue"}
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={editingVenue ? handleUpdateVenue : handleCreateVenue}
          >
            <div className="space-y-2">
              <Label htmlFor={venueNameInputId}>
                Venue Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={venueNameInputId}
                name="name"
                defaultValue={editingVenue?.name ?? ""}
                placeholder="e.g., Riverside Stadium"
                maxLength={120}
                required
                disabled={isDialogSubmitting}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={venueCityInputId}>City</Label>
                <Input
                  id={venueCityInputId}
                  name="city"
                  defaultValue={editingVenue?.city ?? ""}
                  placeholder="e.g., London"
                  maxLength={120}
                  disabled={isDialogSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={venueCountryInputId}>Country</Label>
                <Input
                  id={venueCountryInputId}
                  name="country"
                  defaultValue={editingVenue?.country ?? ""}
                  placeholder="e.g., United Kingdom"
                  maxLength={120}
                  disabled={isDialogSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={venueLatitudeInputId}>Latitude</Label>
                <Input
                  id={venueLatitudeInputId}
                  name="latitude"
                  type="number"
                  step="0.0001"
                  defaultValue={editingVenue?.latitude ?? ""}
                  placeholder="e.g., 51.5074"
                  disabled={isDialogSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={venueLongitudeInputId}>Longitude</Label>
                <Input
                  id={venueLongitudeInputId}
                  name="longitude"
                  type="number"
                  step="0.0001"
                  defaultValue={editingVenue?.longitude ?? ""}
                  placeholder="e.g., -0.1278"
                  disabled={isDialogSubmitting}
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeDialog}
                disabled={isDialogSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isDialogSubmitting}>
                {isDialogSubmitting && (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                )}
                {editingVenue ? "Save Changes" : "Create Venue"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null)
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete venue</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. Are you sure you want to delete{" "}
              <strong>{deleteTarget?.name}</strong> from your library?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setDeleteTarget(null)}
              disabled={deleteTarget?.isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteVenue}
              disabled={deleteTarget?.isDeleting}
            >
              {deleteTarget?.isDeleting && (
                <Loader2 className="mr-2 size-4 animate-spin" />
              )}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
