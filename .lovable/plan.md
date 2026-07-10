## Scope

Large multi-part build. Before implementing I need to confirm scope and one schema decision.

## Database changes required (new migration)

Neither table/column exists yet:

1. `projects` needs new columns: `activity_categories text[] not null default '{}'`, `province text`, `location_description text`.
2. `project_photos` table (referenced by receive-whatsapp function but not created):
   - `id, org_id, project_id, submitted_by (uuid, null), submitted_by_name text, file_path text, storage_url text, label text, activity text, source text, message_sid text, taken_at timestamptz, created_at`
   - RLS: org members can select; service_role full access
   - GRANTs on all new tables

Note: existing `projects` uses column `budget` (not `budget_amount`) and has no `currency` column, yet `src/routes/_app.projects.tsx` inserts `budget_amount` + `currency`. That's a pre-existing bug — I'll align the wizard with the real column (`budget`) and skip currency (or add a currency column — tell me which).

## Part 1 — Wizard component

New `src/components/ProjectWizard.tsx` — full-screen `Dialog` with 5 steps and a stepper header. Replaces the inline Create dialog in `src/routes/_app.projects.tsx` and is also mountable from the project detail page.

- Step 1: name, description, funder select (from `funder_nonprofits` where `nonprofit_id = current org`), start/end dates, budget, province (9 SA provinces hardcoded), location description.
- Step 2: activity tag input with 8 suggested chips + `@dnd-kit/sortable` for reorder (already fits, small dep — will add).
- Step 3: two subsections. Section A: select existing active org user + role. Section B: create new user (full_name, whatsapp_number, role=field_agent). Pending list with remove.
- Step 4: read-only review with per-section Edit (jumps back to step).
- Step 5: success screen with invited-agent list, share-message copy button, "Go to Project" link.

Submit: insert project → for existing users insert `project_members` → for new agents insert `users` then `project_members` → invoke `send-project-invite` for each new agent → advance to step 5.

## Part 2 — `send-project-invite` edge function

`supabase/functions/send-project-invite/index.ts`. Reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`. POSTs form-encoded to Twilio Messages API. `verify_jwt = true` in `supabase/config.toml`.

## Part 3 — Photos tab on `src/routes/_app.projects.$id.tsx`

New "Photos" tab with count badge. Filters: activity (from project's `activity_categories`), agent (from project members), date range, clear filters. Grid 1/2/3 col responsive. Click opens lightbox (Dialog). Empty state text as specified.

"Share Update" modal: renders a 2×3 grid on `<canvas>` using the 6 most-recent `storage_url` images (loaded with `crossOrigin='anonymous'`), overlays project name + date, download-as-JPG, and copy-share-message.

## Part 4 — Projects list

Add camera icon + photo count per project row (single grouped count query on mount).

## Confirm before I build

1. **Currency**: drop the currency field entirely (schema has no column), or add a `currency text default 'ZAR'` column?
2. **Funder dropdown source**: use `funder_nonprofits` joined to `organizations` where `nonprofit_id = current org` and `status = 'accepted'`? (Assumed yes.)
3. **New field agent without email**: `users.email` is likely NOT NULL. I'll generate a placeholder `wa-<phone>@spend4good.local` unless you prefer another convention.
4. **Share Update canvas**: photos are served from `compliance-docs` bucket with 1-year signed URLs — canvas export requires CORS on the storage bucket. If CORS blocks `toDataURL`, download will fail. OK to proceed and note the limitation?

Reply "go" (with any tweaks to the 4 points) and I'll ship all parts in one pass.