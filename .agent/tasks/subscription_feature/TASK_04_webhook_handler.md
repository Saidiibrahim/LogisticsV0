---
task_id: 04
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Webhook Handler Implementation
phase: Phase 2 - Core Integration
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 120
dependencies: [TASK_02_database_schema.md, TASK_03_checkout_integration.md]
tags: [stripe, webhooks, events, api-routes, security]
---

# Task 04: Webhook Handler Implementation

## Objective

Implement a secure webhook endpoint to receive and process Stripe subscription events. Handle subscription lifecycle events (created, updated, canceled, payment succeeded/failed) and keep the database in sync with Stripe.

## Prerequisites

- Task 02 (Database Schema) completed
- Task 03 (Checkout Integration) completed
- Stripe CLI installed (from Task 01)

## Step-by-Step Instructions

### 1. Create Webhook Route Handler

Create the API route to receive webhook events from Stripe.

**File:** `app/api/stripe/webhook/route.ts`

```typescript
import { headers } from "next/headers"
import { NextResponse } from "next/server"
import Stripe from "stripe"
import { stripe } from "@/lib/stripe/config"
import {
  handleCheckoutSessionCompleted,
  handleSubscriptionCreated,
  handleSubscriptionUpdated,
  handleSubscriptionDeleted,
  handleInvoicePaid,
  handleInvoicePaymentFailed,
  handleCustomerUpdated,
} from "@/lib/stripe/webhook-handlers"

/**
 * Stripe webhook endpoint
 * Receives and processes subscription lifecycle events
 */
export async function POST(req: Request) {
  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    console.error("Missing stripe-signature header")
    return NextResponse.json(
      { error: "Missing signature" },
      { status: 400 }
    )
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!webhookSecret) {
    console.error("Missing STRIPE_WEBHOOK_SECRET environment variable")
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error(
      "Webhook signature verification failed:",
      err instanceof Error ? err.message : err
    )
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    )
  }

  console.log(`Received webhook event: ${event.type}`)

  try {
    // Handle different event types
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(
          event.data.object as Stripe.Checkout.Session
        )
        break

      case "customer.subscription.created":
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case "customer.updated":
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ received: true })
  } catch (error) {
    console.error(`Error processing webhook event ${event.type}:`, error)
    // Still return 200 to prevent retries for application errors
    return NextResponse.json(
      {
        received: true,
        error: error instanceof Error ? error.message : "Processing error",
      },
      { status: 200 }
    )
  }
}
```

### 2. Create Webhook Handler Functions

Create individual handlers for each webhook event type. The `supabase_user_id` metadata written during checkout maps directly to the existing `public.users.id` primary key, so every update must continue to target the `user_subscriptions.user_id` foreign key.

**File:** `lib/stripe/webhook-handlers.ts`

