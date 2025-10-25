# CourierRun - Logistics Management Platform

A comprehensive logistics management application built with Next.js 15, Supabase, and modern web technologies.

## Overview

CourierRun is a logistics-focused application designed to streamline driver roster management, delivery tracking, and fleet operations. Built with performance and scalability in mind, it provides real-time updates and notifications for efficient logistics coordination.

## Features

- **Weekly Roster Management**: Create, publish, and manage driver schedules with ease
- **Driver Assignments**: Assign drivers to shifts and vehicles with automatic conflict detection
- **Email Notifications**: Automated notifications via Resend for roster updates and changes
- **Real-time Calendar**: Visual calendar interface for managing shifts and deliveries
- **Fleet Management**: Track vehicles and driver assignments
- **Multi-tenant Support**: Organization-level data isolation with Row Level Security (RLS)
- **AI Chat Assistant**: Get insights on delivery patterns and roster planning

## Tech Stack

- **Framework**: Next.js 15 with React 19
- **Authentication**: Supabase Auth
- **Database**: PostgreSQL via Supabase
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand
- **Email**: Resend
- **AI**: OpenAI integration for chat features
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm installed
- Supabase account and project
- Resend API key (for email notifications)
- OpenAI API key (for chat features)

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd LogisticsV0
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up environment variables:
   Create a `.env.local` file in the root directory (see `.env.example` for reference):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
RESEND_API_KEY=your_resend_api_key
OPENAI_API_KEY=your_openai_api_key
```

4. Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `pnpm dev` - Start development server
- `pnpm build` - Build for production
- `pnpm start` - Start production server
- `pnpm lint` - Run Ultracite linter (check only)
- `pnpm lint:fix` - Run Ultracite linter and apply fixes
- `pnpm format` - Format and fix code with Ultracite
- `pnpm type-check` - Check for TypeScript type errors
- `pnpm test` - Run tests with Vitest
- `pnpm test:coverage` - Generate test coverage reports

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `pnpm lint` and `pnpm type-check`
4. Submit a pull request

## License

Proprietary - All rights reserved

**Authentication Users:** Use the following test users for authentication:
testuser@logisticsv0.com

- Driver: `driver@example.com`
- Team Leader: `team-leader@example.com`
- Customer Support: `customer-support@example.com`
- Retail Officer: `retail-officer@example.com`
- Password: `Password123!` (all users)
