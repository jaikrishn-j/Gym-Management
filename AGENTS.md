# GymStitch — AGENTS.md

## Commands
- `npm run dev` — dev server (Turbopack, Next.js 16)
- `npm run build` → `npm start` — production
- `npm run lint` — ESLint (flat config `eslint.config.mjs`)
- No test framework, no typecheck script, no pre-commit hooks.

## Database
- **Schema**: `drizzle/schema.ts` (source of truth). Migrations live in `drizzle/YYYYMMDD_*/`.
- **Connection**: `app/db/index.ts` reads `DATABASE_URL` via `dotenv`.
- **Drizzle commands**: `npx drizzle-kit push` (apply), `npx drizzle-kit generate` (create migration), `npx drizzle-kit studio` (GUI).

## Architecture
- **Server Components** (`async function page()`) call server actions, pass data as props to client components.
- **Client Components** (`'use client'`) handle interactivity. Import server actions from `./action.ts` (same directory) to pass as callbacks.
- **Server Actions** (`"use server"` in `action.ts`) always return `{ success: boolean, data?: …, error?: string }`. Guard with `hasPermission()` from `@/app/lib/getPermission`.
- **Three portals**: `/admin`, `/staff`, `/dashboard`. Permissions stored in Clerk `privateMetadata` (`{ user: "admin"|"staff", permission: { module: ["create","read","update","delete"] } }`).

## Routing & Middleware
- `proxy.ts` at project root handles Clerk auth + role-based routing (NOT `middleware.ts`). Guards `/admin`, `/staff`, `/dashboard` by redirecting to `/login` or to the user's home portal.
- Route groups: `(auth)/` for login/register, no group for landing page at `/`.

## Key Path Aliases
- `@/*` maps to project root (e.g. `@/app/db`, `@/drizzle/schema`, `@/app/components/...`).

## UI & Theming
- **Tailwind CSS v4** (`@tailwindcss/postcss`), **HeroUI** (`@heroui/react`), **Framer Motion**, **Lucide React** icons.
- CSS variables in OKLCH (`globals.css`), auto light/dark via `prefers-color-scheme`. No manual theme toggle.
- **Sonner** for toasts: `toast.success(msg)` / `toast.error(msg)`.

## Loading States
- Per-route `loading.tsx` files with shared skeleton components from `@/app/components/shared/LoadingState` (`PageLoading`, `CardGridSkeleton`, `TableSkeleton`, `FormSkeleton`, `DashboardSkeleton`, etc.).

## Conventions Worth Knowing
- Primary keys use `crypto.randomUUID()` everywhere (no auto-increment).
- Images use `<img>` tags, not `next/image`.
- Permission module constants in `@/app/interfaces/authInterface`: `PERMISSION_MODULES` (note `STAFFS` not `TRAINERS`) and `PERMISSION_ACTIONS`.
- Razorpay payments: optional, toggled via `gym_settings` table. Keys configured in admin Settings page.
- Offline support via IndexedDB for Members module (`isSynced` columns on `memberplans`, `payments`, `pending_syncs` table).