```typescript
import Stripe from "stripe"
import { createClient } from "@/lib/supabase/server"
import type {
  UserSubscriptionInsert,
  UserSubscriptionUpdate,
  SubscriptionEventInsert,
} from "@/lib/types/subscription"

/**
 * Handle successful checkout session completion
 * Creates or updates subscription record when payment succeeds
 */
export async function handleCheckoutSessionCompleted(
  session: Stripe.Checkout.Session
) {
  console.log("Processing checkout.session.completed", session.id)

  const supabase = await createClient()
  const userId = session.metadata?.supabase_user_id

  if (!userId) {
    console.error("Missing user_id in checkout session metadata")
    return
  }

  const customerId = session.customer as string
  const subscriptionId = session.subscription as string

  // Update or insert subscription record
  const subscriptionData: UserSubscriptionInsert = {
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: subscriptionId,
    status: "active",
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    })

  if (error) {
    console.error("Error updating subscription after checkout:", error)
    throw error
  }

  // Log event
  await logSubscriptionEvent(userId, session.id, "checkout_completed", session)

  console.log(`Subscription activated for user ${userId}`)
}

/**
 * Handle new subscription creation
 */
export async function handleSubscriptionCreated(
  subscription: Stripe.Subscription
) {
  console.log("Processing customer.subscription.created", subscription.id)

  const supabase = await createClient()
  const userId = subscription.metadata?.supabase_user_id

  if (!userId) {
    console.error("Missing user_id in subscription metadata")
    return
  }

  // Get plan ID from database based on Stripe price ID
  const priceId = subscription.items.data[0]?.price.id
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .single()

  const subscriptionData: UserSubscriptionInsert = {
    user_id: userId,
    stripe_customer_id: subscription.customer as string,
    stripe_subscription_id: subscription.id,
    plan_id: plan?.id,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    trial_start: subscription.trial_start
      ? new Date(subscription.trial_start * 1000).toISOString()
      : null,
    trial_end: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .upsert(subscriptionData, {
      onConflict: "user_id",
    })

  if (error) {
    console.error("Error creating subscription:", error)
    throw error
  }

  await logSubscriptionEvent(userId, subscription.id, "subscription_created", subscription)

  console.log(`Subscription created for user ${userId}`)
}

/**
 * Handle subscription updates (plan changes, renewals, etc.)
 */
export async function handleSubscriptionUpdated(
  subscription: Stripe.Subscription
) {
  console.log("Processing customer.subscription.updated", subscription.id)

  const supabase = await createClient()

  // Find user by Stripe subscription ID
  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single()

  if (!existingSubscription) {
    console.error("Subscription not found:", subscription.id)
    return
  }

  const userId = existingSubscription.user_id

  // Get plan ID from database
  const priceId = subscription.items.data[0]?.price.id
  const { data: plan } = await supabase
    .from("subscription_plans")
    .select("id")
    .eq("stripe_price_id", priceId)
    .single()

  const updateData: UserSubscriptionUpdate = {
    plan_id: plan?.id,
    status: subscription.status,
    current_period_start: new Date(
      subscription.current_period_start * 1000
    ).toISOString(),
    current_period_end: new Date(
      subscription.current_period_end * 1000
    ).toISOString(),
    cancel_at_period_end: subscription.cancel_at_period_end,
    canceled_at: subscription.canceled_at
      ? new Date(subscription.canceled_at * 1000).toISOString()
      : null,
  }

  const { error } = await supabase
    .from("user_subscriptions")
    .update(updateData)
    .eq("stripe_subscription_id", subscription.id)

  if (error) {
    console.error("Error updating subscription:", error)
    throw error
  }

  await logSubscriptionEvent(userId, subscription.id, "subscription_updated", subscription)

  console.log(`Subscription updated for user ${userId}`)
}

/**
 * Handle subscription cancellation
 */
export async function handleSubscriptionDeleted(
  subscription: Stripe.Subscription
) {
  console.log("Processing customer.subscription.deleted", subscription.id)

  const supabase = await createClient()

  const { data: existingSubscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscription.id)
    .single()

  if (!existingSubscription) {
    console.error("Subscription not found:", subscription.id)
    return
  }

  const userId = existingSubscription.user_id

  const { error } = await supabase
    .from("user_subscriptions")
    .update({
      status: "canceled",
      canceled_at: new Date().toISOString(),
    })
    .eq("stripe_subscription_id", subscription.id)

  if (error) {
    console.error("Error canceling subscription:", error)
    throw error
  }

  await logSubscriptionEvent(userId, subscription.id, "subscription_deleted", subscription)

  console.log(`Subscription canceled for user ${userId}`)
}

/**
 * Handle successful invoice payment
 */
export async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("Processing invoice.paid", invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log("Invoice not associated with subscription")
    return
  }

  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single()

  if (!subscription) {
    console.error("Subscription not found for invoice:", subscriptionId)
    return
  }

  await logSubscriptionEvent(subscription.user_id, subscriptionId, "invoice_paid", invoice)

  console.log(`Invoice paid for subscription ${subscriptionId}`)
}

/**
 * Handle failed invoice payment
 */
export async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log("Processing invoice.payment_failed", invoice.id)

  const subscriptionId = invoice.subscription as string

  if (!subscriptionId) {
    console.log("Invoice not associated with subscription")
    return
  }

  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_subscription_id", subscriptionId)
    .single()

  if (!subscription) {
    console.error("Subscription not found for invoice:", subscriptionId)
    return
  }

  // Update subscription status
  await supabase
    .from("user_subscriptions")
    .update({ status: "past_due" })
    .eq("stripe_subscription_id", subscriptionId)

  await logSubscriptionEvent(
    subscription.user_id,
    subscriptionId,
    "invoice_payment_failed",
    invoice
  )

  // TODO: Send notification email to user about failed payment

  console.log(`Payment failed for subscription ${subscriptionId}`)
}

/**
 * Handle customer updates
 */
export async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log("Processing customer.updated", customer.id)

  // Update customer metadata in database if needed
  // For now, just log the event
  const supabase = await createClient()

  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("user_id")
    .eq("stripe_customer_id", customer.id)
    .single()

  if (subscription) {
    await logSubscriptionEvent(
      subscription.user_id,
      customer.id,
      "customer_updated",
      customer
    )
  }
}

/**
 * Helper function to log subscription events
 */
async function logSubscriptionEvent(
  userId: string,
  stripeEventId: string,
  eventType: string,
  eventData: unknown
) {
  const supabase = await createClient()

  // Get subscription ID for linking
  const { data: subscription } = await supabase
    .from("user_subscriptions")
    .select("id")
    .eq("user_id", userId)
    .single()

  const eventRecord: SubscriptionEventInsert = {
    user_id: userId,
    subscription_id: subscription?.id,
    event_type: eventType,
    stripe_event_id: stripeEventId,
    event_data: eventData as Record<string, unknown>,
    processed: true,
  }

  await supabase.from("subscription_events").insert(eventRecord)
}
```

