export const dynamic = "force-dynamic"

import { AlertCircle } from "lucide-react"
import Link from "next/link"

import { getMatchStats } from "@/lib/actions/get-stats"

import { RecentMatchesTable } from "./_components/recent-matches-table"
import { StatsOverview } from "./_components/stats-overview"

/**
 * Server component that renders the stats/analytics dashboard.
 * Fetches match statistics for the authenticated user and displays
 * overview metrics alongside recent match history.
 */
export default async function AnalyticsPage() {
  const { data, error } = await getMatchStats({
    period: "3m",
    limit: 10,
  })

  if (error || !data) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Stats</h1>
          <p className="text-muted-foreground">
            Performance insights and trends
          </p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 font-semibold text-lg">Failed to Load Stats</h2>
          <p className="text-muted-foreground text-sm">
            {error ||
              "An unexpected error occurred while loading your statistics."}
          </p>
        </div>
      </div>
    )
  }

  if (data.overview.totalMatches === 0) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Stats</h1>
          <p className="text-muted-foreground">
            Performance insights and trends
          </p>
        </div>

        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <div>
            <h2 className="mb-2 font-semibold text-lg">No Matches Yet</h2>
            <p className="text-muted-foreground text-sm">
              Once you complete your first match, your performance statistics
              will appear here.
            </p>
          </div>
          <Link
            href="/matches/create"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground text-sm font-medium transition hover:bg-primary/90"
          >
            Create Your First Match
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-8 p-6">
      <header>
        <h1 className="font-bold text-3xl tracking-tight">Stats</h1>
        <p className="text-muted-foreground">
          Performance insights from the last 3 months
        </p>
      </header>

      <section>
        <h2 className="mb-4 font-semibold text-lg">Overview</h2>
        <StatsOverview stats={data.overview} />
      </section>

      <section>
        <h2 className="mb-4 font-semibold text-lg">Recent Matches</h2>
        <RecentMatchesTable matches={data.recentMatches} />
      </section>
    </div>
  )
}
