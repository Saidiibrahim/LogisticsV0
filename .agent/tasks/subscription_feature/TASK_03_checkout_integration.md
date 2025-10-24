---
task_id: 03
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Stripe Checkout Integration
phase: Phase 2 - Core Integration
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 120
dependencies: [TASK_01_stripe_setup.md, TASK_02_database_schema.md]
tags: [stripe, checkout, payment, server-actions, api-routes]
---

# Task 03: Stripe Checkout Integration

## Objective

Implement Stripe Checkout to allow users to subscribe to paid plans. Create server actions to initiate checkout sessions, handle successful checkouts, and create/update Stripe customers in the database.

## Prerequisites

- Task 01 (Stripe Setup) completed
- Task 02 (Database Schema) completed
- Stripe test mode configured with products and prices

## Step-by-Step Instructions

### 1. Create Checkout Session Server Action

Create a server action to initialize a Stripe Checkout session. Use the authenticated Supabase user (`user.id`) as the foreign key—this maps directly to `public.users.id`, so no additional profile lookup is required.

**File:** `lib/actions/create-checkout-session.ts`

```typescript
"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/config"

/**
 * Creates a Stripe Checkout session for subscription purchase
 * @param priceId - The Stripe Price ID for the selected plan
 * @returns Redirects to Stripe Checkout or error page
 */
export async function createCheckoutSession(priceId: string) {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Unauthorized: Please log in to continue")
    }

    // Check if user already has a Stripe customer ID
    const { data: existingSubscription } = await supabase
      .from("user_subscriptions")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .single()

    let customerId: string | undefined = existingSubscription?.stripe_customer_id

    // Create new Stripe customer if one doesn't exist
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          supabase_user_id: user.id,
        },
      })
      customerId = customer.id

      // Store customer ID in database
      await supabase.from("user_subscriptions").upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        status: "incomplete",
      })
    }

    // Get app URL from environment
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${appUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/subscription/canceled`,
      allow_promotion_codes: true,
      billing_address_collection: "auto",
      customer_update: {
        address: "auto",
        name: "auto",
      },
      metadata: {
        supabase_user_id: user.id,
      },
    })

    if (!session.url) {
      throw new Error("Failed to create checkout session")
    }

    // Redirect to Stripe Checkout
    redirect(session.url)
  } catch (error) {
    console.error("Error creating checkout session:", error)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error // Re-throw Next.js redirect
    }
    throw new Error(
      error instanceof Error ? error.message : "Failed to start checkout"
    )
  }
}
```

### 2. Create Get or Create Customer Helper

Create a reusable helper function for customer management.

**File:** `lib/stripe/customer.ts`

```typescript
import { createClient } from "@/lib/supabase/server"
import { stripe } from "./config"

/**
 * Gets existing Stripe customer ID or creates a new customer
 * @param userId - Supabase user ID
 * @param email - User's email address
 * @returns Stripe customer ID
 */
export async function getOrCreateStripeCustomer(
  userId: string,
  email: string | undefined
): Promise<string> {
  const supabase = await createClient()

  // Check for existing customer ID
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single()

  if (existingSubscription?.stripe_customer_id) {
    return existingSubscription.stripe_customer_id
  }

  // Create new Stripe customer
  const customer = await stripe.customers.create({
    email,
    metadata: {
      supabase_user_id: userId,
    },
  })

  // Store customer ID in database
  await supabase.from("user_subscriptions").upsert(
    {
      user_id: userId,
      stripe_customer_id: customer.id,
      status: "incomplete",
    },
    {
      onConflict: "user_id",
    }
  )

  return customer.id
}

/**
 * Retrieve Stripe customer by Supabase user ID
 */
export async function getStripeCustomerByUserId(
  userId: string
): Promise<string | null> {
  const supabase = await createClient()

  const { data } = await supabase
    .from("user_subscriptions")
    .select("stripe_customer_id")
    .eq("user_id", userId)
    .single()

  return data?.stripe_customer_id || null
}
```

### 3. Create Success Page

Handle successful checkout completion and display confirmation.

**File:** `app/(authenticated)/subscription/success/page.tsx`

```typescript
import { Suspense } from "react"
import { redirect } from "next/navigation"
import { CheckCircle } from "lucide-react"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/config"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