### 3. Configure Webhook in Next.js

Disable body parsing for the webhook route (required for Stripe signature verification).

**File:** `app/api/stripe/webhook/route.ts` (add export)

Add this export at the top of the file:

```typescript
// Disable body parsing - Stripe needs raw body for signature verification
export const runtime = "nodejs"
export const dynamic = "force-dynamic"
```

### 4. Set Up Local Webhook Testing with Stripe CLI

For local development, use Stripe CLI to forward webhook events.

**Terminal command:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

This command will:
1. Start listening for Stripe events
2. Forward them to your local endpoint
3. Provide a webhook signing secret (starts with `whsec_...`)

**Update `.env.local` with the webhook secret:**
```env
STRIPE_WEBHOOK_SECRET=whsec_YOUR_LOCAL_WEBHOOK_SECRET_HERE
```

Keep the Stripe CLI running in a terminal while developing.

### 5. Create Webhook Testing Helper

Create a helper to trigger test webhooks for development.

**File:** `lib/stripe/__tests__/webhook-test.ts`

```typescript
/**
 * Helper functions for testing webhook handlers
 * Use with Stripe CLI: stripe trigger <event_type>
 */

import { stripe } from "../config"

/**
 * Trigger a test checkout.session.completed event
 */
export async function triggerTestCheckout(userId: string, priceId: string) {
  // This is a reference for using Stripe CLI
  console.log(`
To test checkout completion, run:
stripe trigger checkout.session.completed \\
  --add checkout_session:metadata.supabase_user_id=${userId} \\
  --add checkout_session:subscription=sub_test
  `)
}

/**
 * Test webhook signature verification
 */
export function testWebhookSignature() {
  const payload = JSON.stringify({
    type: "customer.subscription.created",
    data: { object: {} },
  })

  const signature = stripe.webhooks.generateTestHeaderString({
    payload,
    secret: process.env.STRIPE_WEBHOOK_SECRET!,
  })

  return { payload, signature }
}
```

