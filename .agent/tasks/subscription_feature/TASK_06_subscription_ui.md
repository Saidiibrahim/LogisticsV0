---
task_id: 06
plan_id: subscription_feature
plan_file: ../../plans/PLAN_subscription_feature.md
title: Pricing and Subscription UI
phase: Phase 3 - User Interface
created: 2025-10-08
status: Ready
priority: High
estimated_minutes: 90
dependencies: [TASK_03_checkout_integration.md, TASK_05_state_management.md]
tags: [ui, components, pricing, subscription, react]
---

# Task 06: Pricing and Subscription UI

## Objective

Build a complete subscription management UI including a pricing page with plan comparison, current subscription display, and upgrade/downgrade options. Create reusable components following shadcn/ui design patterns.

## Prerequisites

- Task 03 (Checkout Integration) completed
- Task 05 (State Management) completed
- Familiarity with shadcn/ui components

## Step-by-Step Instructions

### 1. Create Pricing Page

Build the main pricing page where users can view and select plans.

**File:** `app/(authenticated)/subscription/page.tsx`

```typescript
import { Suspense } from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { PricingSection } from "@/components/subscription/pricing-section"
import { CurrentSubscription } from "@/components/subscription/current-subscription"
import { Skeleton } from "@/components/ui/skeleton"

export const metadata = {
  title: "Subscription Plans | RefZone",
  description: "Choose the perfect plan for your refereeing needs",
}

async function SubscriptionContent() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch subscription plans from database
  const { data: plans } = await supabase
    .from("subscription_plans")
    .select("*")
    .eq("is_active", true)
    .order("price", { ascending: true })

  // Fetch user's current subscription
  const { data: currentSubscription } = await supabase
    .from("user_subscriptions")
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq("user_id", user.id)
    .single()

  return (
    <div className="container mx-auto py-12">
      <div className="mb-12 text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight">
          Choose Your Plan
        </h1>
        <p className="text-lg text-muted-foreground">
          Select the perfect plan for your refereeing journey
        </p>
      </div>

      {currentSubscription && (
        <div className="mb-12">
          <CurrentSubscription subscription={currentSubscription} />
        </div>
      )}

      <PricingSection
        plans={plans || []}
        currentPlanId={currentSubscription?.plan?.id}
      />
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto py-12">
          <Skeleton className="mb-4 h-12 w-64" />
          <Skeleton className="mb-12 h-6 w-96" />
          <div className="grid gap-8 md:grid-cols-3">
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
            <Skeleton className="h-96" />
          </div>
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  )
}
```

### 2. Create Pricing Section Component

Display all available plans in a comparison grid.

**File:** `components/subscription/pricing-section.tsx`

```typescript
"use client"

import { PricingCard } from "./pricing-card"
import type { SubscriptionPlan } from "@/lib/types/subscription"

interface PricingSectionProps {
  plans: SubscriptionPlan[]
  currentPlanId?: string
}

export function PricingSection({ plans, currentPlanId }: PricingSectionProps) {
  // Add Free plan manually (not in database)
  const allPlans = [
    {
      id: "free",
      name: "Free",
      description: "Perfect for getting started",
      price: 0,
      features: [
        "Basic match tracking",
        "Up to 10 matches per month",
        "Basic statistics",
        "Community support",
      ],
    },
    ...plans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      description: plan.description || "",
      price: Number(plan.price),
      priceId: plan.stripe_price_id,
      features: (plan.features as string[]) || [],
    })),
  ]

  return (
    <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      {allPlans.map((plan, index) => (
        <PricingCard
          key={plan.id}
          name={plan.name}
          description={plan.description}
          price={plan.price}
          priceId={plan.priceId}
          features={plan.features}
          isCurrentPlan={currentPlanId === plan.id || (currentPlanId === undefined && plan.id === "free")}
          isPopular={index === 1} // Make the middle plan (usually Pro) popular
        />
      ))}
    </div>
  )
}
```

### 3. Create Current Subscription Component

Display detailed information about the user's current subscription.

**File:** `components/subscription/current-subscription.tsx`

```typescript
"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, CreditCard, Crown } from "lucide-react"
import type { UserSubscriptionWithPlan } from "@/lib/types/subscription"
import Link from "next/link"

interface CurrentSubscriptionProps {
  subscription: UserSubscriptionWithPlan
}

export function CurrentSubscription({
  subscription,
}: CurrentSubscriptionProps) {
  const isActive =
    subscription.status === "active" || subscription.status === "trialing"
  const isCanceled = subscription.cancel_at_period_end

  const statusColor = {
    active: "bg-green-500",
    trialing: "bg-blue-500",
    past_due: "bg-yellow-500",
    canceled: "bg-red-500",
    incomplete: "bg-gray-500",
  }[subscription.status] || "bg-gray-500"

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            Current Plan
          </CardTitle>
          <Badge
            variant="outline"
            className={`${statusColor} border-0 text-white`}
          >
            {subscription.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Plan Name */}
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-2xl font-bold">
              {subscription.plan?.name || "Free"}
            </p>
          </div>

          {/* Price */}
          <div>
            <p className="text-sm text-muted-foreground">Price</p>
            <p className="text-2xl font-bold">
              ${Number(subscription.plan?.price || 0).toFixed(2)}
              <span className="text-sm font-normal text-muted-foreground">
                /month
              </span>
            </p>
          </div>

          {/* Billing Period */}
          {subscription.current_period_end && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">
                  {isCanceled ? "Access until" : "Renews on"}
                </p>
                <p className="font-medium">
                  {new Date(subscription.current_period_end).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}

          {/* Status Messages */}
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">
                {isCanceled
                  ? "Cancels at period end"
                  : isActive
                    ? "Active"
                    : "Inactive"}
              </p>
            </div>
          </div>
        </div>

        {/* Manage Button */}
        <div className="pt-4">
          <Button asChild variant="outline" className="w-full">
            <Link href="/subscription/manage">Manage Subscription</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
```

