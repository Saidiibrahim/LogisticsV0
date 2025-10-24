---
task_id: 07
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Customer Portal Integration
phase: Phase 3 - User Interface
created: 2025-10-08
status: Ready
priority: Medium
estimated_minutes: 60
dependencies: [TASK_03_checkout_integration.md, TASK_06_subscription_ui.md]
tags: [stripe, customer-portal, subscription-management, server-actions]
---

# Task 07: Customer Portal Integration

## Objective

Integrate Stripe Customer Portal to allow users to self-manage their subscriptions, update payment methods, view billing history, and cancel subscriptions without requiring custom UI implementation. Continue using the authenticated Supabase user (`user.id`) as the linkage to `user_subscriptions.user_id` (which references `public.users.id`).

## Prerequisites

- Task 03 (Checkout Integration) completed
- Task 06 (Subscription UI) completed
- Stripe Customer Portal configured in Dashboard

## Step-by-Step Instructions

### 1. Configure Customer Portal in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Settings** → **Customer Portal**
3. Click **Activate** if not already activated

**Configure the following settings:**

**Products:**
- Add your subscription products (Pro and Team)
- Enable customers to switch between plans
- Allow immediate plan changes or at period end

**Business Information:**
- Add your business name
- Add support email
- Add terms of service URL (optional)
- Add privacy policy URL (optional)

**Functionality:**
- ✅ Cancel subscriptions (allow cancellation at period end)
- ✅ Pause subscriptions (optional)
- ✅ Update payment methods
- ✅ View invoice history
- ✅ Update billing information

**Customer Information:**
- ✅ Allow customers to update email
- ✅ Allow customers to update shipping address
- ✅ Allow customers to update billing address

Click **Save** to activate the portal.

### 2. Create Server Action for Portal Session

Create a server action to generate Customer Portal sessions.

**File:** `lib/actions/create-portal-session.ts`

```typescript
"use server"

import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { stripe } from "@/lib/stripe/config"
import { getOrCreateStripeCustomer } from "@/lib/stripe/customer"

/**
 * Creates a Stripe Customer Portal session
 * Allows users to manage their subscription, payment methods, and billing info
 * @returns Redirects to Stripe Customer Portal
 */
export async function createCustomerPortalSession() {
  try {
    const supabase = await createClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error("Unauthorized: Please log in to continue")
    }

    // Get or create Stripe customer
    const customerId = await getOrCreateStripeCustomer(user.id, user.email)

    // Get app URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${appUrl}/subscription`,
    })

    if (!session.url) {
      throw new Error("Failed to create portal session")
    }

    // Redirect to portal
    redirect(session.url)
  } catch (error) {
    console.error("Error creating portal session:", error)
    if (error instanceof Error && error.message.includes("NEXT_REDIRECT")) {
      throw error // Re-throw Next.js redirect
    }
    throw new Error(
      error instanceof Error
        ? error.message
        : "Failed to access customer portal"
    )
  }
}
```

### 3. Create Manage Subscription Button

Create a button component to open the Customer Portal.

**File:** `components/subscription/manage-subscription-button.tsx`

```typescript
"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Settings, Loader2 } from "lucide-react"
import { createCustomerPortalSession } from "@/lib/actions/create-portal-session"
import { useToast } from "@/hooks/use-toast"

interface ManageSubscriptionButtonProps {
  variant?: "default" | "outline" | "ghost"
  className?: string
  showIcon?: boolean
}

export function ManageSubscriptionButton({
  variant = "default",
  className,
  showIcon = true,
}: ManageSubscriptionButtonProps) {
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleManage = () => {
    startTransition(async () => {
      try {
        await createCustomerPortalSession()
      } catch (error) {
        console.error("Portal error:", error)
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to open customer portal. Please try again.",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Button
      onClick={handleManage}
      disabled={isPending}
      variant={variant}
      className={className}
    >
      {isPending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Opening...
        </>
      ) : (
        <>
          {showIcon && <Settings className="mr-2 h-4 w-4" />}
          Manage Subscription
        </>
      )}
    </Button>
  )
}
```

### 4. Create Manage Subscription Page

Create a dedicated page for subscription management.

**File:** `app/(authenticated)/subscription/manage/page.tsx`

```typescript
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ManageSubscriptionButton } from "@/components/subscription/manage-subscription-button"
import { SubscriptionStatus } from "@/components/subscription/subscription-status"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  CreditCard,
  FileText,
  Settings,
  AlertCircle,
} from "lucide-react"

