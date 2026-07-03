# GymStitch

A comprehensive gym management platform built with Next.js 16, featuring three role-based portals for admins, staff, and members. Manage memberships, track attendance, process payments, handle equipment inventory, and broadcast announcements — all from a single platform.

**Production preview:** [https://gym-management-preview.vercel.app](https://gym-management-preview.vercel.app)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Database** | PostgreSQL with Drizzle ORM |
| **Authentication** | Clerk (email/password, OAuth, magic links) |
| **UI** | Tailwind CSS v4 + HeroUI + Framer Motion |
| **Icons** | Lucide React + React Icons |
| **Charts** | Recharts |
| **Payments** | Razorpay |
| **Toast Notifications** | Sonner |
| **Offline Support** | IndexedDB (via Members module) |

## Architecture

The app follows a **Server Component + Client Component** hybrid pattern:

- **Server Components** (`async function page()`) fetch data via server actions and pass it as props to client components
- **Client Components** (`'use client'`) manage interactivity, CRUD operations, and real-time updates
- **Server Actions** (`action.ts`) run database queries with permission checks and revalidate paths

### Route Structure

```
app/
├── (auth)/          # Login & register pages
├── admin/           # Admin portal
├── staff/           # Staff portal
├── dashboard/       # Member dashboard
├── equipments/      # Public equipment listing
├── components/      # Shared React components
│   ├── admin/       # Admin-only components
│   ├── staff/       # Staff-only components
│   ├── member/      # Member-only components
│   └── shared/      # Shared components (skeletons, toaster)
├── db/              # Database connection
├── interfaces/      # TypeScript interfaces
└── lib/             # Utility functions (permissions, etc.)
```

## User Portals

### Admin Portal (`/admin`)

Full administrative control over all gym operations.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Real-time overview with stats, charts, pending plan requests |
| **Members** | View all members, mark attendance (with time/weight), create payments, view history |
| **Trainers/Staff** | Create, edit, delete staff accounts with granular permission controls |
| **Plans** | Create/edit/delete membership plans with features, pricing, billing duration |
| **Equipment** | Full CRUD for gym equipment with status tracking, maintenance scheduling |
| **Payments** | View all payments with search, filters, pagination, statistics |
| **Broadcast** | Send announcements to all members |
| **Analytics** | Charts and metrics for members, revenue, attendance, equipment |
| **Settings** | Configure Razorpay keys, initial payment amounts, payment gateway toggle |

**Available routes:**
- `/admin` — Dashboard
- `/admin/members` — Member management
- `/admin/trainers` — Staff/Trainer management
- `/admin/plans` — Membership plans
- `/admin/equipment` — Equipment inventory
- `/admin/payments` — Payment records
- `/admin/broadcast` — Announcements
- `/admin/analytics` — Analytics & reports
- `/admin/settings` — System settings

### Staff Portal (`/staff`)

Day-to-day gym operations with permission-based access.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Overview with key metrics and quick actions |
| **Members** | Mark attendance, process payments, view member details |
| **Plans** | View and manage membership plans (create/update based on permissions) |
| **Equipment** | Manage equipment inventory (create/update/delete based on permissions) |
| **Trainers** | View and manage staff (permission-dependent) |
| **Payments** | View payment records with search and filters |
| **Analytics** | View reports and charts |

**Available routes:**
- `/staff` — Dashboard
- `/staff/members` — Member management
- `/staff/plans` — Membership plans
- `/staff/equipment` — Equipment inventory
- `/staff/trainers` — Staff management
- `/staff/payments` — Payment records
- `/staff/analytics` — Analytics & reports

**Permissions system:**
Staff accounts are configured with granular CRUD permissions per module. The permission modules are:
- `members` — Member management
- `plans` — Plan management
- `payments` — Payment processing
- `equipments` — Equipment management
- `trainers` — Staff management
- `broadcast` — Announcements
- `dashboard` — Dashboard access
- `audit` — Audit log access

Each module supports `create`, `read`, `update`, `delete` actions.

### Member Portal (`/dashboard`)

Self-service portal for gym members.

| Feature | Description |
|---------|-------------|
| **Dashboard** | Active plan status, attendance calendar, weight tracking chart, quick actions |
| **Plans** | Browse available plans, request enrollment (online or offline payment) |
| **Profile** | Edit personal details, contact info, emergency contacts |
| **Payments** | View payment history with filters and statistics |
| **Messages** | View broadcast announcements from gym |
| **Settings** | Configure notification preferences and profile visibility |

**Available routes:**
- `/dashboard` — Member dashboard
- `/dashboard/profile` — Edit profile
- `/dashboard/payments` — Payment history
- `/dashboard/messages` — Broadcast messages
- `/dashboard/settings` — Account settings

### Public Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and auth-aware topbar |
| `/equipments` | Public equipment listing with search and category filters |
| `/login` | Sign-in page (email/password + OAuth) |
| `/register` | Registration page |

## Database Schema (Drizzle ORM)

The database uses PostgreSQL with Drizzle ORM. Key tables:

| Table | Description |
|-------|-------------|
| `users` | Extended user profiles (clerkUserId, personal details, emergency contact) |
| `members` | Member records linked to Clerk users |
| `plans` | Membership plans (name, price, billing days, features, offer price) |
| `member_plans` | Junction table linking members to plans with start/end dates |
| `payments` | Payment records (amount, method, source, member ID, plan ID) |
| `equipments` | Gym equipment inventory (name, category, status, quantity, location, maintenance dates) |
| `attendance` | Daily attendance records (time in/out, weight in/out) |
| `broadcasts` | Announcement messages targeting member/staff/admin groups |
| `plan_requests` | Pending plan enrollment requests awaiting admin approval |
| `settings` | System configuration (Razorpay keys, initial payment amount) |

## Installation & Setup

### Prerequisites

- **Node.js** >= 18.18
- **PostgreSQL** database (local or cloud)
- **Clerk** account (for authentication)
- **Razorpay** account (optional, for online payments)

### Step 1: Clone and install dependencies

```bash
git clone <repository-url>
cd gymstitch
npm install
```

### Step 2: Set up environment variables

Create a `.env` file in the project root:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/gymstitch"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Clerk redirect URLs
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/register
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/

# Razorpay (optional - for online payments)
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

### Step 3: Set up Clerk

1. Create a project at [Clerk Dashboard](https://dashboard.clerk.com)
2. Enable **Email/Password** and **OAuth** (Google, GitHub, etc.) sign-in methods
3. Configure redirect URLs to match your environment
4. Copy the publishable key and secret key to `.env`

### Step 4: Set up the database

Run the Drizzle migration to create all tables:

```bash
npx drizzle-kit push
```

This applies the schema from `drizzle/schema.ts` to your PostgreSQL database.

### Step 5: Create admin user

1. Start the app: `npm run dev`
2. Register a new user at `/register`
3. In your Clerk Dashboard, find the user and add `privateMetadata`:

```json
{
  "user": "admin"
}
```

This grants full administrative access.

To create staff users, set:

```json
{
  "user": "staff",
  "permission": {
    "members": ["create", "read", "update", "delete"],
    "plans": ["read"],
    "payments": ["create", "read"]
  }
}
```

### Step 6: Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx drizzle-kit push` | Push schema to database |
| `npx drizzle-kit generate` | Generate migration files |
| `npx drizzle-kit studio` | Open Drizzle Studio (GUI database browser) |

## Key Development Patterns

### Adding a new server action

```typescript
// app/admin/example/action.ts
"use server"

import { db } from "@/app/db"
import { hasPermission } from "@/app/lib/getPermission"
import { PERMISSION_ACTIONS, PERMISSION_MODULES } from "@/app/interfaces/authInterface"

export async function readItems() {
  try {
    const items = await db.select().from(tableName)
    return { success: true, data: items }
  } catch (error) {
    return { success: false, error: "Failed to read items" }
  }
}
```

### Creating a page with loading skeletons

```typescript
// app/admin/example/page.tsx
import { Suspense } from 'react';
import { readItems } from './action';
import ClientComponent from '@/app/components/...';
import { CardGridSkeleton } from '@/app/components/shared/LoadingState';

export default async function Page() {
  const result = await readItems();
  if (!result.success) return <ErrorState />;

  return (
    <Suspense fallback={<CardGridSkeleton />}>
      <ClientComponent data={result.data} />
    </Suspense>
  );
}
```

### Adding a toast notification

```typescript
import { toast } from 'sonner';

// Success
toast.success('Equipment updated');

// Error
toast.error('Failed to update equipment');
```

## Loading States

The app uses file-convention-based loading boundaries and shared skeleton components:

| Skeleton Component | Use Case |
|-------------------|----------|
| `PageLoading` | Full-page centered spinner (used in `loading.tsx` files) |
| `DashboardSkeleton` | Admin dashboard (stat cards + charts + table) |
| `StaffDashboardSkeleton` | Staff dashboard |
| `AnalyticsSkeleton` | Analytics pages |
| `CardGridSkeleton` | Grid-based list pages (equipment, plans, trainers, members) |
| `FormSkeleton` | Settings and form-based pages |
| `TableSkeleton` | Table-based data views |
| `StatCardSkeleton` | Individual stat card placeholder |
| `ChartCardSkeleton` | Chart area placeholder |

Error boundaries are defined at every route group level (`app/error.tsx`, `app/admin/error.tsx`, `app/staff/error.tsx`, `app/dashboard/error.tsx`).

## Theme System

The app uses automatic light/dark mode based on OS preference (`prefers-color-scheme`). Colors use the OKLCH color space.

Key CSS variables (defined in `app/globals.css`):

| Variable | Purpose |
|----------|---------|
| `--accent` | Primary brand color (green) |
| `--background` | Page background |
| `--surface` | Card/sidebar surface |
| `--foreground` | Primary text |
| `--muted` | Secondary text |
| `--border` | Border color |
| `--danger` | Error/destructive color |
| `--success` | Success color |
| `--warning` | Warning/alert color |

## Environment Variables Reference

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Yes | Clerk publishable key |
| `CLERK_SECRET_KEY` | Yes | Clerk secret key |
| `NEXT_PUBLIC_CLERK_SIGN_IN_URL` | Yes | Sign-in page path |
| `NEXT_PUBLIC_CLERK_SIGN_UP_URL` | Yes | Sign-up page path |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` | Yes | Post-login redirect |
| `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` | Yes | Post-registration redirect |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | No | Razorpay public key |
| `RAZORPAY_KEY_SECRET` | No | Razorpay secret key |

## Deployment

### Vercel (Recommended)

1. Push your code to a GitHub repository
2. Import the repository in Vercel
3. Add all environment variables from `.env`
4. Set the Framework Preset to **Next.js**
5. Deploy

### Manual Build

```bash
npm run build
npm start
```

The app uses the following npm scripts defined in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```