### 4. Create Plan Comparison Table

Build a detailed feature comparison table.

**File:** `components/subscription/plan-comparison.tsx`

```typescript
"use client"

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Check, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const PLAN_FEATURES = [
  {
    category: "Match Tracking",
    features: [
      { name: "Basic match tracking", free: true, pro: true, team: true },
      { name: "Matches per month", free: "10", pro: "Unlimited", team: "Unlimited" },
      { name: "Match history", free: "30 days", pro: "Unlimited", team: "Unlimited" },
    ],
  },
  {
    category: "Analytics",
    features: [
      { name: "Basic statistics", free: true, pro: true, team: true },
      { name: "Advanced analytics", free: false, pro: true, team: true },
      { name: "Custom reports", free: false, pro: false, team: true },
      { name: "Data export", free: false, pro: true, team: true },
    ],
  },
  {
    category: "Features",
    features: [
      { name: "AI chat assistance", free: false, pro: true, team: true },
      { name: "Calendar integration", free: false, pro: true, team: true },
      { name: "Team management", free: false, pro: false, team: true },
      { name: "Multi-user access", free: false, pro: false, team: "Up to 5" },
    ],
  },
  {
    category: "Support",
    features: [
      { name: "Community support", free: true, pro: true, team: true },
      { name: "Email support", free: false, pro: true, team: true },
      { name: "Priority support", free: false, pro: false, team: true },
      { name: "Custom branding", free: false, pro: false, team: true },
    ],
  },
]

export function PlanComparison() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Compare Plans</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-1/3">Feature</TableHead>
                <TableHead className="text-center">Free</TableHead>
                <TableHead className="text-center">Pro</TableHead>
                <TableHead className="text-center">Team</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PLAN_FEATURES.map((category) => (
                <>
                  <TableRow key={category.category}>
                    <TableCell
                      colSpan={4}
                      className="bg-muted font-semibold"
                    >
                      {category.category}
                    </TableCell>
                  </TableRow>
                  {category.features.map((feature) => (
                    <TableRow key={feature.name}>
                      <TableCell>{feature.name}</TableCell>
                      <TableCell className="text-center">
                        {renderFeatureValue(feature.free)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderFeatureValue(feature.pro)}
                      </TableCell>
                      <TableCell className="text-center">
                        {renderFeatureValue(feature.team)}
                      </TableCell>
                    </TableRow>
                  ))}
                </>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}

function renderFeatureValue(value: boolean | string) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="inline h-5 w-5 text-green-600" />
    ) : (
      <X className="inline h-5 w-5 text-gray-400" />
    )
  }
  return <span className="text-sm">{value}</span>
}
```

### 5. Create Upgrade/Downgrade Flow

Add logic to handle plan changes.

**File:** `components/subscription/change-plan-button.tsx`

```typescript
"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2 } from "lucide-react"
import { createCheckoutSession } from "@/lib/actions/create-checkout-session"
import { useToast } from "@/hooks/use-toast"

interface ChangePlanButtonProps {
  currentPlan: string
  targetPlan: string
  targetPriceId: string
  isUpgrade: boolean
}

export function ChangePlanButton({
  currentPlan,
  targetPlan,
  targetPriceId,
  isUpgrade,
}: ChangePlanButtonProps) {
  const [showDialog, setShowDialog] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { toast } = useToast()

  const handleConfirm = () => {
    startTransition(async () => {
      try {
        await createCheckoutSession(targetPriceId)
      } catch (error) {
        console.error("Plan change error:", error)
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to change plan. Please try again.",
          variant: "destructive",
        })
        setShowDialog(false)
      }
    })
  }

  return (
    <>
      <Button
        onClick={() => setShowDialog(true)}
        variant={isUpgrade ? "default" : "outline"}
        className="w-full"
      >
        {isUpgrade ? "Upgrade" : "Downgrade"} to {targetPlan}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isUpgrade ? "Upgrade" : "Downgrade"} Plan
            </DialogTitle>
            <DialogDescription>
              {isUpgrade
                ? `You're about to upgrade from ${currentPlan} to ${targetPlan}. You'll be charged immediately and gain access to all ${targetPlan} features.`
                : `You're about to downgrade from ${currentPlan} to ${targetPlan}. Your current plan will remain active until the end of your billing period.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button onClick={handleConfirm} disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
