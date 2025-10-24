---
task_id: 01
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Stripe Account Setup and Configuration
phase: Phase 1 - Foundation
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 60
dependencies: []
tags: [stripe, setup, configuration, products, pricing]
---

# Task 01: Stripe Account Setup and Configuration

## Objective

Set up Stripe account, configure products and pricing tiers, install required dependencies, and configure environment variables for the subscription system.

## Prerequisites

- Access to create a Stripe account (or use existing account)
- Project repository cloned locally
- Access to `.env.local` file

## Step-by-Step Instructions

### 1. Create Stripe Account (if needed)

1. Go to [stripe.com](https://stripe.com) and sign up for a free account
2. Complete email verification
3. Fill in business details (can use test data for development)
4. Navigate to the Dashboard

### 2. Enable Test Mode

1. In the Stripe Dashboard, ensure you're in **Test Mode** (toggle in top-right)
2. You'll see "Test Mode" banner - this is where you'll work during development

### 3. Create Subscription Products

Navigate to **Products** → **Add Product** and create the following:

#### Free Tier (Reference Product)
- **Name**: "RefZone Free"
- **Description**: "Basic match tracking for individual referees"
- **Pricing**: $0.00 (not a Stripe subscription, just for reference)
- **Features to note** (for UI display):
  - Basic match tracking
  - Limited to 10 matches per month
  - Basic statistics

#### Pro Tier
- **Name**: "RefZone Pro"
- **Description**: "Advanced features for professional referees"
- **Pricing Model**: Recurring
- **Price**: $9.99 USD
- **Billing Period**: Monthly
- Click **Add product**
- **Copy the Price ID** (starts with `price_...`) - you'll need this later

#### Team Tier
- **Name**: "RefZone Team"
- **Description**: "Team management and collaboration tools"
- **Pricing Model**: Recurring
- **Price**: $29.99 USD
- **Billing Period**: Monthly
- Click **Add product**
- **Copy the Price ID** (starts with `price_...`) - you'll need this later

### 4. Get API Keys

1. Navigate to **Developers** → **API Keys**
2. Copy the following keys:
   - **Publishable key** (starts with `pk_test_...`)
   - **Secret key** (starts with `sk_test_...`) - Click "Reveal test key"

⚠️ **Never commit the secret key to version control!**

### 5. Set Up Webhook Endpoint (Placeholder)

1. Navigate to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. For now, use a placeholder URL: `https://your-app-url.com/api/stripe/webhook`
4. Select the following events to listen to:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.updated`
5. Click **Add endpoint**
6. **Copy the Signing secret** (starts with `whsec_...`)

> Note: You'll update this with your actual URL later. For local development, you'll use Stripe CLI.

### 6. Install Stripe Dependencies

Run the following command in your project directory:

```bash
pnpm add stripe @stripe/stripe-js
```

This installs:
- `stripe` - Official Stripe Node.js SDK (for server-side)
- `@stripe/stripe-js` - Stripe.js library (for client-side)

### 7. Configure Environment Variables

Add the following to your `.env.local` file:

```env
# Stripe API Keys (Test Mode)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE

# Stripe Product/Price IDs
STRIPE_PRO_PRICE_ID=price_YOUR_PRO_PRICE_ID_HERE
STRIPE_TEAM_PRICE_ID=price_YOUR_TEAM_PRICE_ID_HERE

# Application URL (for Stripe redirects)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Replace the placeholder values with your actual keys from steps 3 and 4.

### 8. Install Stripe CLI (for Local Webhook Testing)

The Stripe CLI allows you to test webhooks locally without deploying.

**macOS (Homebrew):**
```bash
brew install stripe/stripe-cli/stripe
```

**Windows (Scoop):**
```bash
scoop bucket add stripe https://github.com/stripe/scoop-stripe-cli.git
scoop install stripe
```

**Linux:**
```bash
# Download and install from https://github.com/stripe/stripe-cli/releases/latest
```

**Verify installation:**
```bash
stripe --version
```

**Login to Stripe CLI:**
```bash
stripe login
```

This will open a browser window to authorize the CLI.

### 9. Create Stripe Configuration File

Create a new file to centralize Stripe configuration:

**File:** `lib/stripe/config.ts`

```typescript
/**
 * Stripe configuration and initialization
 */

import Stripe from "stripe"

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("Missing STRIPE_SECRET_KEY environment variable")
}

/**
 * Stripe SDK instance for server-side operations
 * Configured with latest API version and TypeScript support
 */
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-12-18.acacia", // Use latest API version
  typescript: true,
})

/**
 * Subscription price IDs from environment variables
 */
export const STRIPE_PRICES = {
  PRO: process.env.STRIPE_PRO_PRICE_ID!,
  TEAM: process.env.STRIPE_TEAM_PRICE_ID!,
} as const

/**
 * Subscription plan metadata
 * Used for UI display and feature gating
 */
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: "Free",
    price: 0,
    interval: "month",
    features: [
      "Basic match tracking",
      "Up to 10 matches per month",
      "Basic statistics",
    ],
  },
  PRO: {
    name: "Pro",
    price: 9.99,
    priceId: STRIPE_PRICES.PRO,
    interval: "month",
    features: [
      "Unlimited matches",
      "Advanced analytics",
      "AI chat assistance",
      "Calendar integration",
      "Export functionality",
    ],
  },
  TEAM: {
    name: "Team",
    price: 29.99,
    priceId: STRIPE_PRICES.TEAM,
    interval: "month",
    features: [
      "Everything in Pro",
      "Multi-user access (up to 5 users)",
      "Team management",
      "Priority support",
      "Custom branding",
    ],
  },
} as const

export type SubscriptionPlan = keyof typeof SUBSCRIPTION_PLANS
```

### 10. Verify Configuration

Create a simple test file to verify your Stripe configuration:

**File:** `lib/stripe/__tests__/config.test.ts`

```typescript
import { describe, expect, it } from "vitest"
import { stripe, STRIPE_PRICES, SUBSCRIPTION_PLANS } from "../config"

describe("Stripe Configuration", () => {
  it("should initialize Stripe client", () => {
    expect(stripe).toBeDefined()
  })

  it("should have required price IDs", () => {
    expect(STRIPE_PRICES.PRO).toBeDefined()
    expect(STRIPE_PRICES.TEAM).toBeDefined()
  })

  it("should have valid subscription plans", () => {
    expect(SUBSCRIPTION_PLANS.FREE).toBeDefined()
    expect(SUBSCRIPTION_PLANS.PRO).toBeDefined()
    expect(SUBSCRIPTION_PLANS.TEAM).toBeDefined()
  })
})
```

Run the test:
```bash
pnpm run test lib/stripe/__tests__/config.test.ts
```

## Verification Checklist

- [ ] Stripe account created and verified
- [ ] Test mode enabled in Stripe Dashboard
- [ ] Three products created (Free reference, Pro, Team)
- [ ] Price IDs copied for Pro and Team tiers
- [ ] API keys (publishable and secret) copied
- [ ] Webhook endpoint created with signing secret
- [ ] Dependencies installed (`stripe`, `@stripe/stripe-js`)
- [ ] Environment variables configured in `.env.local`
- [ ] Stripe CLI installed and authenticated
- [ ] Stripe config file created at `lib/stripe/config.ts`
- [ ] Configuration test passes

## Expected Output

After completing this task:
1. Stripe Dashboard shows 2 active subscription products (Pro and Team)
2. `pnpm run dev` starts without errors
3. Environment variables are properly loaded
4. Stripe SDK is initialized and ready to use
5. Configuration test passes

## Troubleshooting

### Error: "Missing STRIPE_SECRET_KEY"
- Ensure `.env.local` exists in project root
- Verify the variable name matches exactly (case-sensitive)
- Restart your development server after adding env variables

### Stripe CLI Not Found
- Ensure installation completed successfully
- Restart your terminal after installation
- Check PATH includes Stripe CLI location

### API Version Mismatch
- Use the latest stable API version from [Stripe API Changelog](https://stripe.com/docs/upgrades#api-versions)
- Update the `apiVersion` in `lib/stripe/config.ts`

## Next Steps

Once this task is complete, proceed to **[TASK_02_database_schema.md](TASK_02_database_schema.md)** to set up the database schema for storing subscription data.

## Resources

- [Stripe Dashboard](https://dashboard.stripe.com)
- [Stripe API Documentation](https://stripe.com/docs/api)
- [Stripe CLI Documentation](https://stripe.com/docs/stripe-cli)
- [Stripe Testing Guide](https://stripe.com/docs/testing)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
