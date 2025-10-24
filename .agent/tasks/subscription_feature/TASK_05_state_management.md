---
task_id: 05
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Subscription State Management
phase: Phase 2 - Core Integration
created: 2025-10-08
status: Ready
priority: Medium
estimated_minutes: 60
dependencies: [TASK_02_database_schema.md, TASK_04_webhook_handler.md]
tags: [zustand, state-management, subscriptions, hooks]
---

# Task 05: Subscription State Management

## Objective

Create a Zustand store for managing subscription state on the client side. Implement React hooks for accessing subscription data, checking subscription status, and determining feature access throughout the application.

## Prerequisites

- Task 02 (Database Schema) completed
- Task 04 (Webhook Handler) completed
- Familiarity with Zustand state management (see existing stores)

## Step-by-Step Instructions

### 1. Create Subscription Store

Create a Zustand store following the project's existing patterns.

**File:** `lib/stores/use-subscription-store.ts`

```typescript
"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"
import type {
  UserSubscriptionWithPlan,
  SubscriptionStatus,
} from "@/lib/types/subscription"

interface SubscriptionState {
  /** Current user's subscription data with plan details */
  subscription: UserSubscriptionWithPlan | null
  /** Loading state for async operations */
  isLoading: boolean
  /** Error state */
  error: string | null
  /** Last time data was fetched */
  lastFetched: number | null
}

interface SubscriptionActions {
  /** Set subscription data */
  setSubscription: (subscription: UserSubscriptionWithPlan | null) => void
  /** Set loading state */
  setLoading: (isLoading: boolean) => void
  /** Set error state */
  setError: (error: string | null) => void
  /** Clear subscription data (on logout) */
  clearSubscription: () => void
  /** Mark data as fetched */
  markFetched: () => void
}

interface SubscriptionComputed {
  /** Check if user has an active subscription */
  isActive: boolean
  /** Check if user is on a specific plan */
  isPlan: (planName: string) => boolean
  /** Check if subscription is past due */
  isPastDue: boolean
  /** Check if subscription is canceled but still active */
  isCanceledButActive: boolean
  /** Get current plan name */
  planName: string | null
  /** Check if user can access a feature */
  canAccess: (feature: string) => boolean
}

export type SubscriptionStore = SubscriptionState &
  SubscriptionActions &
  SubscriptionComputed

const initialState: SubscriptionState = {
  subscription: null,
  isLoading: false,
  error: null,
  lastFetched: null,
}

export const useSubscriptionStore = create<SubscriptionStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions
      setSubscription: (subscription) =>
        set({ subscription, error: null }, false, "subscription/set"),

      setLoading: (isLoading) =>
        set({ isLoading }, false, "subscription/setLoading"),

      setError: (error) =>
        set({ error, isLoading: false }, false, "subscription/setError"),

      clearSubscription: () =>
        set(initialState, false, "subscription/clear"),

      markFetched: () =>
        set({ lastFetched: Date.now() }, false, "subscription/markFetched"),

      // Computed properties
      get isActive() {
        const { subscription } = get()
        return (
          subscription?.status === "active" ||
          subscription?.status === "trialing"
        )
      },

      isPlan: (planName: string) => {
        const { subscription } = get()
        return subscription?.plan?.name.toLowerCase() === planName.toLowerCase()
      },

      get isPastDue() {
        const { subscription } = get()
        return subscription?.status === "past_due"
      },

      get isCanceledButActive() {
        const { subscription } = get()
        return subscription?.cancel_at_period_end === true && get().isActive
      },

      get planName() {
        const { subscription } = get()
        return subscription?.plan?.name || "Free"
      },

      canAccess: (feature: string) => {
        const { subscription } = get()
        if (!subscription?.plan) return false

        const features = subscription.plan.features as string[]
        return features.some((f) =>
          f.toLowerCase().includes(feature.toLowerCase())
        )
      },
    }),
    {
      name: "SubscriptionStore",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)

// Selectors
export const selectSubscription = (state: SubscriptionStore) =>
  state.subscription
export const selectIsLoading = (state: SubscriptionStore) => state.isLoading
export const selectError = (state: SubscriptionStore) => state.error
export const selectIsActive = (state: SubscriptionStore) => state.isActive
export const selectPlanName = (state: SubscriptionStore) => state.planName
export const selectIsPastDue = (state: SubscriptionStore) => state.isPastDue
```

