"use client"

import { Loader2, Pencil, Plus, Trash2, Trophy } from "lucide-react"
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
  Competition,
  CreateCompetitionInput,
  UpdateCompetitionInput,
} from "@/lib/types/library"
import {
  createCompetition,
  deleteCompetition,
  getCompetitions,
  updateCompetition,
} from "../_actions/competition-actions"

interface ManagedCompetition extends Competition {
  isDeleting?: boolean
}

interface CompetitionFormPayloads {
  createPayload: CreateCompetitionInput
  updatePayload: UpdateCompetitionInput
}

function parseCompetitionForm(form: HTMLFormElement): CompetitionFormPayloads {
  const formData = new FormData(form)

  const name = formData.get("name")?.toString().trim() ?? ""
  const level = formData.get("level")?.toString().trim() ?? ""

  if (!name) {
    throw new Error("Please provide a competition name.")
  }

  const createPayload: CreateCompetitionInput = {
    name,
    level: level || undefined,
  }

  const updatePayload: UpdateCompetitionInput = {
    name,
    level: level || null,
  }

  return { createPayload, updatePayload }
}

function sortCompetitions(
  competitions: ManagedCompetition[]
): ManagedCompetition[] {
  return [...competitions].sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Competitions library section for Settings. Stores leagues/tournaments that
 * can be quickly attached to scheduled matches.
 */
export function CompetitionsLibrarySection() {
  const [competitions, setCompetitions] = useState<ManagedCompetition[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string>()
  const [actionError, setActionError] = useState<string>()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [editingCompetition, setEditingCompetition] =
    useState<ManagedCompetition | null>(null)
  const [isDialogSubmitting, setIsDialogSubmitting] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ManagedCompetition | null>(
    null
  )

  const competitionNameInputId = useId()
  const competitionLevelInputId = useId()

  const sortedCompetitions = useMemo(
    () => sortCompetitions(competitions),
    [competitions]
  )

  const refreshCompetitions = useCallback(async () => {
    setIsLoading(true)
    setLoadError(undefined)
    try {
      const data = await getCompetitions()
      setCompetitions(sortCompetitions(data))
    } catch (error) {
      console.error("[settings] Failed to fetch competitions:", error)
      setLoadError("We could not load your competitions. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    let active = true
    ;(async () => {
      try {
        const data = await getCompetitions()
        if (active) {
          setCompetitions(sortCompetitions(data))
          setLoadError(undefined)
        }
      } catch (error) {
        if (active) {
          console.error("[settings] Failed to fetch competitions:", error)
          setLoadError("We could not load your competitions. Please try again.")
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
    setEditingCompetition(null)
    setActionError(undefined)
    setIsDialogSubmitting(false)
  }

  const handleCreateCompetition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const { createPayload } = parseCompetitionForm(
        event.currentTarget as HTMLFormElement
      )
      const created = await createCompetition(createPayload)
      setCompetitions((prev) => sortCompetitions([...prev, created]))
      ;(event.currentTarget as HTMLFormElement).reset()
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to create competition:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to create competition."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleUpdateCompetition = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsDialogSubmitting(true)
    setActionError(undefined)

    try {
      const target = editingCompetition
      if (!target) {
        throw new Error("No competition selected for editing.")
      }

      const { updatePayload } = parseCompetitionForm(
        event.currentTarget as HTMLFormElement
      )
      const updated = await updateCompetition(target.id, updatePayload)
      setCompetitions((prev) =>
        sortCompetitions(
          prev.map((competition) =>
            competition.id === updated.id ? updated : competition
          )
        )
      )
      closeDialog()
    } catch (error) {
      console.error("[settings] Failed to update competition:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to update competition."
      )
    } finally {
      setIsDialogSubmitting(false)
    }
  }

  const handleDeleteCompetition = async () => {
    if (!deleteTarget) {
      return
    }

    setCompetitions((prev) =>
      prev.map((competition) =>
        competition.id === deleteTarget.id
          ? { ...competition, isDeleting: true }
          : competition
      )
    )
    setActionError(undefined)

    try {
      await deleteCompetition(deleteTarget.id)
      setCompetitions((prev) =>
        prev.filter((competition) => competition.id !== deleteTarget.id)
      )
      setDeleteTarget(null)
    } catch (error) {
      console.error("[settings] Failed to delete competition:", error)
      setActionError(
        error instanceof Error ? error.message : "Failed to delete competition."
      )
      setCompetitions((prev) =>
        prev.map((competition) =>
          competition.id === deleteTarget.id
            ? { ...competition, isDeleting: false }
            : competition
        )
      )
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-semibold text-base">Competitions</h3>
          <p className="text-muted-foreground text-sm">
            Keep your league and tournament list organised.
          </p>
        </div>

        <Button
          size="sm"
          onClick={() => {
            setEditingCompetition(null)
            setIsDialogOpen(true)
          }}
        >
          <Plus className="mr-2 size-4" />
          Add Competition
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
          Loading competitions…
        </div>
      ) : loadError ? (
        <div className="space-y-2">
          <Alert variant="destructive">
            <AlertDescription>{loadError}</AlertDescription>
          </Alert>
          <Button variant="outline" size="sm" onClick={refreshCompetitions}>
            Retry
          </Button>
        </div>
      ) : sortedCompetitions.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          You have not added any competitions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[220px]">Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedCompetitions.map((competition) => (
                <TableRow key={competition.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Trophy className="size-4 text-muted-foreground" />
                      {competition.name}
                    </div>
                  </TableCell>
                  <TableCell>{competition.level ?? "—"}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingCompetition(competition)
                          setIsDialogOpen(true)
                        }}
                        aria-label={`Edit ${competition.name}`}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget(competition)}
                        aria-label={`Delete ${competition.name}`}
                        disabled={competition.isDeleting}
                      >
                        {competition.isDeleting ? (
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
              {editingCompetition ? "Edit Competition" : "Add New Competition"}
            </DialogTitle>
          </DialogHeader>

          <form
            className="space-y-4"
            onSubmit={
              editingCompetition
                ? handleUpdateCompetition
                : handleCreateCompetition
            }
          >
            <div className="space-y-2">
              <Label htmlFor={competitionNameInputId}>
                Competition Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id={competitionNameInputId}
                name="name"
                defaultValue={editingCompetition?.name ?? ""}
                placeholder="e.g., Premier League"
                maxLength={120}
                required
                disabled={isDialogSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor={competitionLevelInputId}>Level</Label>
              <Input
                id={competitionLevelInputId}
                name="level"
                defaultValue={editingCompetition?.level ?? ""}
                placeholder="e.g., Professional"
                maxLength={120}
                disabled={isDialogSubmitting}
              />
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
                {editingCompetition ? "Save Changes" : "Create Competition"}
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
            <AlertDialogTitle>Delete competition</AlertDialogTitle>
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
              onClick={handleDeleteCompetition}
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
