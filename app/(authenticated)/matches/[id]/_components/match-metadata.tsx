import { Calendar, Clock, MapPin, StickyNote, Trophy } from "lucide-react"
import type { ComponentType, SVGProps } from "react"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Match, ScheduledMatch } from "@/lib/types/matches"

interface MatchMetadataProps {
  match: Match | ScheduledMatch
  isCompleted: boolean
}

interface MetadataItem {
  icon: ComponentType<SVGProps<SVGSVGElement>>
  label: string
  value: string
}

export function MatchMetadata({ match, isCompleted }: MatchMetadataProps) {
  const completedMatch = isCompleted ? (match as Match) : undefined
  const scheduledMatch = !isCompleted ? (match as ScheduledMatch) : undefined

  const matchDate = new Date(
    (isCompleted ? completedMatch?.started_at : scheduledMatch?.kickoff_at) ??
      Date.now()
  )

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(matchDate)

  const formattedTime = new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(matchDate)

  const durationMinutes =
    completedMatch?.duration_seconds != null
      ? Math.round(completedMatch.duration_seconds / 60)
      : null

  const metadataItems: MetadataItem[] = [
    {
      icon: Calendar,
      label: "Date",
      value: formattedDate,
    },
    {
      icon: Clock,
      label: isCompleted ? "Kickoff (local)" : "Kickoff Time",
      value: formattedTime,
    },
  ]

  if (match.competition_name) {
    metadataItems.push({
      icon: Trophy,
      label: "Competition",
      value: match.competition_name,
    })
  }

  if (match.venue_name) {
    metadataItems.push({
      icon: MapPin,
      label: "Venue",
      value: match.venue_name,
    })
  }

  if (durationMinutes) {
    metadataItems.push({
      icon: Clock,
      label: "Match Duration",
      value: `${durationMinutes} min`,
    })
  }

  const setupItems: MetadataItem[] = []

  if (completedMatch?.regulation_minutes) {
    setupItems.push({
      icon: Clock,
      label: "Regulation Time",
      value: `${completedMatch.regulation_minutes} minutes`,
    })
  }

  if (completedMatch?.number_of_periods) {
    setupItems.push({
      icon: Clock,
      label: "Number of Periods",
      value: `${completedMatch.number_of_periods}`,
    })
  }

  if (completedMatch?.half_time_minutes) {
    setupItems.push({
      icon: Clock,
      label: "Halftime Break",
      value: `${completedMatch.half_time_minutes} minutes`,
    })
  }

  if (completedMatch?.extra_time_enabled) {
    setupItems.push({
      icon: Clock,
      label: "Extra Time",
      value: completedMatch.extra_time_half_minutes
        ? `${completedMatch.extra_time_half_minutes * 2} minutes`
        : "Enabled",
    })
  }

  if (completedMatch?.penalties_enabled) {
    setupItems.push({
      icon: Trophy,
      label: "Penalty Shootout",
      value: `Initial rounds: ${completedMatch.penalty_initial_rounds}`,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Match Information</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-4">
            {metadataItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon className="mt-0.5 size-4 text-muted-foreground" />
                <div className="space-y-1">
                  <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                    {label}
                  </dt>
                  <dd className="font-medium text-sm sm:text-base">{value}</dd>
                </div>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {setupItems.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Match Setup</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="space-y-4">
              {setupItems.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="mt-0.5 size-4 text-muted-foreground" />
                  <div className="space-y-1">
                    <dt className="text-muted-foreground text-xs uppercase tracking-wide">
                      {label}
                    </dt>
                    <dd className="font-medium text-sm sm:text-base">
                      {value}
                    </dd>
                  </div>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      )}

      {scheduledMatch?.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <StickyNote className="size-4 text-muted-foreground" />
              Notes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-sm leading-relaxed">
              {scheduledMatch.notes}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
