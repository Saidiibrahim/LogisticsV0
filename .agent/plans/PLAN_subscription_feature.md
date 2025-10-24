---
plan_id: subscription_feature
title: Stripe Subscription Feature Implementation
created: 2025-10-08
status: Planning Complete
total_tasks: 8
completed_tasks: 0
estimated_hours: 8-10
priority: High
tags: [stripe, subscription, payment, billing, supabase]
---

# Stripe Subscription Feature Implementation Plan

## Overview

Implement a comprehensive subscription management system using Stripe that allows users to:
1. View their current subscription plan and status
2. Upgrade or downgrade between subscription tiers
3. Process payments securely through Stripe Checkout
4. Manage their subscription through Stripe Customer Portal
5. Receive real-time subscription updates via webhooks

## Tech Stack

- **Payment Processing**: Stripe SDK (latest version)
- **Backend**: Next.js 15 App Router with Server Actions
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **UI Components**: shadcn/ui
- **Type Safety**: TypeScript with strict mode

## System Architecture

### Database Schema (Supabase)

> This project already mirrors authenticated users into `public.users` (with an FK to `auth.users`). All subscription records should reference that existing table so we do not introduce a parallel user store.

**Existing user schema alignment**
- `public.users` contains the canonical user record (columns include `id UUID PRIMARY KEY`, `email`, `display_name`, `avatar_url`, `email_verified`, `last_sign_in_at`, `created_at`, `updated_at`, `is_sso_user`, `is_anonymous`, `primary_provider`, `provider_list`).
- All new tables must reference `public.users.id`; do not create or write to any additional user profile tables.
- Application-level code should continue to source the authenticated user via `supabase.auth.getUser()` and use that `id` when reading or writing subscription data.

```sql
-- Subscription tiers/plans
CREATE TABLE subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd',
  interval TEXT NOT NULL, -- 'month' or 'year'
  features JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions (link to existing public.users profile table)
CREATE TABLE user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_id UUID REFERENCES subscription_plans(id),
  status TEXT NOT NULL, -- 'active', 'canceled', 'past_due', 'trialing', etc.
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Subscription history for auditing (also reuse public.users)
CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL, -- 'created', 'updated', 'canceled', 'payment_succeeded', etc.
  stripe_event_id TEXT,
  event_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
```

### API Routes

1. **POST /api/stripe/checkout** - Create Stripe Checkout session
2. **POST /api/stripe/portal** - Create Stripe Customer Portal session
3. **POST /api/stripe/webhook** - Handle Stripe webhook events
4. **GET /api/subscription/status** (Server Action) - Get user's subscription status

### Key Components

1. **SubscriptionCard** - Display current plan with features
2. **PricingCards** - Show available plans with upgrade/downgrade options
3. **ManageSubscriptionButton** - Open Stripe Customer Portal
4. **SubscriptionStatus** - Display subscription status and billing period

### Stripe Configuration

#### Products & Pricing Tiers

- **Free Tier** (Default)
  - Basic match tracking
  - Limited to 10 matches per month
  - Basic statistics

- **Pro Tier** ($9.99/month)
  - Unlimited matches
  - Advanced analytics
  - AI chat assistance
  - Calendar integration
  - Export functionality

- **Team Tier** ($29.99/month)
  - Everything in Pro
  - Multi-user access (up to 5 users)
  - Team management
  - Priority support
  - Custom branding

#### Webhook Events to Handle

1. **checkout.session.completed** - When payment succeeds, create/update subscription
2. **customer.subscription.created** - New subscription created
3. **customer.subscription.updated** - Subscription changed (upgrade/downgrade)
4. **customer.subscription.deleted** - Subscription canceled
5. **invoice.paid** - Successful recurring payment
6. **invoice.payment_failed** - Failed payment (send notification)
7. **customer.updated** - Customer details changed

### Security Considerations

1. **Webhook Signature Verification**: Always verify webhook signatures using Stripe signing secret
2. **Server-Side Operations**: All Stripe operations must happen server-side
3. **Customer Validation**: Always verify the Stripe customer belongs to the authenticated user
4. **Idempotency**: Handle duplicate webhook events gracefully
5. **Environment Variables**: Store all API keys in environment variables

## Implementation Phases

### Phase 1: Foundation (Tasks 1-2)
Set up Stripe account, configure products/pricing, create database schema, install dependencies.

### Phase 2: Core Integration (Tasks 3-5)
Implement Stripe Checkout, webhook handler, and database synchronization logic.

### Phase 3: User Interface (Tasks 6-7)
Build subscription management UI, pricing page, and integrate Customer Portal.

### Phase 4: Testing & Polish (Task 8)
Comprehensive testing, error handling, edge cases, and production deployment.

## Environment Variables Required

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Product/Price IDs (created in Stripe Dashboard)
STRIPE_PRO_PRICE_ID=price_...
STRIPE_TEAM_PRICE_ID=price_...

# Application URLs
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Success Metrics

- Users can successfully subscribe to paid plans via Stripe Checkout
- Subscription status is accurately reflected in the UI in real-time
- Users can upgrade/downgrade plans through Customer Portal
- Failed payments are handled gracefully with user notifications
- All webhook events are processed without errors
- Database remains in sync with Stripe subscription state

## Dependencies

- `stripe` - Official Stripe Node.js SDK
- `@stripe/stripe-js` - Stripe.js for client-side
- Existing Supabase setup
- Existing authentication system

## Testing Strategy

1. **Stripe Test Mode**: Use Stripe test mode for all development
2. **Test Cards**: Use Stripe test card numbers for different scenarios
3. **Webhook Testing**: Use Stripe CLI for local webhook testing
4. **Edge Cases**: Test subscription upgrades, downgrades, cancellations, and failed payments
5. **Database Sync**: Verify database state matches Stripe after each webhook event

## Tasks Overview

1. **[Stripe Account Setup and Configuration](../tasks/subscription_feature/TASK_01_stripe_setup.md)** - 60 min
2. **[Database Schema and Migrations](../tasks/subscription_feature/TASK_02_database_schema.md)** - 90 min
3. **[Stripe Checkout Integration](../tasks/subscription_feature/TASK_03_checkout_integration.md)** - 120 min
4. **[Webhook Handler Implementation](../tasks/subscription_feature/TASK_04_webhook_handler.md)** - 120 min
5. **[Subscription State Management](../tasks/subscription_feature/TASK_05_state_management.md)** - 60 min
6. **[Pricing and Subscription UI](../tasks/subscription_feature/TASK_06_subscription_ui.md)** - 90 min
7. **[Customer Portal Integration](../tasks/subscription_feature/TASK_07_customer_portal.md)** - 60 min
8. **[Testing and Production Deployment](../tasks/subscription_feature/TASK_08_testing_deployment.md)** - 120 min

## Timeline

- **Estimated Total Time**: 8-10 hours
- **Recommended Approach**: Complete tasks sequentially in order
- **Testing**: Allow extra time for thorough testing before production

## Notes

- Always work in Stripe test mode until final production deployment
- Keep Stripe Dashboard open to monitor events and customer activity
- Use Stripe CLI for local webhook testing during development
- Follow the project's existing patterns for Supabase client usage (never store in global variables)
- Use Zustand for subscription state management following existing store patterns
- All payment-sensitive operations must use Server Actions or API Routes (never client-side)
