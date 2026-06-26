# Compliance OS — Implementation Plan

A major new module bolted onto the existing Spend4Good app. Built in 4 waves so we ship value early and don't blow up the chat on a single megapatch.

## Scope confirmation

- Brand refresh applied app-wide (deep green #1A7F5A primary, amber #F4A623 accent, Inter, no card gradients). Existing screens inherit the new tokens — they'll look subtly different but consistent.
- Navigation re-grouped into two sections: **Spend Tracker** (existing) and **Compliance OS** (new, with green "NEW" badge).
- 5 new routes under `/compliance/*` plus a `/pricing` page.
- 5 new Supabase tables + a `compliance-docs` storage bucket.
- Claude Sonnet used for the DSD narrative report — **called from a TanStack server function**, not the frontend (the spec says "frontend, API key handled by the platform" but we should not ship an Anthropic key to the browser; server-side is the correct equivalent and keeps the key safe).

## Open questions before I build

1. **Anthropic API key.** I'll request `ANTHROPIC_API_KEY` via the secrets tool when we hit the Report Generator wave. OK?
2. **Free-tier gating.** You listed Free / Starter (R199) / Pro (R499) — this contradicts the earlier $100/$800/$2000 USD pricing we set last session. I'll assume **the new ZAR pricing for the Compliance OS gating only**, and leave the existing Spend Tracker plans untouched until you tell me to unify them. Confirm?
3. **Org profile source.** You already have an `organizations` table from Phase 1. The new spec defines `organisations` (British spelling, different columns: NPO reg #, province, FY end month, etc.). I'll **extend the existing `organizations` table** with the new compliance columns rather than create a duplicate. OK?
4. **WhatsApp reminders.** The onboarding wizard collects reminder prefs and saves them, but actually *sending* WhatsApp reminders needs a scheduled job (pg_cron + Twilio). I'll wire the UI + storage now and stub the dispatcher — full Twilio send can ship in a later wave alongside the existing WhatsApp work. OK?

## Wave 1 — Foundation (brand + nav + schema)

- Update `src/styles.css` design tokens to the new green/amber/danger palette; switch font to Inter via `<link>` in `__root.tsx`.
- Migrate Supabase: extend `organizations` with compliance columns; create `compliance_deadlines`, `narrative_reports`, `compliance_documents`, `compliance_scores`; create `compliance-docs` storage bucket; RLS + grants on all.
- Refactor `AppSidebar` to render two grouped sections with a "NEW" badge on Compliance OS.
- Notification bell in `AppNavbar` driven by a `useDeadlines()` hook (amber dot if any deadline ≤30 days).

## Wave 2 — Compliance Dashboard + Deadline Calendar

- `/compliance` — Compliance Dashboard: 4 stat cards (score ring, deadlines this month, overdue docs, days-until-next), 12-month horizontal timeline with colour-coded dots + side drawer, prioritised Action Items list.
- `/compliance/onboarding` — 4-step wizard (Org details → Compliance profile → Auto-generated deadline preview → WhatsApp reminders). Deadline calc helpers in `src/lib/compliance/deadlines.ts` (DSD = FY end +9mo, CIPC = Jan 31, S18A = FY end −3mo, POPIA = Jul 1, etc.).
- `/compliance/calendar` — full monthly grid (custom React calendar, no heavy dep), 60-day side list, filter bar, "Add Custom Deadline" modal.
- Route guard: if user has no compliance profile, redirect from any `/compliance/*` to `/compliance/onboarding`.

## Wave 3 — Report Generator

- `/compliance/reports` — two-panel layout (5-tab form left, live preview right).
- `generateNarrativeReport` server function: takes form JSON, calls Claude Sonnet with the exact system prompt from the spec, streams generated text back, persists to `narrative_reports`.
- PDF/DOCX export (using `pdf-lib` + `docx` npm packages, server-side).
- "Mark as Final" locks the row and surfaces it in the Vault.

## Wave 4 — Document Vault, Health Score, Pricing

- `/compliance/vault` — folder tree + file grid, upload modal, expiry tracking, auto-status (current/expiring/expired) via computed column or client logic.
- `/compliance/score` — circular gauge, 5 category bars (filing / docs / governance / financial / policy), each with a "Fix This" drill-down. Score computed client-side from Supabase data using a documented formula in `src/lib/compliance/score.ts`. Share-public-badge link + 1-page PDF summary.
- `/pricing` — 3 tier cards. Generic `<UpgradeModal />` component used by every gated feature.

## Technical notes

- **Frontend**: React 19 + Tailwind v4. All new colours added as `@theme` tokens in `src/styles.css`; never hard-coded.
- **Routing**: TanStack file-based routes under `src/routes/_app.compliance.*.tsx` so they inherit the existing app shell.
- **Server**: All Supabase writes through `createServerFn` with `requireSupabaseAuth`. Claude call lives in `src/lib/compliance/report.functions.ts`, reads `process.env.ANTHROPIC_API_KEY` inside the handler.
- **Storage**: `compliance-docs` bucket (private), RLS on `storage.objects` scoped by `org_id` prefix in the path.
- **Dates**: All deadline math in `Africa/Johannesburg` via `date-fns-tz`.
- **Currency**: `Intl.NumberFormat('en-ZA', { style: 'currency', currency: 'ZAR' })`.

## What I'll deliver this turn after you approve

Just **Wave 1** (tokens, schema, nav, bell). Then I'll pause for you to run the migration and confirm before I move to Wave 2. This keeps each turn reviewable and avoids a 50-file blob.

Reply with answers to the 4 questions above (or just "yes to all, proceed") and I'll start Wave 1.
