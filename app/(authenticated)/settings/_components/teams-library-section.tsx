"use client"

import { Loader2, Pencil, Plus, Trash2 } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
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
  CreateTeamInput,
  Team,
  UpdateTeamInput,
} from "@/lib/types/library"
import {
  createTeam,
  deleteTeam,
  getTeams,
  updateTeam,
} from "../_actions/team-actions"

interface ManagedTeam extends Team {
  isDeleting?: boolean
}

interface TeamFormPayloads {
  createPayload: CreateTeamInput
  updatePayload: UpdateTeamInput
}

function parseTeamForm(form: HTMLFormElement): TeamFormPayloads {
  const formData = new FormData(form)

  const name = formData.get("name")?.toString().trim() ?? ""
  const shortName = formData.get("short_name")?.toString().trim() ?? ""
  const division = formData.get("division")?.toString().trim() ?? ""
  const colorPrimary = formData.get("color_primary")?.toString().trim() ?? ""
  const colorSecondary =
    formData.get("color_secondary")?.toString().trim() ?? ""

  if (!name) {
    throw new Error("Please provide a team name.")
  }

  const createPayload: CreateTeamInput = {
    name,
    short_name: shortName || undefined,
    division: division || undefined,
    color_primary: colorPrimary || undefined,
    color_secondary: colorSecondary || undefined,
  }

  const updatePayload: UpdateTeamInput = {
    name,
    short_name: shortName || null,
    division: division || null,
    color_primary: colorPrimary || null,
    color_secondary: colorSecondary || null,
  }

  return { createPayload, updatePayload }
}

function sortTeams(teams: ManagedTeam[]): ManagedTeam[] {
  return [...teams].sort((a, b) => a.name.localeCompare(b.name))
}

function renderColorBadge(label: string, color: string | null) {
  if (!color) {
    return null
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-muted-foreground text-xs">{label}</span>
      <Badge
        variant="secondary"
        className="flex items-center gap-2 px-2 py-1 text-xs"
      >
        <span
          aria-hidden="true"
          className="size-4 rounded-full border"
          style={{ backgroundColor: color }}
        />
        {color}
      </Badge>
    </div>
  )
}

/**
 * Teams library management section for the Settings page. Provides a CRUD
 * interface backed by Supabase server actions so referees can manage their
 * frequently used teams and quickly re-use them when scheduling matches.
 */
