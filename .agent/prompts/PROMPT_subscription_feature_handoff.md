---
plan_id: subscription_feature
title: Subscription Feature Implementation - Developer Handoff
created: 2025-10-08
status: Ready for Development
tags: [handoff, stripe, subscription, onboarding]
---

# Subscription Feature Implementation - Developer Handoff

Welcome! This document will guide you through implementing a complete subscription and billing system for RefZone using Stripe. By the end of this implementation, users will be able to subscribe to paid plans, manage their subscriptions, and access premium features.

## 🎯 Mission Statement

**Build a production-ready subscription system** that allows RefZone users to:
- Subscribe to Pro ($9.99/month) or Team ($29.99/month) plans
- Securely process payments through Stripe
- Self-manage subscriptions via Stripe Customer Portal
- Access premium features based on subscription status
- View current plan and billing information

## 📋 Prerequisites

Before starting, ensure you have:

- [ ] RefZone development environment set up
- [ ] Access to the project's Supabase instance
- [ ] Node.js 18+ and pnpm installed
- [ ] Basic understanding of Next.js 15 App Router
- [ ] Familiarity with React Server Components and Server Actions
- [ ] Understanding of TypeScript
- [ ] A Stripe account (free to create)

## 🏗️ Project Context

### Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript (strict mode)
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **State Management**: Zustand
- **Payment Processing**: Stripe
- **UI Components**: shadcn/ui
- **Styling**: Tailwind CSS 4

### Key Architectural Patterns

1. **Supabase Client Usage**
   - Always create new clients within functions (never global)
   - Server components: `await createClient()` from `@/lib/supabase/server`
   - Client components: `createClient()` from `@/lib/supabase/client`
   - Important for Vercel's Fluid compute compatibility

2. **Server Actions**
   - All Stripe operations must happen server-side
   - Use `"use server"` directive
   - Never expose secret keys to client

3. **State Management**
   - Follow existing Zustand store patterns
   - See `lib/stores/use-user-store.ts` for reference
   - Use devtools middleware in development

4. **Component Structure**
   - shadcn/ui components in `components/ui/`
   - Feature-specific components in `components/subscription/`
   - Follow existing naming conventions

## 📁 Repository Structure

```
RefZone-Web-v0/
├── app/
│   ├── (authenticated)/         # Protected routes
│   │   └── subscription/        # Subscription pages (you'll create)
│   └── api/
│       └── stripe/              # Stripe API routes (you'll create)
├── components/
│   ├── ui/                      # shadcn/ui components
│   └── subscription/            # Subscription components (you'll create)
├── lib/
│   ├── actions/                 # Server actions
│   ├── stores/                  # Zustand stores
│   ├── stripe/                  # Stripe utilities (you'll create)
│   ├── supabase/                # Supabase clients
│   └── types/                   # TypeScript types
└── docs/                        # Documentation
```

## 🚀 Getting Started

### Step 1: Read the Plan

Start by reading the complete plan document:

**File**: [`.agent/plans/PLAN_subscription_feature.md`](../plans/PLAN_subscription_feature.md)

This plan provides:
- Complete system architecture
- Database schema design
- API route structure
- Component hierarchy
- Security considerations

### Step 2: Understand the Task Sequence

You'll implement **8 sequential tasks**, estimated at **8-10 hours total**:

1. **[Stripe Setup](../tasks/subscription_feature/TASK_01_stripe_setup.md)** (60 min)
   - Create Stripe account and configure products
   - Install dependencies
   - Set up environment variables
   - Configure Stripe SDK

2. **[Database Schema](../tasks/subscription_feature/TASK_02_database_schema.md)** (90 min)
   - Create subscription tables in Supabase
   - Set up Row Level Security policies
   - Add indexes and triggers
   - Seed initial data

3. **[Checkout Integration](../tasks/subscription_feature/TASK_03_checkout_integration.md)** (120 min)
   - Build Stripe Checkout flow
   - Create server actions for payments
   - Implement success/cancel pages
   - Add subscribe buttons

4. **[Webhook Handler](../tasks/subscription_feature/TASK_04_webhook_handler.md)** (120 min)
   - Create webhook endpoint
   - Implement event handlers
   - Set up local webhook testing
   - Ensure database synchronization

