# 🤖 RemindHer.io
### *"Because your SSL certificate doesn't care that you were busy."*

> **The Pulse of Digital Memory** — An automated nagging robot for HR admins, startup ops people, and literally anyone who has ever said "wait, that expired WHEN?!"

---

## 😩 The Problem

Picture this: It's 9 AM on a Monday. You get a call from your biggest client.

> *"Hey, your domain is down. Also, our vendor contract expired last week. Also, your team's professional licenses lapsed in January. Also — are you okay? You look pale."*

You are not okay. You will never be okay again.

**How did this happen?** Simple. You trusted Karen from HR to track 47 contract expiry dates in a Microsoft Excel spreadsheet — color-coded, naturally — on a shared drive that nobody has the correct permissions to access. Karen is now on maternity leave. The spreadsheet is gone. The domain is down.

And somewhere, a ₹15,000/month "Full Compliance Management Platform™" is laughing at you, because it would have caught this... if you could figure out how to navigate its 150-page onboarding manual, 12 nested approval workflows, and the mandatory 2-day Zoom training with a "Customer Success Specialist" named Brad.

We are not Brad. We don't have approval workflows. We don't have a Kanban view. We barely have a settings page.

**We have one job. We do it perfectly. We will annoy you until you act.**

---

## 🦸 The Solution

**RemindHer.io** is a B2B micro-SaaS that does exactly **ONE thing**:

It reminds you. Aggressively. On time. Every time.

Here's the entire product:

1. **Type what's expiring.** (Vendor contract? SSL cert? Vehicle registration? Your will to live?)
2. **Type when it expires.** (A date. Just a date. Not a Gantt chart.)
3. **Type your email.**
4. **Hit "Forget It →"**

We'll handle the rest. Our robot — lovingly nicknamed **"Bawel"** (Indonesian for *nagging*) — will email you at 30, 14, 7, 3, 2, and 1 day(s) before the expiry. Each reminder gets progressively more passive-aggressive, just like a real HR manager.

### ⚡ The Magic OTP Flow
No passwords. No OAuth. No "Sign in with your company's Okta SSO that nobody set up correctly."

Just your email → a 6-digit code → you're in. That's it. The entire authentication system. A child could use it. Your CTO definitely can.

### 🫀 The Digital Pulse
Your dashboard shows a live "pulse" indicator next to each item:
- **Calm cyan pulse** → You're fine. Relax. Get some coffee.
- **Frantic red pulse** → It expires in 7 days or less. Stop reading this. Go renew it.

---

## 🛠 Tech Stack

We are *extremely* proud of what we **didn't** build:

| What we used | What we specifically avoided |
|---|---|
| **Next.js 14** (App Router) | A monorepo with 23 internal packages |
| **Supabase** (Auth + DB + RLS) | Kubernetes, because we're sending emails not launching satellites |
| **Tailwind CSS** | A custom design system with 400 Storybook stories |
| **Framer Motion** | jQuery animations from 2011 |
| **Resend** (Email) | An SMTP relay configured by someone who no longer works here |
| **Vercel Cron** | A cron job on a forgotten EC2 instance in `us-east-1` that everyone is afraid to touch |
| **TypeScript** | `any` typed chaos held together by hope |

No Docker. No Terraform. No `.env.example` has 47 variables you need to fill in. No 12 microservices just to send one email.

**Total infrastructure cost for the MVP: $0/month.** (Supabase free tier. Vercel free tier. You're welcome.)

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Supabase account (free)
- A Resend account (free)
- The ability to run `npm install` without creating a Stack Overflow post about it

### 1. Clone the repo

```bash
git clone https://github.com/jamalbaharun/remindher.io.git
cd remindher.io
```

### 2. Install dependencies

```bash
npm install
```

> ⚠️ If `npm install` fails, please re-read the prerequisites. If you still can't do it, you deserve the late fees.

### 3. Set up your environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the blanks. There are **5 variables**. Five. Not forty-seven. Five.

```env
NEXT_PUBLIC_SUPABASE_URL=           # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=      # Your Supabase anon key
RESEND_API_KEY=                     # From resend.com (free tier is fine)
CRON_SECRET=                        # Make up a long random string. No, "password123" is not acceptable.
NEXT_PUBLIC_APP_URL=                # http://localhost:3000 (locally) or your prod domain
```

### 4. Set up the database

Go to your Supabase project → **SQL Editor** → paste the contents of `supabase/schema.sql` → hit **Run**.

That's it. You now have a production-ready PostgreSQL database with Row Level Security enabled. No migrations. No seeds. No `prisma generate` and a 10-minute wait. Just SQL.

> **Critical Supabase setting:** Go to **Authentication → Providers → Email** and turn **OFF** "Confirm email". Otherwise Supabase will send a magic link instead of a 6-digit OTP code, and your users will be confused, and they will blame you, not Supabase.

### 5. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You're done.

The entire setup took under 10 minutes. That "Full Compliance Management Platform™" you were almost talked into buying has a 14-day onboarding process. Just saying.

---

## 🧪 Testing

### Unit Tests (Logic)
```bash
node scripts/run-tests.js
```
Tests 26 assertions across date calculation logic and OTP input validation. Results in under 3 seconds. No Jest configuration rabbit hole required.

### E2E Tests (Playwright)
```bash
npx playwright test
```

Tests cover:
- 🔒 **Security** — unauthenticated users are redirected, APIs return 401
- 📱 **PWA** — manifest.json and service worker are accessible
- 🏠 **Landing Page** — form inputs, language toggle, validation
- 💰 **Upsell** — free users hitting the 3-item limit see the Premium modal

---

## 🌍 Deployment

Push to `main` → Vercel auto-deploys. Set the same 5 env vars in your Vercel project settings.

For the cron job, add this to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/process-reminders",
    "schedule": "0 1 * * *"
  }]
}
```

This runs Bawel every day at 1 AM UTC. He will not stop. He will not rest. He is doing what Karen never could.

---

## 🛑 Contributing

Contributions are welcome, **with conditions.**

**✅ PRs we will happily merge:**
- Bug fixes
- Better email templates
- WhatsApp / Telegram notification channels
- Performance improvements
- Accessibility improvements
- Language translations (we already have EN/ID)

**❌ PRs that will be closed immediately, without comment, and possibly with mild judgment:**
- Adding Blockchain-based expiry verification
- "I added an approval workflow before reminders are sent"
- "I refactored this into 8 microservices"
- "I added a Kanban board"
- "I integrated with Jira"
- Anything that adds more than 3 new dependencies
- Comments styled as passive-aggressive code reviews from someone who just discovered Clean Architecture

> **If you submit a PR to add Kubernetes support to this project,** I will find you, I will close it with a 👍 reaction, and I will think about you *every time* I pay $0/month for infrastructure.

---

## 📜 License

**MIT** — Do whatever you want with it.

Just don't use it to build another "Enterprise Document Lifecycle Management Suite." We will know. The irony will be too painful.

---

<div align="center">

**Built with ☕, mild existential dread, and a burning hatred for Excel-based expiry tracking.**

*If this saved you from a late fee, consider starring the repo. It costs nothing and makes the developer feel validated.*

[🌐 remindher.io](https://remindher.io) · [🐛 Issues](https://github.com/jamalbaharun/remindher.io/issues) · [🤝 PRD](./app/PRD.md)

</div>
