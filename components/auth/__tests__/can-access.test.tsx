import { render, screen } from "@testing-library/react"
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest"
import type { UserContextValue } from "@/app/(authenticated)/_components/app-chrome"
import type { useUser as useUserType } from "@/hooks/use-user"
import type { CanAccess as CanAccessType } from "../can-access"

vi.mock("@/hooks/use-user", () => ({
  useUser: vi.fn(),
}))

let CanAccess: typeof CanAccessType
let useUser: typeof useUserType

describe("CanAccess", () => {
  beforeAll(async () => {
    const canAccessModule = await import("../can-access")
    const useUserModule = await import("@/hooks/use-user")
    CanAccess = canAccessModule.CanAccess
    useUser = useUserModule.useUser
  })
  afterEach(() => {
    vi.clearAllMocks()
  })

  it("renders children when permission granted", () => {
    vi.mocked(useUser).mockReturnValue({
      userId: "user-1",
      email: "user@example.com",
      fullName: "User Example",
      organizationId: "org-1",
      role: "team-leader",
      hasPermission: (permission) => permission === "events.create",
    } satisfies UserContextValue)

    render(
      <CanAccess permission="events.create">
        <button type="button">Create Event</button>
      </CanAccess>
    )

    expect(screen.getByText("Create Event")).toBeInTheDocument()
  })

  it("renders fallback when permission denied", () => {
    vi.mocked(useUser).mockReturnValue({
      userId: "user-1",
      email: "driver@example.com",
      fullName: "Driver",
      organizationId: "org-1",
      role: "driver",
      hasPermission: () => false,
    } satisfies UserContextValue)

    render(
      <CanAccess permission="events.create" fallback={<span>Nope</span>}>
        <button type="button">Create Event</button>
      </CanAccess>
    )

    expect(screen.queryByText("Create Event")).not.toBeInTheDocument()
    expect(screen.getByText("Nope")).toBeInTheDocument()
  })
})