5. **[State Management](../tasks/subscription_feature/TASK_05_state_management.md)** (60 min)
   - Create Zustand subscription store
   - Build React hooks
   - Implement feature gates
   - Add subscription components

6. **[Subscription UI](../tasks/subscription_feature/TASK_06_subscription_ui.md)** (90 min)
   - Build pricing page
   - Create plan comparison
   - Add upgrade/downgrade UI
   - Implement FAQ section

7. **[Customer Portal](../tasks/subscription_feature/TASK_07_customer_portal.md)** (60 min)
   - Configure Stripe Customer Portal
   - Create portal session handler
   - Build management interface
   - Handle portal returns

8. **[Testing & Deployment](../tasks/subscription_feature/TASK_08_testing_deployment.md)** (120 min)
   - Run comprehensive tests
   - Configure production Stripe
   - Deploy to production
   - Monitor and verify

### Step 3: Set Up Your Development Environment

```bash
# Clone the repository (if not already done)
git clone <repository-url>
cd RefZone-Web-v0

# Install dependencies
pnpm install

# Copy environment template
cp .env.example .env.local

# Add your Supabase credentials (already configured)
# You'll add Stripe credentials in Task 01

# Start development server
pnpm run dev
```

## 📝 Development Workflow

### For Each Task

1. **Read the task document thoroughly**
   - Understand objectives and prerequisites
   - Review code examples
   - Check verification checklist

2. **Create a feature branch**
   ```bash
   git checkout -b feat/subscription-task-XX
   ```

3. **Implement the task**
   - Follow step-by-step instructions
   - Write code incrementally
   - Test as you go

4. **Verify completion**
   - Run tests: `pnpm run test`
   - Check types: `pnpm run type-check`
   - Lint code: `pnpm run lint`
   - Review checklist in task document

5. **Commit your work**
   ```bash
   git add .
   git commit -m "feat: complete task XX - <description>"
   ```

6. **Move to next task**
   - Only proceed when current task is complete
   - Tasks build on each other sequentially

## 🔑 Important Code Patterns

### Supabase Client (Server-Side)

```typescript
import { createClient } from "@/lib/supabase/server"

export async function someServerAction() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  // Use supabase client...
}
```

### Supabase Client (Client-Side)

```typescript
"use client"

import { createClient } from "@/lib/supabase/client"

export function SomeComponent() {
  const supabase = createClient()

  // Use supabase client...
}
```

### Server Actions

```typescript
"use server"

import { createClient } from "@/lib/supabase/server"

export async function myServerAction() {
  // Authenticate user
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error("Unauthorized")
  }

  // Perform action...
}
```

### Zustand Store Pattern

```typescript
"use client"

import { create } from "zustand"
import { devtools } from "zustand/middleware"

interface MyState {
  value: string
}

interface MyActions {
  setValue: (value: string) => void
}

export const useMyStore = create<MyState & MyActions>()(
  devtools(
    (set) => ({
      value: "",
      setValue: (value) => set({ value }, false, "my/setValue"),
    }),
    {
      name: "MyStore",
      enabled: process.env.NODE_ENV !== "production",
    }
  )
)
```

## 🔒 Security Best Practices

### Critical Rules

1. **Never expose Stripe secret keys**
   - Always use environment variables
   - Never commit `.env.local` to git
   - All Stripe operations server-side only

2. **Verify webhook signatures**
   - Always validate Stripe webhook signatures
   - Use raw request body for verification
   - Check signing secret matches

3. **Validate user ownership**
   - Always verify customer belongs to authenticated user
   - Check user_id matches before operations
   - Use RLS policies in Supabase

4. **Handle sensitive data**
   - Never log full customer or payment data
   - Redact sensitive info in logs
   - Follow PCI compliance guidelines

5. **Use HTTPS in production**
   - Stripe requires HTTPS
   - Webhooks must be HTTPS endpoints
   - Test cards only work in test mode

## 🧪 Testing Strategy

### During Development

1. **Use Stripe Test Mode**
   - All development in test mode
   - Use test card: 4242 4242 4242 4242
   - Test various scenarios (success, failure, etc.)