### 2. Create Server Action to Fetch Subscription

Create a server action to fetch the user's current subscription. The lookup should always filter by `user_subscriptions.user_id = auth user.id`, relying on the existing `public.users` primary key.

**File:** `lib/actions/get-subscription.ts`

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"
import type { UserSubscriptionWithPlan } from "@/lib/types/subscription"

/**
 * Fetches the current user's subscription with plan details
 * @returns Subscription data or null if no subscription exists
 */
export async function getUserSubscription(): Promise<UserSubscriptionWithPlan | null> {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return null
    }

    const { data, error } = await supabase
      .from("user_subscriptions")
      .select(`
        *,
        plan:subscription_plans(*)
      `)
      .eq("user_id", user.id)
      .single()

    if (error) {
      console.error("Error fetching subscription:", error)
      return null
    }

    return data as unknown as UserSubscriptionWithPlan
  } catch (error) {
    console.error("Error in getUserSubscription:", error)
    return null
  }
}

/**
 * Checks if user has an active subscription
 */
export async function hasActiveSubscription(): Promise<boolean> {
  const subscription = await getUserSubscription()
  return (
    subscription?.status === "active" || subscription?.status === "trialing"
  )
}

/**
 * Gets user's current plan name
 */
export async function getCurrentPlanName(): Promise<string> {
  const subscription = await getUserSubscription()
  return subscription?.plan?.name || "Free"
}
```

### 3. Create Custom Hook for Subscription Data

Create a React hook that loads and provides subscription data.

**File:** `hooks/use-subscription.ts`

```typescript
"use client"

import { useEffect } from "react"
import { useSubscriptionStore } from "@/lib/stores/use-subscription-store"
import { getUserSubscription } from "@/lib/actions/get-subscription"

/**
 * Hook to load and access subscription data
 * Automatically fetches subscription on mount if not already loaded
 */
export function useSubscription() {
  const store = useSubscriptionStore()

  useEffect(() => {
    // Only fetch if not already loaded recently (5 minutes)
    const fiveMinutes = 5 * 60 * 1000
    const shouldFetch =
      !store.lastFetched || Date.now() - store.lastFetched > fiveMinutes

    if (shouldFetch && !store.isLoading) {
      loadSubscription()
    }
  }, [])

  async function loadSubscription() {
    store.setLoading(true)
    try {
      const subscription = await getUserSubscription()
      store.setSubscription(subscription)
      store.markFetched()
    } catch (error) {
      console.error("Error loading subscription:", error)
      store.setError(
        error instanceof Error ? error.message : "Failed to load subscription"
      )
    } finally {
      store.setLoading(false)
    }
  }

  async function refreshSubscription() {
    return loadSubscription()
  }

  return {
    subscription: store.subscription,
    isLoading: store.isLoading,
    error: store.error,
    isActive: store.isActive,
    isPlan: store.isPlan,
    isPastDue: store.isPastDue,
    isCanceledButActive: store.isCanceledButActive,
    planName: store.planName,
    canAccess: store.canAccess,
    refresh: refreshSubscription,
  }
}
```

### 4. Create Feature Gate Component

Create a component to conditionally render content based on subscription.

**File:** `components/subscription/feature-gate.tsx`

```typescript
"use client"

import type { ReactNode } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"
import Link from "next/link"

interface FeatureGateProps {
  /** Feature name to check access for */
  feature?: string
  /** Specific plan required */
  requirePlan?: "Pro" | "Team"
  /** Require any active subscription */
  requireActive?: boolean
  /** Content to show if user has access */
  children: ReactNode
  /** Custom fallback component */
  fallback?: ReactNode
  /** Message to show when locked */
  lockedMessage?: string
}

/**
 * Component that conditionally renders content based on subscription status
 * Shows upgrade prompt if user doesn't have access
 */