export function TeamsLibrarySection() {
  const [teams, setTeams] = useState<ManagedTeam[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingTeam, setEditingTeam] = useState<ManagedTeam | null>(null)
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedTeam | null>(null)

  const teamNameInputId = useId()
  const teamShortNameInputId = useId()
  const teamDivisionInputId = useId()
  const teamPrimaryColorInputId = useId()
  const teamSecondaryColorInputId = useId()

  const sortedTeams = useMemo(() => sortTeams(teams), [teams])

  const refreshTeams = useCallback(async () => {
    setIsLoading(true)
    setLoadError(undefined)

    try {
      const data = await getTeams()
      setTeams(sortTeams(data))
    } catch (error) {
      console.error("[settings] Failed to fetch teams:", error)
      setLoadError("We could not load your teams. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getTeams()
        if (active) {
          setTeams(sortTeams(data))
          setLoadError(undefined)
        }
      } catch (error) {
        if (active) {
          console.error("[settings] Failed to fetch teams:", error)
          setLoadError("We could not load your teams. Please try again.")
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
    setIsAddDialogOpen(false)
    setEditingTeam(null)
    setActionError(undefined)
    setIsDialogSubmitting(false)
  }

  const handleCreateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const { createPayload } = parseTeamForm(
        event.currentTarget as HTMLFormElement
      )

      const created = await createTeam(createPayload)
      setTeams((prev) => sortTeams([...prev, created]))
      ;(event.currentTarget as HTMLFormElement).reset()
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to create team:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to create team."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleUpdateTeam = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const target = editingTeam
      if (!target) {
        throw new Error("No team selected for editing.")
      }

      const { updatePayload } = parseTeamForm(
        event.currentTarget as HTMLFormElement
      )

      const updated = await updateTeam(target.id, updatePayload)
      setTeams((prev) =>
        sortTeams(prev.map((team) => (team.id === updated.id ? updated : team)))
      )
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to update team:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to update team."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleDeleteTeam = async () => {
    if (!deleteTarget) {
      return
    }

    setTeams((prev) =>
      prev.map((team) =>
        team.id === deleteTarget.id ? { ...team, isDeleting: true } : team
      )
    )
    setActionError(undefined)

    try {
      await deleteTeam(deleteTarget.id)
      setTeams((prev) => prev.filter((team) => team.id !== deleteTarget.id))
      setDeleteTarget(null)
    } catch (error) {
      console.error("[settings] Failed to delete team:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to delete team."
      )
      setTeams((prev) =>
        prev.map((team) =>
          team.id === deleteTarget.id ? { ...team, isDeleting: false } : team
        )
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-base">Teams</h3>
          <p className="text-muted-foreground text-sm">
            Create quick picks for frequent assignments.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingTeam(null)
            setIsAddDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Team
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
          Loading teams…
        </div>
      ) : loadError ? (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={refreshTeams}>
            Retry
          </Button>
        </div>
      ) : sortedTeams.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You have not added any teams yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Name</TableHead>
                <TableHead>Short Name</TableHead>
                <TableHead>Division</TableHead>
                <TableHead>Colors</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedTeams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell>{team.short_name ?? "—"}</TableCell>
                  <TableCell>{team.division ?? "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-2">
                      {renderColorBadge("Primary", team.color_primary)}
                      {renderColorBadge("Secondary", team.color_secondary)}
                      {!team.color_primary && !team.color_secondary && "—"}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTeam(team)
                          setIsAddDialogOpen(true)
                        }}
                        aria-label={`Edit ${team.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(team)}
                        aria-label={`Delete ${team.name}`}
                        disabled={team.isDeleting}
                      >
                        {team.isDeleting ? (
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
        open={isAddDialogOpen}
        onOpenChange={(open) => !open && closeDialog()}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingTeam ? "Edit Team" : "Add New Team"}
            </DialogTitle>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={editingTeam ? handleUpdateTeam : handleCreateTeam}
          >
            <div className="space-y-2">
              <Label htmlFor={teamNameInputId}>
                Team Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={teamNameInputId}
                name="name"
                defaultValue={editingTeam?.name ?? ""}
                placeholder="e.g., City FC"
                maxLength={120}
                required
                disabled={isDialogSubmitting}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={teamShortNameInputId}>Short Name</Label>
                <Input
                  id={teamShortNameInputId}
                  name="short_name"
                  defaultValue={editingTeam?.short_name ?? ""}
                  placeholder="e.g., CFC"
                  maxLength={10}
                  disabled={isDialogSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={teamDivisionInputId}>Division</Label>
                <Input
                  id={teamDivisionInputId}
                  name="division"
                  defaultValue={editingTeam?.division ?? ""}
                  placeholder="e.g., Premier League"
                  maxLength={120}
                  disabled={isDialogSubmitting}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor={teamPrimaryColorInputId}>Primary Color</Label>
                <Input
                  id={teamPrimaryColorInputId}
                  name="color_primary"
                  defaultValue={editingTeam?.color_primary ?? ""}
                  placeholder="#0055A4"
                  maxLength={12}
                  disabled={isDialogSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={teamSecondaryColorInputId}>
                  Secondary Color
                </Label>
                <Input
                  id={teamSecondaryColorInputId}
                  name="color_secondary"
                  defaultValue={editingTeam?.color_secondary ?? ""}
                  placeholder="#FFFFFF"
                  maxLength={12}
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
                {editingTeam ? "Save Changes" : "Create Team"}
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
            <AlertDialogTitle>Delete team</AlertDialogTitle>
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
              onClick={handleDeleteTeam}
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