async function SuccessContent({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const sessionId = searchParams.session_id

  if (!sessionId) {
    redirect("/subscription")
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Retrieve the checkout session
  const session = await stripe.checkout.sessions.retrieve(sessionId)

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Subscription Successful!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Thank you for subscribing to RefZone.</p>
            <p className="mt-2">
              Your subscription is now active and you have access to all premium
              features.
            </p>
          </div>

          {session.customer_email && (
            <div className="rounded-lg bg-muted p-4">
              <p className="text-sm text-muted-foreground">
                A confirmation email has been sent to:
              </p>
              <p className="font-medium">{session.customer_email}</p>
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/subscription">Manage Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function SuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessContent searchParams={searchParams} />
    </Suspense>
  )
}
```

### 4. Create Canceled Page

Handle when users cancel the checkout process.

**File:** `app/(authenticated)/subscription/canceled/page.tsx`

```typescript
import { XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"

export default function CanceledPage() {
  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100">
            <XCircle className="h-10 w-10 text-orange-600" />
          </div>
          <CardTitle className="text-2xl">Checkout Canceled</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Your subscription checkout was canceled.</p>
            <p className="mt-2">
              No charges were made to your account. You can try again whenever
              you're ready.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/subscription">View Plans</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

### 5. Create Subscribe Button Component

Reusable button component to trigger checkout.

**File:** `components/subscription/subscribe-button.tsx`

```typescript
"use client"

import { useState, useTransition } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { createCheckoutSession } from "@/lib/actions/create-checkout-session"
import { useToast } from "@/hooks/use-toast"

interface SubscribeButtonProps {
  priceId: string
  planName: string
  className?: string
  children?: React.ReactNode
}

export function SubscribeButton({
  priceId,
  planName,
  className,
  children,
}: SubscribeButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleSubscribe = () => {
    startTransition(async () => {
      try {
        await createCheckoutSession(priceId)
      } catch (error) {
        console.error("Subscription error:", error)
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to start checkout. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button
      onClick={handleSubscribe}
      disabled={isPending}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Loading...
        </>
      ) : (
        children || `Subscribe to ${planName}`
      )}
    </Button>
  )
}
```

### 6. Create Pricing Display Component

Display available subscription plans with pricing.

**File:** `components/subscription/pricing-card.tsx`

```typescript
"use client"

import { Check } from "lucide-react"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SubscribeButton } from "./subscribe-button"
import { cn } from "@/lib/utils"

interface PricingCardProps {
  name: string
  description: string
  price: number
  priceId?: string
  features: string[]
  isCurrentPlan?: boolean
  isPopular?: boolean
}

export function PricingCard({
  name,
  description,
  price,
  priceId,
  features,
  isCurrentPlan = false,
  isPopular = false,
}: PricingCardProps) {
  return (
    <Card
      className={cn(
        "relative flex flex-col",
        isPopular && "border-primary shadow-lg"
      )}
    >
      {isPopular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
            Most Popular
          </span>
        </div>
      )}

      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1 space-y-6">
        <div className="flex items-baseline">
          <span className="text-4xl font-bold">${price}</span>
          <span className="ml-2 text-muted-foreground">/month</span>
        </div>

        <ul className="space-y-3">
          {features.map((feature, index) => (
            <li key={index} className="flex items-start gap-2">
              <Check className="mt-1 h-4 w-4 shrink-0 text-primary" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>

      <CardFooter>
        {isCurrentPlan ? (
          <Button disabled className="w-full">
            Current Plan
          </Button>
        ) : priceId ? (
          <SubscribeButton priceId={priceId} planName={name} className="w-full">
            {price === 0 ? "Get Started" : "Subscribe"}
          </SubscribeButton>
        ) : (
          <Button disabled className="w-full">
            Contact Sales
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
```

### 7. Add Error Handling and Logging

Create utility for logging checkout events.

**File:** `lib/stripe/logger.ts`

```typescript
/**
 * Logs Stripe-related events for debugging and monitoring
 */

type LogLevel = "info" | "warn" | "error"

interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  data?: unknown
}

export function logStripeEvent(
  level: LogLevel,
  message: string,
  data?: unknown
) {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    data,
  }

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log(`[Stripe ${level.toUpperCase()}]`, message, data || "")
  }

  // In production, you might send to a logging service
  // Example: await sendToLoggingService(entry)
}
```

### 8. Test Checkout Flow

Create a test page to verify checkout integration.

**File:** `app/(authenticated)/subscription/test/page.tsx`

```typescript
import { SUBSCRIPTION_PLANS, STRIPE_PRICES } from "@/lib/stripe/config"
import { PricingCard } from "@/components/subscription/pricing-card"

export default function TestCheckoutPage() {
  return (
    <div className="container mx-auto py-16">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold">Test Checkout Integration</h1>
        <p className="mt-2 text-muted-foreground">
          Use test card: 4242 4242 4242 4242
        </p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        <PricingCard
          name={SUBSCRIPTION_PLANS.PRO.name}
          description="Advanced features for professional referees"
          price={SUBSCRIPTION_PLANS.PRO.price}
          priceId={STRIPE_PRICES.PRO}
          features={SUBSCRIPTION_PLANS.PRO.features}
          isPopular
        />
        <PricingCard
          name={SUBSCRIPTION_PLANS.TEAM.name}
          description="Team management and collaboration"
          price={SUBSCRIPTION_PLANS.TEAM.price}
          priceId={STRIPE_PRICES.TEAM}
          features={SUBSCRIPTION_PLANS.TEAM.features}
        />
      </div>
    </div>
  )
}
```

### 9. Add Test Card Information Component

Help developers know which test cards to use.

**File:** `components/subscription/test-card-info.tsx`

```typescript
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function TestCardInfo() {
  if (process.env.NODE_ENV === "production") return null

  return (
    <Card className="bg-yellow-50 dark:bg-yellow-950">
      <CardHeader>
        <CardTitle className="text-sm">Test Mode - Use Test Cards</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <p>
          <strong>Success:</strong> 4242 4242 4242 4242
        </p>
        <p>
          <strong>Payment fails:</strong> 4000 0000 0000 0002
        </p>
        <p>
          <strong>3D Secure:</strong> 4000 0025 0000 3155
        </p>
        <p className="text-xs text-muted-foreground">
          Use any future expiry date and any 3-digit CVC
        </p>
      </CardContent>
    </Card>
  )
}
```

## Verification Checklist

- [ ] `create-checkout-session.ts` server action created
- [ ] `lib/stripe/customer.ts` helper functions created
- [ ] Success page created at `/subscription/success`
- [ ] Canceled page created at `/subscription/canceled`
- [ ] `SubscribeButton` component created
- [ ] `PricingCard` component created
- [ ] Test page created at `/subscription/test`
- [ ] Environment variables configured (from Task 01)
- [ ] Can navigate to test page without errors
- [ ] Clicking subscribe button redirects to Stripe Checkout
- [ ] Test card (4242 4242 4242 4242) completes checkout successfully
- [ ] After successful checkout, redirected to success page
- [ ] Canceling checkout redirects to canceled page

## Testing Guide

### Test Successful Checkout
1. Navigate to `/subscription/test`
2. Click "Subscribe" on Pro plan
3. Should redirect to Stripe Checkout
4. Use test card: `4242 4242 4242 4242`
5. Expiry: Any future date (e.g., `12/34`)
6. CVC: Any 3 digits (e.g., `123`)
7. Click "Subscribe"
8. Should redirect to `/subscription/success`

### Test Canceled Checkout
1. Navigate to `/subscription/test`
2. Click "Subscribe" on any plan
3. On Stripe Checkout page, click the back button
4. Should redirect to `/subscription/canceled`

### Test Failed Payment
1. Use test card: `4000 0000 0000 0002`
2. Should show payment failed error in Stripe Checkout

## Troubleshooting

### Error: "Unauthorized: Please log in to continue"
- Ensure you're logged in as an authenticated user
- Check middleware is properly configured
- Verify Supabase session is valid

### Checkout session creation fails
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe Price IDs match those from Task 01
- Ensure `NEXT_PUBLIC_APP_URL` is configured
- Check Stripe API logs in Dashboard

### Redirect not working
- In Next.js 15, `redirect()` throws an error internally - this is expected
- The error is caught and handled by the framework
- Don't catch redirect errors in try-catch blocks

### Customer creation fails
- Check database permissions (RLS policies)
- Verify service role can insert into `user_subscriptions`
- Check Supabase logs for SQL errors

## Expected Output

After completing this task:
1. Users can click a subscribe button and be redirected to Stripe Checkout
2. Test card payments complete successfully
3. After payment, users are redirected to the success page
4. Canceled checkouts redirect to the canceled page
5. Stripe customers are created in the database
6. Checkout sessions appear in Stripe Dashboard under "Payments"

## Next Steps

Once this task is complete, proceed to **[TASK_04_webhook_handler.md](TASK_04_webhook_handler.md)** to implement webhook handling for subscription lifecycle events.

## Resources

- [Stripe Checkout Documentation](https://stripe.com/docs/checkout)
- [Stripe Checkout Session API](https://stripe.com/docs/api/checkout/sessions)
- [Stripe Test Cards](https://stripe.com/docs/testing)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [Stripe Customers API](https://stripe.com/docs/api/customers)