export function FeatureGate({
  feature,
  requirePlan,
  requireActive = false,
  children,
  fallback,
  lockedMessage,
}: FeatureGateProps) {
  const { isActive, isPlan, canAccess, isLoading } = useSubscription()

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    )
  }

  // Check access
  let hasAccess = true

  if (requireActive && !isActive) {
    hasAccess = false
  }

  if (requirePlan && !isPlan(requirePlan)) {
    hasAccess = false
  }

  if (feature && !canAccess(feature)) {
    hasAccess = false
  }

  // Render children if has access
  if (hasAccess) {
    return <>{children}</>
  }

  // Show custom fallback or default locked message
  if (fallback) {
    return <>{fallback}</>
  }

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center p-8 text-center">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground" />
        </div>
        <h3 className="mb-2 text-lg font-semibold">Premium Feature</h3>
        <p className="mb-4 text-sm text-muted-foreground">
          {lockedMessage || "Upgrade your plan to access this feature"}
        </p>
        <Button asChild>
          <Link href="/subscription">View Plans</Link>
        </Button>
      </CardContent>
    </Card>
  )
}
```

### 5. Create Subscription Badge Component

Display user's current plan as a badge.

**File:** `components/subscription/subscription-badge.tsx`

```typescript
"use client"

import { Badge } from "@/components/ui/badge"
import { useSubscription } from "@/hooks/use-subscription"
import { Crown, Users } from "lucide-react"

export function SubscriptionBadge() {
  const { planName, isLoading, isActive } = useSubscription()

  if (isLoading || !isActive) {
    return null
  }

  const isPro = planName === "Pro"
  const isTeam = planName === "Team"

  if (!isPro && !isTeam) {
    return null
  }

  return (
    <Badge variant="secondary" className="gap-1">
      {isPro && <Crown className="h-3 w-3" />}
      {isTeam && <Users className="h-3 w-3" />}
      {planName}
    </Badge>
  )
}
```

### 6. Create Subscription Status Indicator

Show subscription status and upcoming billing information.

**File:** `components/subscription/subscription-status.tsx`

```typescript
"use client"

import { useSubscription } from "@/hooks/use-subscription"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, CheckCircle, XCircle } from "lucide-react"

export function SubscriptionStatus() {
  const { subscription, isActive, isPastDue, isCanceledButActive, isLoading } =
    useSubscription()

  if (isLoading || !subscription) {
    return null
  }

  // Active subscription
  if (isActive && !isCanceledButActive) {
    return (
      <Alert>
        <CheckCircle className="h-4 w-4" />
        <AlertTitle>Active Subscription</AlertTitle>
        <AlertDescription>
          Your {subscription.plan?.name} plan is active until{" "}
          {subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : "N/A"}
        </AlertDescription>
      </Alert>
    )
  }

  // Canceled but still active
  if (isCanceledButActive) {
    return (
      <Alert variant="default">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Subscription Ending</AlertTitle>
        <AlertDescription>
          Your subscription will end on{" "}
          {subscription.current_period_end
            ? new Date(subscription.current_period_end).toLocaleDateString()
            : "N/A"}
          . You can reactivate anytime before then.
        </AlertDescription>
      </Alert>
    )
  }

  // Past due
  if (isPastDue) {
    return (
      <Alert variant="destructive">
        <XCircle className="h-4 w-4" />
        <AlertTitle>Payment Failed</AlertTitle>
        <AlertDescription>
          Your payment failed. Please update your payment method to continue
          your subscription.
        </AlertDescription>
      </Alert>
    )
  }

  return null
}
```

### 7. Add Subscription Store to Reset Utility

Update the store reset utility to include subscription store.

**File:** `lib/stores/reset.ts` (update existing file)

Add this import and update:

```typescript
import { useSubscriptionStore } from "./use-subscription-store"

/**
 * Reset all stores to initial state
 * Useful for logout or testing
 */
export function resetAllStores() {
  useUserStore.getState().clearUser()
  useSubscriptionStore.getState().clearSubscription()
  // ... other stores
}
```

### 8. Create Test for Subscription Store

Create unit tests for the subscription store.

**File:** `lib/stores/__tests__/use-subscription-store.test.ts`

```typescript
import { describe, it, expect, beforeEach } from "vitest"
import { useSubscriptionStore } from "../use-subscription-store"
import type { UserSubscriptionWithPlan } from "@/lib/types/subscription"

