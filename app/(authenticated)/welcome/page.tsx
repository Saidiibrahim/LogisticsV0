export const dynamic = "force-dynamic"

import { AlertCircle } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { DashboardStats } from "./_components/dashboard-stats"
import { QuickActionsCard } from "./_components/quick-actions-card"
import { RecentRostersSection } from "./_components/recent-rosters-section"
import { UpcomingAssignmentsSection } from "./_components/upcoming-assignments-section"
import { getDashboardData } from "./actions"

/**
 * Primary dashboard entry point that displays an overview of the logistics
 * operation including quick stats, upcoming driver assignments, and recent roster activity.
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
          <p className="text-muted-foreground">Your CourierRun dashboard</p>
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
            <Link href="/calendar">View Calendar</Link>
          </Button>
        </div>
      </div>
    )
  }

  const { quickStats, upcomingAssignments, recentRosters } = data

  const isNewUser =
    quickStats.activeDrivers === 0 &&
    upcomingAssignments.length === 0 &&
    recentRosters.length === 0

  if (isNewUser) {
    return (
      <div className="container mx-auto space-y-6 p-6">
        <div>
          <h1 className="font-bold text-3xl tracking-tight">Welcome</h1>
          <p className="text-muted-foreground">Your CourierRun dashboard</p>
        </div>

        <div className="flex flex-col items-center justify-center gap-6 rounded-lg border border-dashed p-12 text-center">
          <div className="space-y-2">
            <h2 className="font-semibold text-2xl">Welcome to CourierRun!</h2>
            <p className="mx-auto max-w-[500px] text-muted-foreground">
              Get started by creating your first weekly roster or exploring the
              app&apos;s features. Your dashboard will display logistics
              insights as you manage driver assignments.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <Button asChild size="lg">
              <Link href="/calendar">Create Your First Roster</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/calendar">View Calendar</Link>
            </Button>
          </div>

          <div className="mt-4 grid gap-4 text-left sm:grid-cols-2 md:grid-cols-3">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">Manage Rosters</h3>
              <p className="text-muted-foreground text-xs">
                Create and publish weekly driver assignments
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">Track Deliveries</h3>
              <p className="text-muted-foreground text-xs">
                Monitor delivery progress and driver locations
              </p>
            </div>
            <div className="rounded-lg border bg-muted/50 p-4">
              <h3 className="mb-1 font-medium text-sm">View Insights</h3>
              <p className="text-muted-foreground text-xs">
                Analyze delivery trends and fleet utilization
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
        <p className="text-muted-foreground">Your CourierRun dashboard</p>
      </div>

      <section>
        <DashboardStats stats={quickStats} />
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <UpcomingAssignmentsSection assignments={upcomingAssignments} />
          <RecentRostersSection rosters={recentRosters} />
        </div>
        <div className="lg:col-span-1">
          <QuickActionsCard />
        </div>
      </div>
    </div>
  )
}
