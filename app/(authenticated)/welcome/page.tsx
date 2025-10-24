export const dynamic = "force-dynamic"

import { AlertCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DashboardStats } from "./_components/dashboard-stats"
import { QuickActionsCard } from "./_components/quick-actions-card"
import { RecentPerformanceSection } from "./_components/recent-performance-section"
import { UpcomingMatchesSection } from "./_components/upcoming-matches-section"
import { getDashboardData } from "./actions"

/**
 * Primary dashboard entry point that displays an overview of the referee's
 * activity including quick stats, upcoming matches, and recent performance.
 *
 * Server component that fetches data from Supabase and renders the dashboard.
 */
export default async function DashboardPage() {
  const { data, error } = await getDashboardData()

  if (error || !data) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Welcome</h1>
          <p className="text-muted-foreground">Your RefZone dashboard</p>
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/50 bg-destructive/10 p-8 text-center">
          <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
          <h2 className="mb-2 font-semibold text-lg">
            Failed to Load Dashboard
          </h2>
          <p className="mb-4 text-muted-foreground text-sm">
            {error ||
              "An unexpected error occurred while loading your dashboard."}
          </p>
          <Button asChild variant="outline">
            <Link href="/matches">View Matches</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { quickStats, upcomingMatches, recentMatches } = data

  const isNewUser =
    quickStats.matchesThisMonth === 0 &&
    upcomingMatches.length === 0 &&
    recentMatches.length === 0

  if (isNewUser) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Welcome</h1>
          <p className="text-muted-foreground">Your RefZone dashboard</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-12 text-center">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Welcome to RefZone!</h2>
            <p className="mx-auto max-w-[500px] text-muted-foreground">
              Get started by scheduling your first match or exploring the
              app&apos;s features. Your dashboard will display performance
              insights as you complete matches.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/matches/create">Schedule Your First Match</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-4 text-left sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">Track Matches</h3>
              <p className="text-muted-foreground text-xs">
                Record and manage your match assignments
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">Self-Assessment</h3>
              <p className="text-muted-foreground text-xs">
                Evaluate your performance after each match
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">View Analytics</h3>
              <p className="text-muted-foreground text-xs">
                Analyze trends and improve your refereeing
              </p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Welcome</h1>
        <p className="text-muted-foreground">Your RefZone dashboard</p>
      </div>

      <section>
        <DashboardStats stats={quickStats} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UpcomingMatchesSection matches={upcomingMatches} />
          <RecentPerformanceSection matches={recentMatches} />
        </div>
        <div className="lg:col-span-1">
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
