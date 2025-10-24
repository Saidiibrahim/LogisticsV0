---
task_id: 08
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Testing and Production Deployment
phase: Phase 4 - Testing & Polish
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 120
dependencies: [TASK_01_stripe_setup.md, TASK_02_database_schema.md, TASK_03_checkout_integration.md, TASK_04_webhook_handler.md, TASK_05_state_management.md, TASK_06_subscription_ui.md, TASK_07_customer_portal.md]
tags: [testing, deployment, production, qa, stripe-live-mode]
---

# Task 08: Testing and Production Deployment

## Objective

Perform comprehensive end-to-end testing of the subscription system, handle edge cases, implement error handling, and deploy to production with proper monitoring and live Stripe configuration.

## Prerequisites

- All previous tasks (01-07) completed
- Stripe test mode fully functional
- Application deployed to staging environment (recommended)

## Step-by-Step Instructions

### 1. Create Comprehensive Test Suite

Create integration tests for the subscription flow.

**File:** `lib/actions/__tests__/subscription-flow.test.ts`

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest"
import { getUserSubscription, hasActiveSubscription } from "../get-subscription"

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn(),
}))

describe("Subscription Flow Integration Tests", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getUserSubscription", () => {
    it("should return null when user has no subscription", async () => {
      // Test implementation
      const result = await getUserSubscription()
      expect(result).toBeNull()
    })

    it("should return subscription with plan details", async () => {
      // Mock authenticated user with subscription
      // Test that subscription data is returned correctly
    })

    it("should handle database errors gracefully", async () => {
      // Mock database error
      // Verify error handling
    })
  })

  describe("hasActiveSubscription", () => {
    it("should return true for active subscription", async () => {
      // Test active status
    })

    it("should return true for trialing subscription", async () => {
      // Test trial status
    })

    it("should return false for canceled subscription", async () => {
      // Test canceled status
    })

    it("should return false for past_due subscription", async () => {
      // Test past due status
    })
  })
})
```

### 2. Create End-to-End Test Scenarios

Document manual test scenarios for QA.

**File:** `docs/testing/e2e-subscription-tests.md`

```markdown
# End-to-End Subscription Testing Scenarios

## Test Environment Setup
- [ ] Local development server running
- [ ] Stripe CLI forwarding webhooks
- [ ] Test mode enabled in Stripe
- [ ] Database seeded with test data
- [ ] Test user account created

## Scenario 1: New User Subscription
**Goal:** Verify a new user can subscribe successfully

1. Create new account and log in
2. Navigate to `/subscription`
3. Click "Subscribe" on Pro plan
4. Fill checkout with test card: 4242 4242 4242 4242
5. Complete checkout
6. **Expected:** Redirected to success page
7. **Verify:** User subscription created in database
8. **Verify:** Subscription status is "active"
9. **Verify:** User can access pro features

## Scenario 2: Failed Payment
**Goal:** Verify failed payment is handled correctly

1. Log in as test user
2. Subscribe with failing card: 4000 0000 0000 0002
3. **Expected:** Checkout shows error
4. **Verify:** No subscription created in database
5. **Verify:** User remains on free plan

## Scenario 3: Subscription Upgrade
**Goal:** Verify users can upgrade plans

1. Log in with active Pro subscription
2. Navigate to `/subscription`
3. Click "Upgrade to Team"
4. Confirm in dialog
5. Complete checkout
6. **Expected:** Subscription updated to Team
7. **Verify:** Database shows new plan
8. **Verify:** Webhook event logged
9. **Verify:** User has Team features

## Scenario 4: Subscription Cancellation
**Goal:** Verify cancellation flow works correctly

1. Log in with active subscription
2. Navigate to `/subscription/manage`
3. Click "Manage Subscription"
4. In Stripe Portal, cancel subscription
5. Choose "Cancel at end of period"
6. Return to app
7. **Expected:** Subscription shows "Cancels at period end"
8. **Verify:** `cancel_at_period_end = true` in database
9. **Verify:** User still has access until period end
10. **Verify:** Webhook event logged

## Scenario 5: Expired Subscription
**Goal:** Verify access is revoked after expiration