2. **Local Webhook Testing**
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```

3. **Database Verification**
   - Check Supabase tables after each operation
   - Verify RLS policies work correctly
   - Ensure webhook events are logged

### Test Cards

- **Success**: 4242 4242 4242 4242
- **Decline**: 4000 0000 0000 0002
- **3D Secure**: 4000 0025 0000 3155
- **Insufficient Funds**: 4000 0000 0000 9995

All test cards:
- Expiry: Any future date
- CVC: Any 3 digits
- ZIP: Any valid ZIP code

## 🐛 Common Pitfalls to Avoid

1. **Storing Supabase client in global variable**
   - ❌ `const supabase = createClient()` at module level
   - ✅ Always create client inside functions

2. **Forgetting to verify webhooks**
   - ❌ Processing events without signature check
   - ✅ Always use `stripe.webhooks.constructEvent()`

3. **Not handling async properly**
   - ❌ Forgetting `await` on Supabase queries
   - ✅ Always await database operations

4. **Incorrect RLS policies**
   - ❌ Forgetting to enable RLS
   - ✅ Set up policies before testing

5. **Environment variable issues**
   - ❌ Using test keys in production
   - ✅ Verify environment variables match mode

## 📞 Getting Help

### Resources

- **Stripe Documentation**: https://stripe.com/docs
- **Supabase Documentation**: https://supabase.com/docs
- **Next.js Documentation**: https://nextjs.org/docs
- **shadcn/ui Components**: https://ui.shadcn.com

### Debugging Tips

1. **Check browser console** for client-side errors
2. **Check terminal** for server-side errors
3. **Check Stripe Dashboard** for webhook logs
4. **Check Supabase logs** for database errors
5. **Use Stripe CLI** for webhook debugging

### Stripe Dashboard

Monitor events in real-time:
- **Developers → Events**: See all Stripe events
- **Developers → Webhooks**: Check webhook delivery
- **Payments**: View all payment attempts
- **Customers**: See customer data

## ✅ Success Criteria

You've successfully completed the implementation when:

- [ ] Users can subscribe to Pro and Team plans
- [ ] Payments process successfully via Stripe Checkout
- [ ] Webhooks sync subscription data to database
- [ ] Users can manage subscriptions via Customer Portal
- [ ] Feature gates restrict access based on plan
- [ ] Subscription status displays correctly in UI
- [ ] Failed payments are handled gracefully
- [ ] All tests pass
- [ ] Code is deployed to production
- [ ] Monitoring shows healthy metrics

## 🎓 Learning Outcomes

By completing this implementation, you'll gain experience with:

- **Stripe Integration**: Checkout, subscriptions, webhooks, Customer Portal
- **Next.js 15 Patterns**: Server Actions, App Router, streaming
- **Database Design**: Schema design, RLS, migrations
- **State Management**: Zustand stores, React hooks
- **TypeScript**: Advanced types, generics
- **Testing**: Unit tests, integration tests, E2E scenarios
- **Production Deployment**: Environment management, monitoring

## 📅 Estimated Timeline

- **Week 1**: Tasks 1-4 (Foundation & Core Integration)
- **Week 2**: Tasks 5-7 (UI & Customer Portal)
- **Week 3**: Task 8 (Testing & Deployment)

Work at your own pace, but aim for consistent progress.

## 🚦 Ready to Start?

1. ✅ Read this handoff document
2. ✅ Set up development environment
3. ✅ Review the plan document
4. ✅ Start with Task 01: Stripe Setup

**Next Action**: Open [TASK_01_stripe_setup.md](../tasks/subscription_feature/TASK_01_stripe_setup.md) and begin implementation!

---

## 💡 Pro Tips

- **Take breaks between tasks** - Each task is substantial
- **Test incrementally** - Don't wait until the end
- **Read Stripe docs** - They're comprehensive and helpful
- **Use Stripe CLI** - Essential for webhook development
- **Ask questions** - Better to clarify than assume
- **Document issues** - Keep notes on problems and solutions
- **Celebrate progress** - Each completed task is an achievement!

## 🎉 Good Luck!

You're about to build a production-grade subscription system. Take your time, follow the tasks sequentially, and don't hesitate to refer back to this document. You've got this! 💪

---

**Questions or Feedback?** Open an issue in the repository or reach out to the team.

**Last Updated**: 2025-10-08
