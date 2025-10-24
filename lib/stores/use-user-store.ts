"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface UserState {
  /** Authenticated user's email address, if available */
  userEmail?: string
  /** Friendly display name resolved from Supabase metadata. */
  userName?: string
  /** Current subscription tier name if available. */
  subscriptionTier?: string
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
}

interface UserProfilePayload {
  email?: string
  name?: string
  subscriptionTier?: string
}

export const useUserStore = create<UserStore>()(
  devtools(
    (set) => ({
      ...initialState,
      setUserEmail: (email) =>
        set({ userEmail: email }, false, "user/setUserEmail"),
      setUserProfile: ({ email, name, subscriptionTier }) =>
        set(
          {
            userEmail: email,
            userName: name,
            subscriptionTier,
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