1. Use Stripe CLI to simulate subscription end
2. **Expected:** User loses access to premium features
3. **Verify:** Subscription status is "canceled"
4. **Verify:** Feature gates block access
5. **Verify:** User prompted to resubscribe

## Scenario 6: Payment Method Update
**Goal:** Verify payment method updates work

1. Log in with active subscription
2. Open Customer Portal
3. Update payment method to new test card
4. Save changes
5. **Expected:** Success message displayed
6. **Verify:** Stripe Dashboard shows new payment method
7. **Verify:** Webhook event logged

## Scenario 7: Invoice Payment Failed
**Goal:** Verify failed recurring payment handling

1. Use Stripe CLI to trigger `invoice.payment_failed`
2. **Expected:** Subscription status becomes "past_due"
3. **Verify:** Database updated correctly
4. **Verify:** User sees payment failed alert
5. **Verify:** Webhook event logged

## Scenario 8: Subscription Reactivation
**Goal:** Verify canceled subscriptions can be reactivated

1. Start with canceled subscription (but still in billing period)
2. Open Customer Portal
3. Reactivate subscription
4. **Expected:** Subscription becomes active again
5. **Verify:** `cancel_at_period_end = false`
6. **Verify:** Webhook event logged
```

### 3. Implement Error Boundary for Subscription Components

Add error handling for subscription UI.

**File:** `components/subscription/subscription-error-boundary.tsx`

```typescript
"use client"

import { Component, type ReactNode } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class SubscriptionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Subscription error:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Subscription Error
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              We encountered an error loading subscription information. Please
              try again later.
            </p>
            <Button
              onClick={() => this.setState({ hasError: false })}
              variant="outline"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )
    }

    return this.props.children
  }
}
```

### 4. Add Monitoring and Logging

Create logging utility for production monitoring.

**File:** `lib/stripe/monitoring.ts`

```typescript
/**
 * Monitoring and logging utilities for subscription system
 */

interface SubscriptionMetric {
  event: string
  userId?: string
  subscriptionId?: string
  planId?: string
  amount?: number
  metadata?: Record<string, unknown>
  timestamp: string
}

/**
 * Log subscription-related events for monitoring
 */
export function logSubscriptionMetric(metric: Omit<SubscriptionMetric, "timestamp">) {
  const fullMetric: SubscriptionMetric = {
    ...metric,
    timestamp: new Date().toISOString(),
  }

  // In development, log to console
  if (process.env.NODE_ENV === "development") {
    console.log("[Subscription Metric]", fullMetric)
  }

  // In production, send to monitoring service
  // Example: sendToDatadog(fullMetric)
  // Example: sendToSentry(fullMetric)
}

/**
 * Track subscription conversion funnel
 */
export function trackSubscriptionFunnel(
  step: "viewed_pricing" | "clicked_subscribe" | "completed_checkout" | "activated",
  userId: string,
  metadata?: Record<string, unknown>
) {
  logSubscriptionMetric({
    event: `subscription_funnel_${step}`,
    userId,
    metadata,
  })
}

/**
 * Track subscription revenue
 */
export function trackRevenue(
  userId: string,
  amount: number,
  planId: string,
  metadata?: Record<string, unknown>
) {
  logSubscriptionMetric({
    event: "subscription_revenue",
    userId,
    amount,
    planId,
    metadata,
  })
}
```

### 5. Create Production Deployment Checklist

**File:** `docs/deployment/production-checklist.md`

```markdown
# Production Deployment Checklist

## Pre-Deployment

### Stripe Configuration
- [ ] Create live mode products and prices in Stripe Dashboard
- [ ] Copy live mode Price IDs
- [ ] Configure Customer Portal for live mode
- [ ] Set up live mode webhook endpoint
- [ ] Copy live mode webhook signing secret
- [ ] Copy live mode API keys (publishable and secret)
- [ ] Test live mode webhook delivery (use test mode toggle)

