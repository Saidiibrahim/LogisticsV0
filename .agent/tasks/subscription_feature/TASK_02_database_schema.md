---
task_id: 02
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Database Schema and Migrations
phase: Phase 1 - Foundation
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 90
dependencies: [TASK_01_stripe_setup.md]
tags: [database, supabase, schema, migrations, sql]
---

# Task 02: Database Schema and Migrations

## Objective

Create the database schema for storing subscription data, including subscription plans, user subscriptions, and subscription event history. Set up proper relationships, indexes, and Row Level Security (RLS) policies.

## Prerequisites

- Task 01 (Stripe Setup) completed
- Access to Supabase Dashboard
- Supabase project connected to this application

## Step-by-Step Instructions

### 1. Access Supabase SQL Editor

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### 2. Create Subscription Plans Table

This table stores the available subscription tiers and their Stripe metadata.

```sql
-- Create subscription_plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_product_id TEXT UNIQUE NOT NULL,
  stripe_price_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'usd' NOT NULL,
  interval TEXT NOT NULL CHECK (interval IN ('month', 'year')),
  features JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE subscription_plans IS 'Stores available subscription tiers and their Stripe metadata';

-- Create index on active plans for faster queries
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active) WHERE is_active = true;
```

Click **Run** to execute the query.

### 3. Create User Subscriptions Table

This table links users to their active subscriptions and Stripe customer data. Reference the existing `public.users` table (already keyed to `auth.users`) so we stay aligned with the current user schema. Supabase already persists user information via columns such as `id`, `email`, `display_name`, `primary_provider`, `created_at`, and `updated_at`—reuse that primary key instead of creating a parallel profile table.

```sql
-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  stripe_customer_id TEXT UNIQUE NOT NULL,
  stripe_subscription_id TEXT UNIQUE,
  plan_id UUID REFERENCES subscription_plans(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (
    status IN (
      'incomplete',
      'incomplete_expired',
      'trialing',
      'active',
      'past_due',
      'canceled',
      'unpaid',
      'paused'
    )
  ),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false NOT NULL,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- Add comment for documentation
COMMENT ON TABLE user_subscriptions IS 'Links users to their Stripe subscriptions and current plan';

-- Create indexes for performance
CREATE INDEX idx_user_subscriptions_user_id ON user_subscriptions(user_id);
CREATE INDEX idx_user_subscriptions_stripe_customer ON user_subscriptions(stripe_customer_id);
CREATE INDEX idx_user_subscriptions_stripe_subscription ON user_subscriptions(stripe_subscription_id);
CREATE INDEX idx_user_subscriptions_status ON user_subscriptions(status);
```

Click **Run** to execute the query.

### 4. Create Subscription Events Table

This table provides an audit trail of all subscription-related events from Stripe webhooks and likewise reuses the `public.users` relationship.

```sql
-- Create subscription_events table
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES user_subscriptions(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed BOOLEAN DEFAULT false NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Add comment for documentation
COMMENT ON TABLE subscription_events IS 'Audit trail of subscription events from Stripe webhooks';

-- Create indexes for performance and querying
CREATE INDEX idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX idx_subscription_events_subscription_id ON subscription_events(subscription_id);
CREATE INDEX idx_subscription_events_event_type ON subscription_events(event_type);
CREATE INDEX idx_subscription_events_stripe_event_id ON subscription_events(stripe_event_id);
CREATE INDEX idx_subscription_events_created_at ON subscription_events(created_at DESC);
CREATE INDEX idx_subscription_events_processed ON subscription_events(processed) WHERE processed = false;
```

Click **Run** to execute the query.

### 5. Create Updated At Trigger Function

Automatically update the `updated_at` timestamp when records are modified.

