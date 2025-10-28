import { describe, expect, it } from "vitest"

import { formatRole, hasPermission, ROLE_PERMISSIONS } from "../permissions"

describe("permissions utilities", () => {
  describe("hasPermission", () => {
    it("grants drivers permission to view events", () => {
      expect(hasPermission("driver", "events.view")).toBe(true)
    })

    it("denies drivers permission to create events", () => {
      expect(hasPermission("driver", "events.create")).toBe(false)
    })

    it("grants team leaders permission to create events", () => {
      expect(hasPermission("team-leader", "events.create")).toBe(true)
    })

    it("grants team leaders permission to publish rosters", () => {
      expect(hasPermission("team-leader", "rosters.publish")).toBe(true)
    })

    it("grants admins all permissions", () => {
      expect(hasPermission("admin", "events.create")).toBe(true)
      expect(hasPermission("admin", "rosters.publish")).toBe(true)
      expect(hasPermission("admin", "users.manage")).toBe(true)
      expect(hasPermission("admin", "organizations.manage")).toBe(true)
    })

    it("denies customer support write permissions", () => {
      expect(hasPermission("customer-support", "events.create")).toBe(false)
      expect(hasPermission("customer-support", "rosters.publish")).toBe(false)
    })

    it("grants customer support read permissions", () => {
      expect(hasPermission("customer-support", "events.view")).toBe(true)
      expect(hasPermission("customer-support", "rosters.view")).toBe(true)
    })
  })

  describe("formatRole", () => {
    it("formats driver role", () => {
      expect(formatRole("driver")).toBe("Driver")
    })

    it("formats team-leader role", () => {
      expect(formatRole("team-leader")).toBe("Team Leader")
    })

    it("formats customer-support role", () => {
      expect(formatRole("customer-support")).toBe("Customer Support")
    })

    it("formats retail-officer role", () => {
      expect(formatRole("retail-officer")).toBe("Retail Officer")
    })

    it("formats admin role", () => {
      expect(formatRole("admin")).toBe("Administrator")
    })
  })

  describe("ROLE_PERMISSIONS mapping", () => {
    it("defines permissions for all roles", () => {
      expect(ROLE_PERMISSIONS.driver).toBeDefined()
      expect(ROLE_PERMISSIONS["team-leader"]).toBeDefined()
      expect(ROLE_PERMISSIONS["customer-support"]).toBeDefined()
      expect(ROLE_PERMISSIONS["retail-officer"]).toBeDefined()
      expect(ROLE_PERMISSIONS.admin).toBeDefined()
    })

    it("stores permissions as arrays", () => {
      expect(Array.isArray(ROLE_PERMISSIONS.driver)).toBe(true)
      expect(ROLE_PERMISSIONS.driver.length).toBeGreaterThan(0)
    })
  })
})
