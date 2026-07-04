# Final Spend4Good Build Plan

This is a large multi-part build. I'll do it in the strict order you specified, migrations first so types regenerate before the UI code that depends on them.

## Prerequisite: secrets

Before Part 2 can run end-to-end, you must add these in **Project Settings → Secrets**:
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`
- `TWILIO_WHATSAPP_FROM` (e.g. `whatsapp:+14155238886`)
- `TWILIO_WEBHOOK_URL` (the full deployed URL of the `receive-whatsapp` function)

I'll build the pipeline regardless; without secrets it just won't send/receive live messages. The simulated CHECK 2 test doesn't need them.

I also need to confirm one schema assumption:

**Assumption:** The `expenses` table already has: `project_id, org_id, submitted_by, amount, currency, description, category, receipt_url, status, submitted_at, approved_by, approved_at, rejection_reason`. If any of these are missing, I'll add them in the Part 1 migration. Same for `users.whatsapp_number` — I'll add it if missing.

---

## Part 1 — Project staff (migration + project detail page)

**Migration `20260704_project_members_and_whatsapp.sql`:**
- `CREATE TABLE public.project_members` per your spec + GRANTs + RLS.
- `CREATE TABLE public.whatsapp_messages` (moved here from Part 2 so it's ready) + GRANTs + RLS.
- Add missing columns if needed: `users.whatsapp_number text`, `expenses.rejection_reason text`, `expenses.whatsapp_message_id text`, `expenses.approved_by uuid`, `expenses.approved_at timestamptz`, `expenses.submitted_at timestamptz`.

**`src/routes/_app.projects.$id.tsx`:** rebuild with 4 tabs (Overview, Team, Expenses, Report). Team tab uses a Dialog with a Select of active org users and role dropdown, inserting into `project_members`. Expenses tab reuses the expense card component from Part 3. Report tab embeds the `ReportView` component from Part 4.

## Part 2 — Twilio WhatsApp pipeline

**`supabase/functions/receive-whatsapp/index.ts`:** signature validation (HMAC-SHA1 as specified), lookup by `whatsapp_number` via service role, project matching (single/multi/hint), regex amount parsing (`R?\s*(\d+(?:\.\d+)?)`), media download with Twilio Basic Auth, upload to `compliance-docs/{org_id}/receipts/`, insert expense + whatsapp_messages rows, Twilio REST reply, fire `send-expense-notification` if funder linked.

**`supabase/config.toml`:** add `[functions.receive-whatsapp] verify_jwt = false`.

## Part 3 — Expense approval page

Replace `src/routes/_app.expenses.tsx` ComingSoon with full UI: status tabs, search, project filter, date range, expense cards with agent/project/amount/receipt thumbnail/status, approve/reject actions (role-gated), reject-reason modal, receipt lightbox modal, `?highlight=` scroll+ring.

## Part 4 — Report

**`src/components/ProjectReport.tsx`** (reusable): date range picker (default last 30 days), 4 summary cards, per-agent breakdown table (expandable rows), category breakdown, recharts timeline (stacked bar by status), full expense log table (sortable, searchable), Export CSV button, Export PDF button (via `window.print()` with print styles — no new deps).

Embedded in project detail Tab 4. Also wired into `/reports` — I'll check `_app.compliance.reports.tsx` first; if it's the compliance one I'll leave it and add a new `_app.reports.tsx` with a project picker + ReportView.

## Part 5 — WhatsApp log page

Replace `src/routes/_app.whatsapp.tsx` ComingSoon: table of `whatsapp_messages` with matched/unmatched badges, media thumbnails, filters (All/Matched/Unmatched/With Media, date range), "Add this number" button that navigates to `/users?add=+27...` (Users page reads the query and pre-opens the add modal).

## Part 6 — Users page updates

`src/routes/_app.users.tsx`: add `whatsapp_number` column with green icon or yellow "not set" badge + inline edit; add info notice in the add-user modal referencing `TWILIO_WHATSAPP_FROM` (read from `import.meta.env.VITE_TWILIO_WHATSAPP_FROM` if present, else literal placeholder); "Test Number" button; read `?add=` query param to pre-fill form.

Note: `TWILIO_WHATSAPP_FROM` is server-only. To display it, I'll expose a public copy as `VITE_TWILIO_WHATSAPP_FROM` (or hardcode the display value). I'll add a small server fn `getTwilioFromNumber` instead — cleaner and no new secret.

## Part 7 — Dashboard

`src/routes/_app.dashboard.tsx`: swap static `monthlyData` for real query grouped by month over last 6 months (approved only); update tooltip formatter; add "Recent Expenses" section (last 5 pending) linking to `/expenses?highlight=id`.

## Part 8 — Validation

Run all 8 checks. CHECK 2 via `curl` to the local edge function with a test payload (signature check skipped by setting a `?test=1` bypass **only** when `Deno.env.get('ALLOW_TEST_PAYLOAD') === 'true'` — I will NOT add this; instead I'll compute a valid signature in the test script). CHECKs 3–8 via Playwright + psql inspection. I'll report pass/fail per check and fix any failures before finishing.

---

## Scope notes

- No new npm dependencies expected (recharts, date-fns, lucide, sonner, shadcn already present).
- I will NOT modify `supabase/config.toml` project-level settings, only add the function block.
- I will not touch auth-managed schemas or generated files.

Reply "go" to proceed, or tell me what to change.