describe("useSubscriptionStore", () => {
  beforeEach(() => {
    useSubscriptionStore.getState().clearSubscription()
  })

  it("should initialize with default state", () => {
    const state = useSubscriptionStore.getState()
    expect(state.subscription).toBeNull()
    expect(state.isLoading).toBe(false)
    expect(state.error).toBeNull()
    expect(state.isActive).toBe(false)
  })

  it("should set subscription data", () => {
    const mockSubscription: Partial<UserSubscriptionWithPlan> = {
      status: "active",
      plan: {
        id: "1",
        name: "Pro",
        price: 9.99,
        features: ["unlimited matches", "advanced analytics"],
      } as any,
    }

    useSubscriptionStore.getState().setSubscription(mockSubscription as any)
    const state = useSubscriptionStore.getState()

    expect(state.subscription).toEqual(mockSubscription)
    expect(state.isActive).toBe(true)
  })

  it("should check if user is on specific plan", () => {
    const mockSubscription: Partial<UserSubscriptionWithPlan> = {
      status: "active",
      plan: { id: "1", name: "Pro" } as any,
    }

    useSubscriptionStore.getState().setSubscription(mockSubscription as any)
    const { isPlan } = useSubscriptionStore.getState()

    expect(isPlan("Pro")).toBe(true)
    expect(isPlan("Team")).toBe(false)
  })

  it("should detect past due status", () => {
    const mockSubscription: Partial<UserSubscriptionWithPlan> = {
      status: "past_due",
      plan: { id: "1", name: "Pro" } as any,
    }

    useSubscriptionStore.getState().setSubscription(mockSubscription as any)
    const state = useSubscriptionStore.getState()

    expect(state.isPastDue).toBe(true)
    expect(state.isActive).toBe(false)
  })

  it("should clear subscription on logout", () => {
    const mockSubscription: Partial<UserSubscriptionWithPlan> = {
      status: "active",
      plan: { id: "1", name: "Pro" } as any,
    }

    useSubscriptionStore.getState().setSubscription(mockSubscription as any)
    useSubscriptionStore.getState().clearSubscription()

    const state = useSubscriptionStore.getState()
    expect(state.subscription).toBeNull()
    expect(state.isActive).toBe(false)
  })
})
```

Run the test:
```bash
pnpm run test lib/stores/__tests__/use-subscription-store.test.ts
```

## Verification Checklist

- [ ] Subscription store created at `lib/stores/use-subscription-store.ts`
- [ ] Server action created at `lib/actions/get-subscription.ts`
- [ ] `useSubscription` hook created
- [ ] `FeatureGate` component created
- [ ] `SubscriptionBadge` component created
- [ ] `SubscriptionStatus` component created
- [ ] Store added to reset utility
- [ ] Unit tests created and passing
- [ ] TypeScript types properly defined
- [ ] No console errors when using hooks/components

## Testing Guide

### Test Subscription Store

1. Create a test component to verify store functionality
2. Import and use the `useSubscription` hook
3. Verify state updates correctly
4. Check computed properties work as expected

### Test Feature Gate

Create a test page:

**File:** `app/(authenticated)/test-feature-gate/page.tsx`

```typescript
import { FeatureGate } from "@/components/subscription/feature-gate"

export default function TestFeatureGatePage() {
  return (
    <div className="container py-8 space-y-8">
      <FeatureGate requireActive>
        <p>This content requires an active subscription</p>
      </FeatureGate>

      <FeatureGate requirePlan="Pro">
        <p>This content requires Pro plan</p>
      </FeatureGate>

      <FeatureGate feature="advanced analytics">
        <p>This content requires advanced analytics feature</p>
      </FeatureGate>
    </div>
  )
}
```

## Troubleshooting

### Store not updating
- Check that actions are being called correctly
- Verify devtools is enabled in development
- Check browser Redux DevTools for state changes

### Subscription data not loading
- Verify server action returns correct data structure
- Check Supabase RLS policies allow read access
- Ensure user is authenticated

### TypeScript errors
- Regenerate Supabase types if schema changed
- Check that type imports are correct
- Verify generic types are properly defined

## Expected Output

After completing this task:
1. Subscription data is available throughout the app via hook
2. Feature gating works based on subscription status
3. UI components display subscription information correctly
4. Store persists subscription state across re-renders
5. Tests pass successfully

## Next Steps

Once this task is complete, proceed to **[TASK_06_subscription_ui.md](TASK_06_subscription_ui.md)** to build the subscription management UI.

## Resources

- [Zustand Documentation](https://docs.pmnd.rs/zustand)
- [React Hooks](https://react.dev/reference/react)
- [Supabase Select Queries](https://supabase.com/docs/reference/javascript/select)
- [TypeScript Generics](https://www.typescriptlang.org/docs/handbook/2/generics.html)