### 6. Create Webhook Monitoring Dashboard (Optional)

Create a simple page to view recent webhook events.

**File:** `app/(authenticated)/subscription/events/page.tsx`

```typescript
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function SubscriptionEventsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: events } = await supabase
    .from("subscription_events")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20)

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Subscription Events</CardTitle>
        </CardHeader>
        <CardContent>
          {events && events.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">
                      {event.event_type}
                    </TableCell>
                    <TableCell>
                      {new Date(event.created_at).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge variant={event.processed ? "default" : "secondary"}>
                        {event.processed ? "Processed" : "Pending"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground">
              No subscription events yet
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

## Verification Checklist

- [ ] Webhook route created at `/api/stripe/webhook`
- [ ] Webhook handler functions created in `lib/stripe/webhook-handlers.ts`
- [ ] Body parsing disabled for webhook route
- [ ] Stripe CLI installed and running (`stripe listen`)
- [ ] Webhook secret added to `.env.local`
- [ ] All event types have handler functions
- [ ] Signature verification implemented
- [ ] Event logging to database working
- [ ] Test webhook events processed successfully
- [ ] Events visible in Supabase database
- [ ] Optional: Events page accessible at `/subscription/events`

## Testing Guide

### Test with Stripe CLI

1. **Start Stripe CLI listener:**
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

2. **Trigger test events:**
```bash
# Test checkout completion
stripe trigger checkout.session.completed

# Test subscription created
stripe trigger customer.subscription.created

# Test subscription updated
stripe trigger customer.subscription.updated

# Test invoice paid
stripe trigger invoice.paid

# Test invoice payment failed
stripe trigger invoice.payment_failed
```

3. **Check terminal output:**
   - Stripe CLI shows event sent
   - Your app logs show event received
   - Check Supabase `subscription_events` table for new rows

### Test End-to-End Flow

1. Complete a test checkout (from Task 03)
2. Watch Stripe CLI output for webhook events
3. Check database:
   - `user_subscriptions` should have new/updated row
   - `subscription_events` should have event logs
4. Verify subscription status matches Stripe Dashboard

## Troubleshooting

### Webhook signature verification fails
- Ensure you're using the signing secret from Stripe CLI output
- Check that raw body is passed to `stripe.webhooks.constructEvent`
- Verify `STRIPE_WEBHOOK_SECRET` environment variable is set

### Events not appearing in database
- Check Supabase logs for SQL errors
- Verify RLS policies allow service role to insert
- Ensure user_id is present in webhook metadata

### "Missing signature" error
- Stripe CLI must be running and forwarding to correct URL
- Verify the endpoint URL matches: `localhost:3000/api/stripe/webhook`

### Duplicate webhook events
- Stripe may send the same event multiple times
- Implement idempotency using `stripe_event_id` unique constraint
- The database schema already handles this with `UNIQUE` constraint

## Expected Output

After completing this task:
1. Stripe CLI successfully forwards events to local endpoint
2. Webhook events are logged in terminal
3. Database tables are updated based on webhook events
4. Subscription status changes are reflected in `user_subscriptions`
5. All events are logged in `subscription_events` table
6. No errors in console or Stripe CLI output

## Production Deployment Notes

When deploying to production:

1. **Update webhook endpoint in Stripe Dashboard:**
   - Go to Stripe Dashboard → Developers → Webhooks
   - Update endpoint URL to: `https://your-domain.com/api/stripe/webhook`
   - Copy the new signing secret

2. **Update production environment variables:**
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
   ```

3. **Enable live mode in Stripe Dashboard**

4. **Test with real events from Stripe Dashboard**

## Next Steps

Once this task is complete, proceed to **[TASK_05_state_management.md](TASK_05_state_management.md)** to implement subscription state management with Zustand.

## Resources

- [Stripe Webhooks Guide](https://stripe.com/docs/webhooks)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Event Types](https://stripe.com/docs/api/events/types)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