```

### 6. Add Subscription to Navigation

Add a subscription link to the main navigation.

**File:** `components/layout/navigation-data.ts` (update existing file)

```typescript
// Add to navigation items
{
  name: "Subscription",
  href: "/subscription",
  icon: Crown, // Import from lucide-react
},
```

### 7. Create FAQ Section

Add common questions about subscriptions.

**File:** `components/subscription/subscription-faq.tsx`

```typescript
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const FAQ_ITEMS = [
  {
    question: "Can I change my plan at any time?",
    answer:
      "Yes! You can upgrade or downgrade your plan at any time. Upgrades take effect immediately, while downgrades take effect at the end of your current billing period.",
  },
  {
    question: "What payment methods do you accept?",
    answer:
      "We accept all major credit cards (Visa, Mastercard, American Express) through our secure payment processor, Stripe.",
  },
  {
    question: "Can I cancel my subscription?",
    answer:
      "Yes, you can cancel your subscription at any time from the subscription management page. You'll continue to have access until the end of your billing period.",
  },
  {
    question: "Do you offer refunds?",
    answer:
      "We offer a 14-day money-back guarantee for first-time subscribers. If you're not satisfied, contact our support team for a full refund.",
  },
  {
    question: "What happens to my data if I cancel?",
    answer:
      "Your data remains safe for 90 days after cancellation. You can reactivate your subscription anytime during this period to restore full access.",
  },
]

export function SubscriptionFAQ() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Frequently Asked Questions</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {FAQ_ITEMS.map((item, index) => (
            <AccordionItem key={index} value={`item-${index}`}>
              <AccordionTrigger>{item.question}</AccordionTrigger>
              <AccordionContent>{item.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
```

### 8. Add FAQ to Pricing Page

Update the pricing page to include FAQ section.

**File:** `app/(authenticated)/subscription/page.tsx` (update)

Add before the closing `</div>`:

```typescript
<div className="mt-12">
  <SubscriptionFAQ />
</div>
```

## Verification Checklist

- [ ] Pricing page created at `/subscription`
- [ ] All plan cards display correctly
- [ ] Current subscription shows proper information
- [ ] Feature comparison table displays all features
- [ ] Upgrade/downgrade buttons work
- [ ] FAQ section displays and is interactive
- [ ] Subscription link added to navigation
- [ ] Page is responsive on mobile devices
- [ ] Loading states work correctly
- [ ] No console errors

## Testing Guide

### Test Pricing Page Display

1. Navigate to `/subscription` while logged in
2. Verify all three plans (Free, Pro, Team) display
3. Check that pricing information is accurate
4. Verify feature lists are complete

### Test Current Subscription Display

1. If you have an active subscription, verify it displays correctly
2. Check that status badge shows correct color
3. Verify billing date is accurate
4. Test "Manage Subscription" button

### Test Plan Comparison

1. Scroll to comparison table
2. Verify all features are listed
3. Check checkmarks and X marks display correctly
4. Ensure table is readable on mobile

### Test Upgrade Flow

1. Click upgrade button on a plan
2. Verify confirmation dialog appears
3. Check dialog text is appropriate
4. Test cancel and confirm buttons

## Styling Guidelines

Follow these design principles:

1. **Consistency**: Match existing shadcn/ui component styles
2. **Spacing**: Use consistent padding and margins (4, 6, 8, 12)
3. **Typography**: Use appropriate font sizes and weights
4. **Colors**: Follow the theme color palette
5. **Responsiveness**: Ensure mobile-first design
6. **Accessibility**: Proper ARIA labels and keyboard navigation

## Troubleshooting

### Plans not displaying
- Check Supabase query returns data
- Verify `is_active = true` on plans
- Check console for errors

### Current subscription not showing
- Verify user has a subscription in database
- Check RLS policies allow reading subscription
- Ensure join query is correct

### Buttons not working
- Check server action is imported correctly
- Verify price IDs are valid
- Check browser console for JavaScript errors

### Styling issues
- Clear browser cache
- Check Tailwind CSS classes are valid
- Verify component imports are correct

## Expected Output

After completing this task:
1. Users can view all available subscription plans
2. Current subscription is clearly displayed
3. Feature comparison helps users make informed decisions
4. Upgrade/downgrade flow is smooth and intuitive
5. FAQ answers common questions
6. UI is polished and professional

## Next Steps

Once this task is complete, proceed to **[TASK_07_customer_portal.md](TASK_07_customer_portal.md)** to integrate the Stripe Customer Portal for subscription management.

## Resources

- [shadcn/ui Components](https://ui.shadcn.com/docs/components)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Pricing Page Best Practices](https://www.stripe.com/resources/more/pricing-page-design-best-practices)
- [SaaS Pricing Models](https://stripe.com/resources/more/saas-pricing-models)