### Environment Variables
- [ ] Update production environment with live Stripe keys
- [ ] Update `STRIPE_SECRET_KEY` (starts with `sk_live_`)
- [ ] Update `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts with `pk_live_`)
- [ ] Update `STRIPE_WEBHOOK_SECRET` (live webhook signing secret)
- [ ] Update `STRIPE_PRO_PRICE_ID` (live price ID)
- [ ] Update `STRIPE_TEAM_PRICE_ID` (live price ID)
- [ ] Set `NEXT_PUBLIC_APP_URL` to production domain

### Database
- [ ] Run database migrations on production
- [ ] Seed subscription plans with live Stripe IDs
- [ ] Verify RLS policies are active
- [ ] Test database connection from production

### Application
- [ ] Build passes without errors (`pnpm run build`)
- [ ] Type check passes (`pnpm run type-check`)
- [ ] All tests pass (`pnpm run test`)
- [ ] Linting passes (`pnpm run lint`)

## Deployment

### Vercel/Hosting Platform
- [ ] Deploy to production
- [ ] Verify deployment successful
- [ ] Check application loads correctly
- [ ] Verify environment variables are set

### Stripe Webhook Setup
- [ ] Add production webhook endpoint URL
- [ ] Format: `https://yourdomain.com/api/stripe/webhook`
- [ ] Select all subscription-related events
- [ ] Save webhook endpoint
- [ ] Copy signing secret to production env vars
- [ ] Test webhook delivery (send test webhook from Dashboard)

### DNS and SSL
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] HTTPS enforced

## Post-Deployment Testing

### Smoke Tests
- [ ] Can access production site
- [ ] Can log in successfully
- [ ] Pricing page loads
- [ ] Can click subscribe button

### Payment Tests (Use Live Test Cards)
- [ ] Test successful subscription (card: 4242 4242 4242 4242)
- [ ] Verify webhook received
- [ ] Verify database updated
- [ ] Verify user gets access to features
- [ ] Test Customer Portal access
- [ ] Test subscription cancellation

### Monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Configure uptime monitoring
- [ ] Set up webhook monitoring alerts
- [ ] Monitor Stripe Dashboard for events

## Post-Launch

### Week 1
- [ ] Monitor webhook delivery success rate
- [ ] Check for failed payments
- [ ] Review error logs
- [ ] Monitor subscription metrics
- [ ] Gather user feedback

### Ongoing
- [ ] Monthly Stripe reconciliation
- [ ] Review failed payment attempts
- [ ] Monitor subscription churn
- [ ] Track feature usage by plan
- [ ] Update documentation as needed
```

### 6. Configure Stripe Live Mode

**Steps to go live:**

1. **Switch to Live Mode in Stripe Dashboard**
   - Click "Test Mode" toggle in top-right
   - Switch to "Live Mode"

2. **Create Live Products**
   - Navigate to Products
   - Create Pro plan: $9.99/month
   - Create Team plan: $29.99/month
   - Copy live Price IDs

3. **Update Environment Variables**
   ```env
   # Replace all test keys with live keys
   STRIPE_SECRET_KEY=sk_live_...
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_... (from live webhook)
   STRIPE_PRO_PRICE_ID=price_... (live)
   STRIPE_TEAM_PRICE_ID=price_... (live)
   ```

4. **Create Live Webhook**
   - Go to Developers → Webhooks
   - Add endpoint: `https://your-domain.com/api/stripe/webhook`
   - Select events (same as test mode)
   - Copy signing secret

5. **Update Supabase**
   ```sql
   -- Update subscription plans with live Stripe IDs
   UPDATE subscription_plans
   SET stripe_price_id = 'price_LIVE_PRO_ID'
   WHERE name = 'Pro';

   UPDATE subscription_plans
   SET stripe_price_id = 'price_LIVE_TEAM_ID'
   WHERE name = 'Team';
   ```

### 7. Create Rollback Plan

**File:** `docs/deployment/rollback-plan.md`

```markdown
# Subscription Feature Rollback Plan

## If Issues Occur After Deployment

### Immediate Actions
1. Switch Stripe back to test mode
2. Disable subscription page (show maintenance message)
3. Stop processing new subscriptions

### Database Rollback
```sql
-- If needed, rollback database changes
-- Backup data first!
BEGIN;

-- Remove subscription-related tables
DROP TABLE IF EXISTS subscription_events CASCADE;
DROP TABLE IF EXISTS user_subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

ROLLBACK; -- or COMMIT if intentional
```

### Code Rollback
1. Revert to previous deployment
2. Remove subscription routes
3. Disable webhook endpoint

### Communication
1. Notify affected users
2. Issue refunds if necessary
3. Document issues for resolution
```

