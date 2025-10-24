export const dynamic = "force-dynamic"

import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Button } from "@/components/ui/button"
import { getMatchById, getScheduledMatchById } from "@/lib/data/matches"
import type { Match, ScheduledMatch } from "@/lib/types/matches"

import { MatchHeader } from "./_components/match-header"
import { MatchMetadata } from "./_components/match-metadata"

interface MatchDetailPageProps {
  params: Promise<{ id: string }>
}

/**
 * Displays a detailed view for a single match (completed or scheduled) scoped
 * to the authenticated referee. Falls back to the scheduled match table when no
 * completed match exists with the provided identifier.
 */
export default async function MatchDetailPage({
  params,
}: MatchDetailPageProps) {
  const { id } = await params

  let match: Match | ScheduledMatch | null = await getMatchById(id)
  let isCompleted = Boolean(match)

  if (!match) {
    const scheduledMatch = await getScheduledMatchById(id)
    if (scheduledMatch) {
      match = scheduledMatch
      isCompleted = false
    }
  }

  if (!match) {
    notFound()
  }

  return (
    <div className="container mx-auto space-y-10 p-6">
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/matches">
          <ArrowLeft className="mr-2 size-4" />
          Back to Matches
        </Link>
      </Button>

      <MatchHeader match={match} isCompleted={isCompleted} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <MatchMetadata match={match} isCompleted={isCompleted} />

        {isCompleted ? (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg">Match Statistics</h3>
            <p className="text-muted-foreground text-sm">
              Detailed statistics and event timelines will appear here in a
              future update.
            </p>
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-6">
            <h3 className="font-semibold text-lg">Preparation Notes</h3>
            <p className="text-muted-foreground text-sm">
              Confirm kick-off logistics and arrive early to complete your match
              report once the assignment is finished.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