```sql
-- Create trigger function for updating updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to subscription_plans
CREATE TRIGGER update_subscription_plans_updated_at
  BEFORE UPDATE ON subscription_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to user_subscriptions
CREATE TRIGGER update_user_subscriptions_updated_at
  BEFORE UPDATE ON user_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

Click **Run** to execute the query.

### 6. Set Up Row Level Security (RLS)

Enable RLS and create policies to ensure users can only access their own subscription data.

```sql
-- Enable RLS on all tables
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Subscription Plans Policies (public read for all authenticated users)
CREATE POLICY "Allow authenticated users to read subscription plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (is_active = true);

-- User Subscriptions Policies (users can only read their own subscription)
CREATE POLICY "Users can read their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all subscriptions (for webhook handler)
CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Subscription Events Policies (users can read their own events)
CREATE POLICY "Users can read their own subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Service role can manage all events (for webhook handler)
CREATE POLICY "Service role can manage all events"
  ON subscription_events
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
```

Click **Run** to execute the query.

### 7. Seed Initial Subscription Plans

Insert the subscription plans that match your Stripe configuration from Task 01.

```sql
-- Insert subscription plans
-- Note: Replace price_XXX with your actual Stripe Price IDs from Task 01

INSERT INTO subscription_plans (stripe_product_id, stripe_price_id, name, description, price, currency, interval, features)
VALUES
  (
    'prod_pro', -- Replace with actual Stripe Product ID for Pro
    'price_XXX_PRO', -- Replace with actual Stripe Price ID from Task 01
    'Pro',
    'Advanced features for professional referees',
    9.99,
    'usd',
    'month',
    '[
      "Unlimited matches",
      "Advanced analytics",
      "AI chat assistance",
      "Calendar integration",
      "Export functionality"
    ]'::jsonb
  ),
  (
    'prod_team', -- Replace with actual Stripe Product ID for Team
    'price_XXX_TEAM', -- Replace with actual Stripe Price ID from Task 01
    'Team',
    'Team management and collaboration tools',
    29.99,
    'usd',
    'month',
    '[
      "Everything in Pro",
      "Multi-user access (up to 5 users)",
      "Team management",
      "Priority support",
      "Custom branding"
    ]'::jsonb
  )