async function ManageSubscriptionContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user's subscription
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq("user_id", user.id)
    .single()

  const hasSubscription = !!subscription?.stripe_subscription_id

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Manage Your Subscription</h1>
        <p className="text-muted-foreground">
          Update your plan, payment methods, and billing information
        </p>
      </div>

      <div className="space-y-6">
        {/* Subscription Status */}
        {subscription && <SubscriptionStatus />}

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {hasSubscription ? (
              <>
                <div className="flex items-start gap-4 rounded-lg border p-4">
                  <Settings className="mt-1 h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <h3 className="font-semibold">Manage via Stripe</h3>
                    <p className="text-sm text-muted-foreground">
                      Update payment methods, view invoices, and modify your
                      subscription
                    </p>
                    <div className="mt-3">
                      <ManageSubscriptionButton showIcon={false} />
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <FeatureCard
                    icon={<CreditCard className="h-5 w-5" />}
                    title="Payment Methods"
                    description="Update your credit card or payment information"
                  />
                  <FeatureCard
                    icon={<FileText className="h-5 w-5" />}
                    title="Billing History"
                    description="View and download past invoices"
                  />
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 py-8 text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div>
                  <h3 className="mb-2 font-semibold">No Active Subscription</h3>
                  <p className="text-sm text-muted-foreground">
                    Subscribe to a plan to unlock premium features
                  </p>
                </div>
                <ManageSubscriptionButton
                  variant="outline"
                  showIcon={false}
                >
                  View Plans
                </ManageSubscriptionButton>
              </div>
            )}
          </CardContent>
        </Card>

        {/* What You Can Do */}
        {hasSubscription && (
          <Card>
            <CardHeader>
              <CardTitle>What You Can Do in the Portal</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                    ✓
                  </Badge>
                  Update payment methods and billing information
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                    ✓
                  </Badge>
                  Switch between subscription plans
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                    ✓
                  </Badge>
                  View and download billing history
                </li>
                <li className="flex items-center gap-2">
                  <Badge variant="outline" className="h-6 w-6 rounded-full p-0">
                    ✓
                  </Badge>
                  Cancel your subscription (takes effect at period end)
                </li>
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg border p-4">
      <div className="text-primary">{icon}</div>
      <div>
        <h4 className="font-medium">{title}</h4>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}

export default function ManageSubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto max-w-4xl py-12">
          <Skeleton className="mb-8 h-12 w-96" />
          <Skeleton className="h-64" />
        </div>
      }
    >
      <ManageSubscriptionContent />
    </Suspense>
  )
}
```

### 5. Add Cancel Subscription Handler

Handle subscription cancellations from the portal via webhooks (already implemented in Task 04).

Verify the webhook handler in `lib/stripe/webhook-handlers.ts` includes:
- `handleSubscriptionUpdated` - Updates `cancel_at_period_end`
- `handleSubscriptionDeleted` - Marks subscription as canceled

### 6. Update Current Subscription Component

Add manage button to the CurrentSubscription component.

**File:** `components/subscription/current-subscription.tsx` (update)

Replace the "Manage Subscription" button section with:

```typescript
{/* Manage Button */}
<div className="pt-4">
  <ManageSubscriptionButton variant="outline" className="w-full" />
</div>
```

### 7. Create Portal Return Handler

Handle users returning from the Customer Portal.

**File:** `app/(authenticated)/subscription/portal-return/page.tsx`

```typescript
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { redirect } from "next/navigation"

async function PortalReturnContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  return (
    <div className="container mx-auto max-w-2xl py-16">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" />
          </div>
          <CardTitle className="text-2xl">Changes Saved</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center text-muted-foreground">
            <p>Your subscription settings have been updated successfully.</p>
            <p className="mt-2">
              Any changes will be reflected in your account shortly.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/dashboard">Go to Dashboard</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/subscription">View Subscription</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function PortalReturnPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PortalReturnContent />
    </Suspense>
  )
}
```

### 8. Test Customer Portal Flow

Create a test checklist for portal functionality.

**File:** `docs/testing/customer-portal-test.md`

```markdown
# Customer Portal Testing Checklist

## Setup
- [ ] Portal configured in Stripe Dashboard
- [ ] Products added to portal
- [ ] Return URL set correctly

