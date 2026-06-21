# Spend4Good Production Refactor Plan

This is a large multi-week scope. I'll break it into 5 phases you can approve/build incrementally. Each phase ships a working slice — we don't try to do everything in one shot.

## Current state (audited)

- Frontend: React + TanStack Router + Tailwind ✅
- Supabase: connected (external project `rpkivjzkgmfwnitjdmcv`) with `organizations`, `users`, `projects`, `documents`, plus migration drafted for `beneficiaries`, `project_images`, `receipts`, `reports`, `user_roles`
- Auth: custom phone+OTP via `localhost:3000/api` (NOT Supabase Auth) — **this is the biggest blocker**
- Twilio WhatsApp: referenced via external webhook `api.spend4good.com` — not in-app
- Stripe: not integrated
- Pricing tiers in onboarding: Trial / Non-Profit R499 / Funder R1499 — **conflicts with new spec ($100 / $800 / $2000)**

## Phase 1 — Foundation (schema + auth refactor)

Goal: make the data model and auth match the new spec before building features on top.

1. **Migrate to Supabase Auth** (email/password + Google). Replace `localhost:3000/api` OTP flow. Keep `whatsapp_number` as a verified field on `users`, separate from login.
2. **Schema migration** (single SQL script you run in your Supabase dashboard):
   - Add `organizations.type` (`funder|nonprofit`), `subscription_plan`
   - Refactor `users` with new roles enum: `admin, director, finance_manager, project_manager, field_officer, agent, funder_admin`
   - New `funder_nonprofits` (many-to-many w/ project_limit, status)
   - Add `projects.funder_id` (nullable), `actual_spend`, `variance`
   - New `expenses`, `subscriptions` tables
   - Extend `documents` with `document_type`, `source`, `approval_status` enums
   - Strict RLS on every table scoped via `has_role()` + `funder_nonprofits` membership
3. **Update pricing** in onboarding to $100 / $800 / $2000 plans.

## Phase 2 — Onboarding & invites

1. Three onboarding paths: self-reg nonprofit, funder, invited nonprofit
2. Stripe checkout for nonprofit ($100) and funder ($800/$2000) plans
3. Funder invite flow with duplicate-nonprofit detection → "link existing" vs "create new"
4. Enforce limits: 4 projects (nonprofit/funder relationship), 10 nonprofits (starter funder) with upgrade prompt

## Phase 3 — Projects, documents, approval workflow

1. Project CRUD with funder linkage + limit enforcement
2. Document upload (dashboard) with type + approval status
3. Role-based approval chain: agent/field_officer submit → PM L1 → Finance L2 → Director final
4. Expense entries tied to projects + documents
5. Beneficiaries + geolocated project images (from previous turn — keep)

## Phase 4 — WhatsApp via Twilio

1. WhatsApp number verification flow (OTP via Twilio) for team members
2. Inbound webhook (`/api/public/whatsapp/inbound`) matches sender → user; rejects unverified
3. Media download from Twilio → Supabase storage → `documents` row with `source=whatsapp`
4. Outbound report requests via WhatsApp ("send Q3 report") with role check

## Phase 5 — Dashboards & reporting

1. Nonprofit dashboard: budget/spend/variance/burn rate widgets + charts
2. Funder dashboard: portfolio view across nonprofits, risk alerts
3. Admin dashboard: full CRUD over orgs/users/subs
4. CSV + PDF export (monthly/quarterly/annual/custom)

## Technical notes

- TanStack Start server functions for all DB writes (RLS as user)
- Stripe + Twilio credentials via `add_secret` (stored server-side)
- Migration SQL delivered as a script you run manually since your Supabase is external
- Keep the current dark visual style; only refine spacing/typography for SaaS feel

## What I need from you to start

1. **Confirm pricing change** from R499/R1499 → $100/$800/$2000 (the recent turn just set the rand pricing — this spec overrides it, correct?)
2. **Auth migration**: replace the custom phone-OTP login with Supabase Auth (email + Google), keeping WhatsApp number as a separate verified attribute. OK?
3. **Twilio + Stripe keys**: I'll request these via secrets when we reach Phase 2 / Phase 4. You'll need a Twilio Account SID + Auth Token + WhatsApp sender, and a Stripe secret key.
4. **Where to start**: approve "Phase 1 only" so I can ship the schema + auth refactor cleanly, then we move forward phase by phase. Trying to do all 5 phases in one response will produce broken code.

Reply with **"Start Phase 1"** (or adjustments) and I'll execute.
