import { Calendar, Map, Package, Plus } from "lucide-react"
import Link from "next/link"
import type { ComponentType } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface QuickAction {
  icon: ComponentType<{ className?: string }>
  label: string
  href: string
  variant?: "default" | "outline"
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    icon: Plus,
    label: "Create Roster",
    href: "/calendar",
    variant: "default",
  },
  {
    icon: Calendar,
    label: "View Calendar",
    href: "/calendar",
    variant: "outline",
  },
  {
    icon: Package,
    label: "Deliveries",
    href: "/calendar",
    variant: "outline",
  },
  {
    icon: Map,
    label: "Routes",
    href: "/calendar",
    variant: "outline",
  },
]

/**
 * Quick actions card component for dashboard navigation.
 *
 * Provides one-click access to common logistics and driver management tasks.
 *
 * @example
 * ```tsx
 * <QuickActionsCard />
 * ```
 */
export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon

            return (
              <Button
                key={action.href}
                variant={action.variant}
                className="justify-start"
                asChild
              >
                <Link href={action.href}>
                  <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                  {action.label}
                </Link>
              </Button>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
