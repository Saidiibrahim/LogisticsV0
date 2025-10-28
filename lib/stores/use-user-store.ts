"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

import type { UserRole } from "@/lib/auth/permissions"

interface UserState {
  /** Authenticated user's email address, if available */
  userEmail?: string
  /** Friendly display name resolved from Supabase metadata. */
  userName?: string
  /** Current subscription tier name if available. */
  subscriptionTier?: string
  /** Current authenticated user's role. */
  role?: UserRole
  /** Organization identifier scoped from the multi-tenant Supabase schema. */
  organizationId?: string
}

interface UserActions {
  /** Persist the current user's email in the store */
  setUserEmail: (email?: string) => void
  /** Persist the current user's profile metadata in the store */
  setUserProfile: (profile: UserProfilePayload) => void
  /** Clear all user data from the store */
  clearUser: () => void
}

export type UserStore = UserState & UserActions

const initialState: UserState = {
  userEmail: undefined,
  userName: undefined,
  subscriptionTier: undefined,
  role: undefined,
  organizationId: undefined,
}

interface UserProfilePayload {
  email?: string
  name?: string
  subscriptionTier?: string
  role?: UserRole
  organizationId?: string
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUserEmail: (email) =>
        set({ userEmail: email }, false, "user/setUserEmail"),
      setUserProfile: ({
        email,
        name,
        subscriptionTier,
        role,
        organizationId,
      }) =>
        set(
          {
            userEmail: email,
            userName: name,
            subscriptionTier,
            role,
            organizationId,
          },
          false,
          "user/setUserProfile"
        ),
      clearUser: () => set(initialState, false, "user/clear"),
    }),
    {
      name: "UserStore",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)

// Selectors
export const selectUserEmail = (state: UserStore) => state.userEmail
export const selectUserName = (state: UserStore) => state.userName
export const selectSubscriptionTier = (state: UserStore) =>
  state.subscriptionTier
export const selectSetUserEmail = (state: UserStore) => state.setUserEmail
export const selectSetUserProfile = (state: UserStore) => state.setUserProfile
export const selectClearUser = (state: UserStore) => state.clearUser
export const selectUserRole = (state: UserStore) => state.role
export const selectOrganizationId = (state: UserStore) => state.organizationId