## Access Tests
- [ ] Click "Manage Subscription" button
- [ ] Redirects to Stripe Customer Portal
- [ ] Portal loads without errors
- [ ] Branding matches Stripe Dashboard settings

## Functionality Tests
- [ ] Can view current subscription
- [ ] Can update payment method (test card: 4242 4242 4242 4242)
- [ ] Can view invoice history
- [ ] Can update billing email
- [ ] Can update billing address
- [ ] Can switch plans (if configured)
- [ ] Can cancel subscription

## Return Flow Tests
- [ ] Click "Return to..." link in portal
- [ ] Redirects back to app
- [ ] Shows success message
- [ ] Database reflects changes (check webhooks)

## Edge Cases
- [ ] Portal access without active subscription
- [ ] Portal with expired subscription
- [ ] Portal with past_due subscription
- [ ] Multiple rapid portal accesses
```

## Verification Checklist

- [ ] Customer Portal activated in Stripe Dashboard
- [ ] Portal configured with products and settings
- [ ] Server action `create-portal-session.ts` created
- [ ] `ManageSubscriptionButton` component created
- [ ] Manage subscription page created at `/subscription/manage`
- [ ] Portal return page created at `/subscription/portal-return`
- [ ] Return URL configured in portal session
- [ ] Webhook handles subscription updates from portal
- [ ] Can successfully access portal from app
- [ ] Changes in portal sync to database

## Testing Guide

### Test Portal Access

1. **With Active Subscription:**
   - Create a test subscription via checkout
   - Navigate to `/subscription/manage`
   - Click "Manage Subscription" button
   - Should redirect to Stripe Customer Portal
   - Verify all portal features are available

2. **Without Subscription:**
   - As a new user with no subscription
   - Navigate to `/subscription/manage`
   - Should see "No Active Subscription" message
   - Button should redirect to pricing page

### Test Payment Method Update

1. In Customer Portal, click "Update payment method"
2. Enter new test card: `5555 5555 5555 4444`
3. Save changes
4. Verify update succeeds
5. Check Stripe Dashboard shows new payment method

### Test Subscription Cancellation

1. In Customer Portal, click "Cancel plan"
2. Choose "Cancel at end of period"
3. Confirm cancellation
4. Return to app
5. Check database: `cancel_at_period_end` should be `true`
6. Verify webhook event logged in `subscription_events`

### Test Invoice History

1. In Customer Portal, navigate to billing history
2. Verify invoices are listed
3. Click to view/download an invoice
4. Verify PDF downloads correctly

## Troubleshooting

### "Customer Portal not configured" error
- Ensure portal is activated in Stripe Dashboard
- Verify products are added to portal
- Check portal settings saved correctly

### Return URL not working
- Verify `NEXT_PUBLIC_APP_URL` is set correctly
- Check return URL in portal session creation
- Ensure URL is accessible (not localhost for production)

### Changes not syncing to database
- Check webhook handler is processing `customer.subscription.updated`
- Verify webhook endpoint is accessible
- Check Stripe CLI is forwarding events (for local dev)
- Review webhook logs in Stripe Dashboard

### Portal session creation fails
- Verify Stripe customer ID exists
- Check user is authenticated
- Ensure API keys are correct
- Review server action error logs

## Expected Output

After completing this task:
1. Users can click "Manage Subscription" and access Stripe Portal
2. Portal displays current subscription and payment methods
3. Users can update payment methods successfully
4. Users can cancel subscriptions
5. Users can view billing history
6. Changes in portal sync to database via webhooks
7. Return flow brings users back to app with confirmation

## Security Considerations

1. **Session Validation**: Portal sessions are tied to specific customers
2. **User Authentication**: Always verify user is authenticated before creating session
3. **Return URL Validation**: Use environment variable for return URL
4. **Customer ID Verification**: Ensure customer belongs to authenticated user
5. **HTTPS Only**: Portal requires HTTPS in production

## Next Steps

Once this task is complete, proceed to **[TASK_08_testing_deployment.md](TASK_08_testing_deployment.md)** for comprehensive testing and production deployment.

## Resources

- [Stripe Customer Portal Documentation](https://stripe.com/docs/customer-management)
- [Customer Portal Configuration](https://stripe.com/docs/customer-management/integrate-customer-portal)
- [Portal Session API](https://stripe.com/docs/api/customer_portal/sessions)
- [Subscription Management Best Practices](https://stripe.com/docs/billing/subscriptions/overview)
