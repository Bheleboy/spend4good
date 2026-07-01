# Spend4Good Pre-Launch Build Plan

Sequential build across 9 parts. Each part must be verified before the next begins.

## Part 1 — Unified USD Pricing
- Create `src/lib/pricing.ts` with `PLANS` array (4 plans, USD annual) + `formatPrice()` helper.
- Refactor `src/routes/index.tsx` (landing) and `src/routes/onboarding.tsx` to render pricing from `PLANS`. Remove all hardcoded prices.
- Remove the "7-Day Trial" card. Add "14-day free trial on any plan. Invited nonprofits pay nothing, ever." messaging.
- Update hero copy: "Track every dollar. Build donor trust." Neutralize any other ZAR/rand references.
- Update `spend4good_phase1_migration.sql` `subscription_plan` enum to: `nonprofit_starter`, `funder_starter`, `funder_growth`, `funder_unlimited`, plus retained internal `invited_free`.

## Part 2 — Paddle Integration
- `bun add @paddle/paddle-js`.
- `src/lib/paddle.ts`: `initializePaddle` reading `VITE_PADDLE_CLIENT_TOKEN` + `VITE_PADDLE_ENVIRONMENT`. Export `openCheckout(priceId, email, customData)`.
- Add `paddlePriceId: ''` field on each Plan with an "IMPORTANT" comment above `PLANS`.
- Wire pricing card + onboarding plan-select buttons to `openCheckout` (only after org row exists in onboarding).
- **Webhook**: server route at `src/routes/api/public/paddle-webhook.ts` (TanStack Start uses server routes, not Supabase Edge Functions for app-internal logic; `/api/public/*` bypasses auth). Verifies Paddle signature via `PADDLE_WEBHOOK_SECRET`, logs every event to `paddle_webhook_events`, handles `subscription.created|activated|canceled|payment_failed`, updates `organizations`. Loads `supabaseAdmin` inside handler.
- Migration `spend4good_paddle_migration.sql`: `paddle_webhook_events` table (service_role only), add `paddle_subscription_id` + `paddle_customer_id` cols on `organizations`.
- Settings page (`src/routes/_app.settings.tsx` exists — extend it) with current plan + "Manage Billing" link.
- Document env vars in `.env.example`.

*Note to user: sandbox-only until Paddle finishes seller/domain verification (1–2 weeks).*

## Part 3 — Jurisdiction-Aware Compliance
- Ensure `organizations.country` column exists (add in migration if missing).
- Gate `/compliance` and `/compliance/calendar` on `country === 'ZA'`; otherwise show "South African Compliance Pack" message + feedback button.
- Migration for `jurisdiction_requests` table with org-scoped RLS.
- Update all compliance-related copy to say "South African Compliance Pack" explicitly.
- Funder portfolio dashboard shows "Not applicable" for non-SA NPOs.

## Part 4 — Anthropic: Three Honest Functions
- (a) Report Generation: relabel existing report output as "DRAFT — review and submit manually to DSD."
- (b) Document Gap Checker: new `src/lib/doc-review.functions.ts` server fn using Anthropic; add non-blocking "AI Review" panel to the Vault upload flow with disclaimer.
- (c) Compliance Assistant: chat widget on Compliance Dashboard, system prompt scoped to SA + declines non-SA questions with pointer to jurisdiction feedback flow.
- Purge any copy implying auto-filing to CIPC/DSD.

## Part 5 — Remove Google OAuth
- Delete `signInWithGoogle` from `src/lib/auth.ts`.
- Strip Google button/SVG/divider from `src/routes/login.tsx`. Add "Forgot password?" flow.
- New `src/routes/auth.reset-password.tsx` handling recovery token → `updateUser({ password })` → redirect to `/login`.

## Part 6 — Invitations Table
- Migration `spend4good_invitations_migration.sql` per spec.
- Enforce exact `.eq('token', ...)` filter convention in application code.

## Part 7 — Funder Invite + Portfolio Dashboard
- New `src/routes/_app.funder.invite.tsx`: capacity-aware invite form using PLANS npoLimit, inserts to `invitations`, sends email (check existing email infra — if none, flag rather than guess).
- New `src/routes/_app.funder.dashboard.tsx` (or extend existing): joined view of `funder_nonprofits` + pending invitations, gated compliance status, "Invite More" button disabled at capacity.
- Sidebar entry for funder role.

## Part 8 — Invited Nonprofit Onboarding
- `validateSearch` extracts `type` + `token` in `src/routes/onboarding.tsx`.
- For `type=invited`: query `invitations` by exact token; show error state on invalid/expired/accepted; pre-fill orgName/email + funder banner if valid; no-token → guidance.
- Real `handleComplete` for invited flow: create auth user, org (`invited_free`), user row, `user_roles` admin, `funder_nonprofits` active, mark invite accepted, redirect to `/login`.

## Part 9 — RLS Audit
- Review policies on: organizations, users, user_roles, funder_nonprofits, invitations, subscriptions, jurisdiction_requests, paddle_webhook_events, expenses, projects, documents.
- Explicitly verify cross-funder invitation isolation, cross-nonprofit data isolation, and webhook events locked to service_role.
- Fix any leaks found; deliver a written audit summary.

## Technical Notes
- All SQL is delivered as migration files for you to run in the external Supabase SQL editor (matching prior workflow).
- Paddle webhook is a **TanStack server route** at `/api/public/paddle-webhook`, not a Supabase Edge Function — matches the app's runtime and the stack's guidance.
- Anthropic calls go through `createServerFn` using the existing `ANTHROPIC_API_KEY` secret.
- The dark oklch theme is preserved throughout; only copy and structure change.

## Sequencing
Part 1 → Part 2 (test in sandbox) → Parts 3+4 → Part 5 → Parts 6+7+8 → Part 9. Each part committed and buildable before the next begins.

## What I need from you before starting
1. **Paddle credentials**: I'll store `VITE_PADDLE_CLIENT_TOKEN`, `VITE_PADDLE_ENVIRONMENT=sandbox`, and `PADDLE_WEBHOOK_SECRET` when you have them. Say "go" to start Part 1 now — you can paste Paddle keys when we hit Part 2.
2. **Email infra**: confirm you want me to check current state and flag if missing (per your instruction) rather than adding a provider now.
3. **Anthropic key**: already stored — no action needed.

Approve this and I'll start executing Part 1 immediately.