## Verification Checklist

- [ ] All integration tests pass
- [ ] End-to-end test scenarios completed
- [ ] Error boundaries implemented
- [ ] Monitoring and logging configured
- [ ] Production deployment checklist completed
- [ ] Live Stripe mode configured correctly
- [ ] Live webhook tested and working
- [ ] Database updated with live Stripe IDs
- [ ] Production smoke tests pass
- [ ] Rollback plan documented

## Testing Guide

### Run All Tests

```bash
# Unit tests
pnpm run test

# Type checking
pnpm run type-check

# Linting
pnpm run lint

# Build
pnpm run build
```

### Manual Testing Checklist

**Test in Order:**

1. **Pricing Page**
   - [ ] All plans display correctly
   - [ ] Prices are accurate
   - [ ] Features listed correctly
   - [ ] Subscribe buttons work

2. **Checkout Flow**
   - [ ] Can initiate checkout
   - [ ] Checkout session loads
   - [ ] Test card works (4242 4242 4242 4242)
   - [ ] Success page displays
   - [ ] Database updated

3. **Subscription Status**
   - [ ] Current plan displays correctly
   - [ ] Status badge shows correct plan
   - [ ] Feature gates work
   - [ ] Protected content accessible

4. **Customer Portal**
   - [ ] Can access portal
   - [ ] Can view subscription
   - [ ] Can update payment method
   - [ ] Can view invoices
   - [ ] Can cancel subscription

5. **Webhooks**
   - [ ] Webhooks received successfully
   - [ ] Database syncs correctly
   - [ ] Events logged properly
   - [ ] No duplicate processing

## Production Monitoring

### Key Metrics to Track

1. **Subscription Metrics**
   - New subscriptions per day
   - Cancellations per day
   - Churn rate
   - Average revenue per user (ARPU)

2. **Technical Metrics**
   - Webhook delivery success rate
   - API response times
   - Error rates
   - Failed payment rate

3. **User Metrics**
   - Conversion rate (pricing → checkout)
   - Checkout completion rate
   - Time to first subscription

### Stripe Dashboard Monitoring

- Check daily for failed payments
- Review webhook delivery logs
- Monitor subscription status distribution
- Track revenue trends

## Troubleshooting

### Webhook Not Firing
- Check webhook URL is correct
- Verify endpoint is publicly accessible
- Check signing secret matches
- Review Stripe webhook logs

### Database Not Updating
- Check webhook handler logs
- Verify RLS policies
- Check Supabase logs
- Ensure service role has permissions

### Payment Failures
- Check Stripe Dashboard for error details
- Verify customer has valid payment method
- Check for Stripe account issues
- Review error messages in logs

### Feature Access Issues
- Verify subscription status in database
- Check feature gate logic
- Ensure store is updated
- Check user authentication

## Expected Output

After completing this task:
1. All tests pass successfully
2. Application deployed to production
3. Live Stripe integration working
4. Webhooks processing correctly
5. Users can subscribe and manage subscriptions
6. Monitoring and logging in place
7. Rollback plan ready if needed

## Success Criteria

The subscription system is successfully deployed when:

- ✅ Users can subscribe to paid plans
- ✅ Payments process successfully
- ✅ Subscriptions sync to database via webhooks
- ✅ Users can manage subscriptions via Customer Portal
- ✅ Feature gating works correctly
- ✅ Failed payments are handled gracefully
- ✅ Cancellations work as expected
- ✅ No critical errors in production
- ✅ Monitoring shows healthy metrics

## Next Steps

After successful deployment:

1. **Monitor for 1 week** - Watch for issues
2. **Gather feedback** - Survey users about experience
3. **Optimize** - Improve conversion rates
4. **Expand** - Add more plans or features
5. **Document** - Update docs with learnings

## Resources

- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Stripe Production Checklist](https://stripe.com/docs/checklist)
- [Stripe Webhook Best Practices](https://stripe.com/docs/webhooks/best-practices)
- [Stripe Dashboard](https://dashboard.stripe.com)
- [Supabase Production](https://supabase.com/docs/guides/platform)
