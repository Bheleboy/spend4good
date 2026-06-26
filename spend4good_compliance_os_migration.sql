-- =============================================================
-- Spend4Good — Compliance OS schema (Wave 1)
-- Run in Supabase SQL editor (project rpkivjzkgmfwnitjdmcv).
-- Idempotent; safe to re-run.
-- =============================================================

-- 1. Enums ----------------------------------------------------
do $$ begin
  create type public.compliance_org_type as enum ('npo','npc','trust','voluntary_association');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.income_bracket as enum ('under_1m','1m_5m','5m_20m','over_20m');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deadline_type as enum (
    'dsd_narrative','cipc_beneficial_ownership','office_bearer_update',
    'section_18a_renewal','aml_policy_review','popia_review','custom'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.deadline_status as enum ('not_started','in_progress','complete');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.narrative_report_status as enum ('draft','final');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compliance_doc_category as enum (
    'dsd_submission','cipc_filing','audit_report','board_resolution',
    'policy','certificate','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.compliance_doc_status as enum ('current','expiring_soon','expired');
exception when duplicate_object then null; end $$;

-- 2. Extend organizations ------------------------------------
alter table public.organizations
  add column if not exists npo_reg_number text,
  add column if not exists province text,
  add column if not exists compliance_org_type public.compliance_org_type,
  add column if not exists financial_year_end_month int check (financial_year_end_month between 1 and 12),
  add column if not exists has_section_18a boolean default false,
  add column if not exists is_npc boolean default false,
  add column if not exists operates_outside_sa boolean default false,
  add column if not exists income_bracket public.income_bracket,
  add column if not exists whatsapp_number text,
  add column if not exists reminder_days int[] default '{30,14,7,0}',
  add column if not exists compliance_onboarded_at timestamptz;

-- 3. compliance_deadlines ------------------------------------
create table if not exists public.compliance_deadlines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  deadline_type public.deadline_type not null,
  title text not null,
  due_date date not null,
  status public.deadline_status not null default 'not_started',
  reminder_days int[] default '{30,14,7,0}',
  is_custom boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_deadlines_org_due on public.compliance_deadlines(org_id, due_date);

grant select, insert, update, delete on public.compliance_deadlines to authenticated;
grant all on public.compliance_deadlines to service_role;
alter table public.compliance_deadlines enable row level security;

drop policy if exists "deadlines_org_access" on public.compliance_deadlines;
create policy "deadlines_org_access" on public.compliance_deadlines
  for all to authenticated
  using (org_id in (select organization_id from public.users where id = auth.uid()))
  with check (org_id in (select organization_id from public.users where id = auth.uid()));

-- 4. narrative_reports ---------------------------------------
create table if not exists public.narrative_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  financial_year text not null,
  form_data jsonb not null default '{}'::jsonb,
  generated_content text,
  status public.narrative_report_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  finalised_at timestamptz
);
create index if not exists idx_reports_org on public.narrative_reports(org_id, created_at desc);

grant select, insert, update, delete on public.narrative_reports to authenticated;
grant all on public.narrative_reports to service_role;
alter table public.narrative_reports enable row level security;

drop policy if exists "reports_org_access" on public.narrative_reports;
create policy "reports_org_access" on public.narrative_reports
  for all to authenticated
  using (org_id in (select organization_id from public.users where id = auth.uid()))
  with check (org_id in (select organization_id from public.users where id = auth.uid()));

-- 5. compliance_documents -----------------------------------
create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category public.compliance_doc_category not null default 'other',
  file_path text not null,
  expiry_date date,
  status public.compliance_doc_status not null default 'current',
  uploaded_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_compdocs_org on public.compliance_documents(org_id, category);

grant select, insert, update, delete on public.compliance_documents to authenticated;
grant all on public.compliance_documents to service_role;
alter table public.compliance_documents enable row level security;

drop policy if exists "compdocs_org_access" on public.compliance_documents;
create policy "compdocs_org_access" on public.compliance_documents
  for all to authenticated
  using (org_id in (select organization_id from public.users where id = auth.uid()))
  with check (org_id in (select organization_id from public.users where id = auth.uid()));

-- 6. compliance_scores --------------------------------------
create table if not exists public.compliance_scores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  overall_score int not null check (overall_score between 0 and 100),
  filing_score int not null default 0,
  document_score int not null default 0,
  governance_score int not null default 0,
  financial_score int not null default 0,
  policy_score int not null default 0,
  calculated_at timestamptz not null default now()
);
create index if not exists idx_scores_org on public.compliance_scores(org_id, calculated_at desc);

grant select, insert, update, delete on public.compliance_scores to authenticated;
grant all on public.compliance_scores to service_role;
alter table public.compliance_scores enable row level security;

drop policy if exists "scores_org_access" on public.compliance_scores;
create policy "scores_org_access" on public.compliance_scores
  for all to authenticated
  using (org_id in (select organization_id from public.users where id = auth.uid()))
  with check (org_id in (select organization_id from public.users where id = auth.uid()));

-- 7. Storage bucket ------------------------------------------
-- Create bucket via Supabase dashboard or:
--   insert into storage.buckets (id, name, public) values ('compliance-docs','compliance-docs', false)
--   on conflict (id) do nothing;
-- Then run these RLS policies on storage.objects:

drop policy if exists "compdocs_select" on storage.objects;
create policy "compdocs_select" on storage.objects for select to authenticated
  using (bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.users where id = auth.uid()
    ));

drop policy if exists "compdocs_insert" on storage.objects;
create policy "compdocs_insert" on storage.objects for insert to authenticated
  with check (bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.users where id = auth.uid()
    ));

drop policy if exists "compdocs_delete" on storage.objects;
create policy "compdocs_delete" on storage.objects for delete to authenticated
  using (bucket_id = 'compliance-docs'
    and (storage.foldername(name))[1] in (
      select organization_id::text from public.users where id = auth.uid()
    ));