ON CONFLICT (stripe_price_id) DO NOTHING;
```

**Important**: Before running, update the `stripe_product_id` and `stripe_price_id` values with your actual IDs from the Stripe Dashboard.

To find these IDs:
1. Go to Stripe Dashboard → **Products**
2. Click on each product
3. Copy the **Product ID** (starts with `prod_...`)
4. Copy the **Price ID** (starts with `price_...`)

Click **Run** to execute the query.

### 8. Create Helper Functions

Create SQL functions to simplify common subscription queries.

```sql
-- Function to get user's current subscription with plan details
CREATE OR REPLACE FUNCTION get_user_subscription(user_uuid UUID)
RETURNS TABLE (
  subscription_id UUID,
  plan_name TEXT,
  plan_price DECIMAL,
  status TEXT,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    us.id,
    sp.name,
    sp.price,
    us.status,
    us.current_period_end,
    us.cancel_at_period_end
  FROM user_subscriptions us
  LEFT JOIN subscription_plans sp ON us.plan_id = sp.id
  WHERE us.user_id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has active subscription
CREATE OR REPLACE FUNCTION has_active_subscription(user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM user_subscriptions
    WHERE user_id = user_uuid
      AND status IN ('active', 'trialing')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

Click **Run** to execute the query.

### 9. Create TypeScript Types

Create TypeScript types that match your database schema.

**File:** `lib/types/subscription.ts`

```typescript
/**
 * Subscription-related types matching Supabase schema
 */

import type { Database } from "./supabase"

// Stripe subscription status types
export type SubscriptionStatus =
  | "incomplete"
  | "incomplete_expired"
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "paused"

// Database table types
export type SubscriptionPlan =
  Database["public"]["Tables"]["subscription_plans"]["Row"]
export type UserSubscription =
  Database["public"]["Tables"]["user_subscriptions"]["Row"]
export type SubscriptionEvent =
  Database["public"]["Tables"]["subscription_events"]["Row"]

// Insert types
export type SubscriptionPlanInsert =
  Database["public"]["Tables"]["subscription_plans"]["Insert"]
export type UserSubscriptionInsert =
  Database["public"]["Tables"]["user_subscriptions"]["Insert"]
export type SubscriptionEventInsert =
  Database["public"]["Tables"]["subscription_events"]["Insert"]

// Update types
export type SubscriptionPlanUpdate =
  Database["public"]["Tables"]["subscription_plans"]["Update"]
export type UserSubscriptionUpdate =
  Database["public"]["Tables"]["user_subscriptions"]["Update"]

// Extended types with relations
export interface UserSubscriptionWithPlan extends UserSubscription {
  plan: SubscriptionPlan | null
}

// UI-friendly subscription info
export interface SubscriptionInfo {
  isActive: boolean
  planName: string
  planPrice: number
  status: SubscriptionStatus
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  canUpgrade: boolean
  canDowngrade: boolean
}
```

### 10. Verify Database Schema

Create a verification query to check that everything is set up correctly:

```sql
-- Verification query
SELECT
  'subscription_plans' as table_name,
  COUNT(*) as row_count
FROM subscription_plans
UNION ALL
SELECT
  'user_subscriptions' as table_name,
  COUNT(*) as row_count
FROM user_subscriptions
UNION ALL
SELECT
  'subscription_events' as table_name,
  COUNT(*) as row_count
FROM subscription_events;

-- Check RLS is enabled
SELECT
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables
WHERE tablename IN ('subscription_plans', 'user_subscriptions', 'subscription_events');

-- Verify indexes exist
SELECT
  tablename,
  indexname
FROM pg_indexes
WHERE tablename IN ('subscription_plans', 'user_subscriptions', 'subscription_events')
ORDER BY tablename, indexname;
```

Click **Run** to verify.

## Verification Checklist

- [ ] All three tables created successfully (`subscription_plans`, `user_subscriptions`, `subscription_events`)
- [ ] Updated at triggers applied to relevant tables
- [ ] Row Level Security enabled on all tables
- [ ] RLS policies created for authenticated users and service role
- [ ] Indexes created for performance optimization
- [ ] Subscription plans seeded with data from Stripe
- [ ] Helper functions created (`get_user_subscription`, `has_active_subscription`)
- [ ] TypeScript types created in `lib/types/subscription.ts`
- [ ] Verification queries run successfully
- [ ] No SQL errors in Supabase logs

## Expected Output

After completing this task:
1. Supabase Database shows 3 new tables in the **Table Editor**
2. `subscription_plans` table contains 2 rows (Pro and Team)
3. RLS policies are active and enforced
4. Verification queries return expected results
5. TypeScript types are available for import

## Troubleshooting

### Error: "relation already exists"
- Tables may already exist from a previous attempt
- Drop the tables first: `DROP TABLE IF EXISTS subscription_events, user_subscriptions, subscription_plans CASCADE;`
- Then re-run the migration

### Error: "permission denied"
- Ensure you're using the SQL Editor with proper permissions
- Check that RLS policies allow your operations

### Seed Data Not Inserting
- Verify you replaced `price_XXX_PRO` and `price_XXX_TEAM` with actual Stripe Price IDs
- Check for unique constraint violations if running multiple times
- The `ON CONFLICT DO NOTHING` should prevent duplicates

### Type Generation Issues
- Regenerate Supabase types: `pnpm supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/types/supabase.ts`
- Ensure you have the latest Supabase CLI installed

## Next Steps

Once this task is complete, proceed to **[TASK_03_checkout_integration.md](TASK_03_checkout_integration.md)** to implement Stripe Checkout for subscription payments.

## Resources

- [Supabase SQL Editor](https://supabase.com/docs/guides/database)
- [PostgreSQL Data Types](https://www.postgresql.org/docs/current/datatype.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Stripe Subscription Object](https://stripe.com/docs/api/subscriptions/object)
- [Stripe Subscription Statuses](https://stripe.com/docs/billing/subscriptions/overview#subscription-statuses)
