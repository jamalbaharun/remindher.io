# 🚀 Project PRD: RemindHer.io (B2B Micro-SaaS)

## 1. Project Overview
**Name:** RemindHer.io
**Concept:** An "Anti-Bloatware" B2B Micro-SaaS that reminds users (HR/Admins) of expiring documents (contracts, certificates, licenses) before it's too late.
**Philosophy:** Extreme simplicity, frictionless UX, high security, and a visually striking "nagging robot" personality. 
**Target Language:** English (EN) default globally, with an "EN | ID" toggle switch on the top-left of all screens.

## 2. Tech Stack & Architecture
- **Framework:** Next.js 14 (App Router) with TypeScript.
- **Styling:** Tailwind CSS + Framer Motion (for "Pulse" animations).
- **Backend & Database:** Supabase (Provides both Authentication and Hosted PostgreSQL Database).
- **Database Client:** Official `@supabase/ssr` and Supabase JS Client (NO Prisma or third-party ORMs).
- **PWA Capabilities:** `next-pwa` (Must be installable on iOS/Android home screens).
- **Cron Jobs:** Vercel Cron or custom Node.js cron worker.
- **Testing Engine:** Playwright (End-to-End) and Jest (Unit Testing).

## 3. Database Schema & Security (Supabase RLS)
We are using Supabase for BOTH Auth and Database. Therefore, strict Row Level Security (RLS) policies are mandatory. Next.js Server Actions or direct client queries can be used, relying on RLS for data protection.

**Table: `reminders`**
- `id` (uuid, PK, default: uuid_generate_v4())
- `user_id` (uuid, FK to Supabase's `auth.users` table - Default: `auth.uid()`)
- `subject` (string, max 255 chars)
- `expiry_date` (timestamptz)
- `notify_email` (boolean, default: true)
- `notify_wa` (boolean, default: false)
- `notify_telegram` (boolean, default: false)
- `phone_number` (string, nullable)
- `created_at` (timestamptz, default: now())

**RLS Policy Required:** You MUST create a policy so users can only read/insert/update/delete their own data:
`CREATE POLICY "Users can manage their own reminders" ON reminders FOR ALL USING (auth.uid() = user_id);`

## 4. UI/UX Design System
- **Theme:** High-end Dark Mode (Background: `#0F172A` / Obsidian).
- **Accents:** Neon Cyan (`#00FFFF`) and Neon Purple (`#BF00FF`).
- **Typography:** Inter or Roboto (Crisp, sans-serif).
- **Layout:** Center-aligned, glassmorphism cards. No sidebars, no complex navbars.

## 5. Core Screens & Flow
### A. The Hook (Landing Page)
- **Top-left:** Language toggle "EN | ID" (EN highlighted).
- **Input:** Subject ("What to remind?"), Expiry Date (Date picker), Email.
- **Button:** "Forget It" (Neon Purple).
- **Action:** Request OTP to the provided email via Supabase Auth.

### B. The Magic Gate (OTP Verification)
- **Top-left:** Language toggle "EN | ID".
- **UI:** Text "Check your email. Enter the code." with a 4-to-6 digit PIN input. Auto-submits on the last digit.
- **Action:** Verifies OTP via Supabase, establishes secure session, redirects to Dashboard.

### C. The Unified Command Dashboard
- **Top-left:** Language toggle "EN | ID".
- **Title:** "Your Digital Pulse".
- Displays a unified list of active `reminders` fetched directly via Supabase client.
- **The Pulse Logic (Visual Indicator using Framer Motion):**
  - Calculate `days_left` = `expiry_date` - `today`.
  - If `days_left` > 30: Render a slow, calm, neon cyan rhythmic pulse wave next to the item.
  - If `days_left` <= 7: Render a fast, erratic, vibrating neon red/orange pulse wave next to the item.
- **Bottom Bar:** Summary metrics (e.g., Total Objects, Near Expiry).
- **FAB:** Floating Action Button (+) at the bottom right to add new items.

### D. The Upsell & Config (Premium Modal)
- **Top-left:** Language toggle "EN | ID".
- **Trigger:** If a user tries to add > 3 items or toggle WA/Telegram notifications.
- **Title:** "Unlock Unlimited Digital Pulse".
- **Features shown:** Unlimited Objects, Multi-Channel (WA/Telegram), Webhook Integration.
- **Button:** "Upgrade to Premium ($19/mo Flat)".

## 6. The "Bawel" (Nagging) Cron Engine
- An API endpoint (`/api/cron/process-reminders`) secured by a secret token.
- **Logic:** Query the Supabase database for items expiring exactly in 30, 14, 7, 3, 2, and 1 days.
- **Action:** Trigger standard SMTP/Resend emails for this MVP.

## 7. QA & Testing Requirements (MUST PASS)
The implementation is not complete until the following automated tests pass:

### A. Unit Tests (Jest)
1. Verify the `days_left` calculation logic is absolutely accurate.
2. Verify OTP input state logic (prevents non-numeric input).

### B. E2E Automation (Playwright)
1. **Main Flow:** Simulate user typing subject -> date -> email -> getting OTP -> logging in -> seeing the item on the Dashboard.
2. **Security Test:** Attempt to access the Dashboard without a valid Auth session (must redirect to Landing).
3. **PWA Check:** Ensure `manifest.json` and service worker load correctly and pass PWA criteria.
4. **Upsell Enforcement:** Programmatically add 3 items, attempt to add a 4th via UI, assert the Premium Modal renders.

## 8. Execution Directives for AI Agent (Hermes)
- Act as a Staff-level Full Stack Engineer and QA Automation Expert.
- DO NOT use Prisma or any other ORM. Use the official `@supabase/ssr` package and Supabase JS client for all Auth and Database operations.
- Build incrementally. Start with `Phase 1: Init Next.js + PWA + Tailwind + Supabase connection`, then explicitly ask for review.
- Always implement and test Supabase Row Level Security (RLS) immediately after creating tables. You must apply RLS so the application is secure from day one.