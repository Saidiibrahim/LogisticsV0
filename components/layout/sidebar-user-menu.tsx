"use client"

import { User } from "lucide-react"
import Link from "next/link"
import { LogoutButton } from "@/components/logout-button"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { useUser } from "@/hooks/use-user"
import { formatRole } from "@/lib/auth/permissions"

interface SidebarUserMenuProps {
  userEmail?: string
  userName?: string
  subscriptionTier?: string
}

export function SidebarUserMenu({
  userEmail,
  userName,
  subscriptionTier,
}: SidebarUserMenuProps) {
  const { role } = useUser()
  const isPricingEnabled =
    process.env.NEXT_PUBLIC_FEATURE_PRICING_PAGE_ENABLED === "true"
  const displayName = userName ?? userEmail ?? "Account"
  const planLabel = subscriptionTier ?? "Free tier"
  const formattedRole = formatRole(role)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              aria-label="User menu"
              className="w-full justify-start gap-3 rounded-lg border border-border bg-secondary/20 px-3 py-2 text-left hover:bg-secondary/30 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-2"
              size="lg"
              tooltip="User menu"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/50 text-secondary-foreground">
                <User aria-hidden="true" className="h-4 w-4" />
              </span>
              <span className="flex min-w-0 flex-1 flex-col group-data-[collapsible=icon]:hidden">
                <span className="truncate text-sm font-medium">
                  {displayName}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {planLabel}
                </span>
              </span>
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56" side="top">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">
                  {planLabel}
                </span>
                {userEmail && (
                  <span className="truncate text-xs text-muted-foreground">
                    {userEmail}
                  </span>
                )}
                <Badge variant="secondary" className="mt-2 w-fit text-xs">
                  {formattedRole}
                </Badge>
              </div>
            </DropdownMenuLabel>
            {isPricingEnabled ? (
              <DropdownMenuItem asChild>
                <Link href="/pricing">View pricing</Link>
              </DropdownMenuItem>
            ) : null}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings">Settings</Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <div className="w-full">
                <LogoutButton />
              </div>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
