export const dynamic = "force-dynamic"

import { Plus } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { getGroupedMatchesSafe } from "@/lib/data/matches"

import { MatchList } from "./_components/match-list"

/**
 * Lists historical match assignments for the authenticated referee,
 * organized by recency buckets so the match history is easy to scan.
 */
export default async function MatchesPage() {
  const matches = await getGroupedMatchesSafe()

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Matches</h1>
          <p className="text-muted-foreground">
            Browse your upcoming assignments and past performances.
          </p>
        </div>
        <Button asChild size="lg">
          <Link href="/matches/create">
            <Plus className="size-4" />
            Schedule Match
          </Link>
        </Button>
      </div>

      <MatchList matches={matches} />
    </div>
  )
}
