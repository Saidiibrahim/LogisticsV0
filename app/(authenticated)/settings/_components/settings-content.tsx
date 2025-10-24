"use client"

import { selectUserEmail, useUserStore } from "@/lib/stores/use-user-store"
import { CompetitionsLibrarySection } from "./competitions-library-section"
import { TeamsLibrarySection } from "./teams-library-section"
import { VenuesLibrarySection } from "./venues-library-section"

/**
 * Settings page content consolidating profile details, preferences, and the
 * new library management sections for teams, venues, and competitions.
 */
export function SettingsContent() {
  const userEmail = useUserStore(selectUserEmail)

  return (
    <div className="container mx-auto space-y-6 p-6">
      <div>
        <h1 className="font-bold text-3xl tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your account, libraries, and preferences
        </p>
      </div>

      <div className="grid gap-6">
        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 font-semibold text-lg">Profile</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">Email</span>
              <span className="font-medium text-sm">
                {userEmail ?? "Unknown"}
              </span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-2 font-semibold text-lg">Teams Library</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Create and manage teams for quick selection when scheduling new
            matches.
          </p>
          <TeamsLibrarySection />
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-2 font-semibold text-lg">Venues Library</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Store stadiums and match locations that you frequently officiate.
          </p>
          <VenuesLibrarySection />
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-2 font-semibold text-lg">Competitions Library</h2>
          <p className="mb-4 text-muted-foreground text-sm">
            Keep track of leagues and tournaments for future assignments.
          </p>
          <CompetitionsLibrarySection />
        </div>

        <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
          <h2 className="mb-4 font-semibold text-lg">Preferences</h2>
          <p className="text-muted-foreground text-sm">
            Theme settings and preferences will appear here
          </p>
        </div>
      </div>
    </div>
  )
}
