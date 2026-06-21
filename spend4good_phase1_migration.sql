-- =============================================================
-- Spend4Good Phase 1 — Foundation schema
-- Run this in your Supabase SQL editor (project rpkivjzkgmfwnitjdmcv)
-- Idempotent where possible. Review before running in production.
-- =============================================================

-- 1. ENUMS -----------------------------------------------------
do $$ begin
  create type public.org_type as enum ('funder', 'nonprofit');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.subscription_plan as enum (
    'nonprofit_self',    -- $100/yr
    'funder_starter',    -- $800/yr
    'funder_premium',    -- $2000/yr
    'invited_free',      -- nonprofit invited by funder
    'trial'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum (
    'admin','director','finance_manager','project_manager',
    'field_officer','agent','funder_admin'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.funder_nonprofit_status as enum ('invited','active','suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_type as enum (
    'invoice','receipt','report','budget','contract','proof_of_payment','other'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.document_source as enum ('dashboard','whatsapp');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.approval_status as enum (
    'draft','submitted','under_review','approved','rejected','revision_required'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.project_status as enum ('active','completed','paused');
exception when duplicate_object then null; end $$;

-- 2. ORGANIZATIONS --------------------------------------------
alter table public.organizations
  add column if not exists type public.org_type,
  add column if not exists subscription_plan public.subscription_plan;

-- 3. USERS ----------------------------------------------------
-- Keep existing users table; add WhatsApp verification + new fields
alter table public.users
  add column if not exists whatsapp_number text,
  add column if not exists whatsapp_verified boolean not null default false,
  add column if not exists designation text;

-- 4. USER_ROLES (separate table — never store role on users/profile) -----
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  role public.app_role not null,
  org_id uuid references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, role, org_id)
);

grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

-- 5. has_role security definer (prevents recursive RLS) -------
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role);
$$;

create or replace function public.has_role_in_org(_user_id uuid, _role public.app_role, _org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role and (org_id = _org_id or org_id is null)
  );
$$;

-- 6. FUNDER_NONPROFITS (many-to-many) -------------------------
create table if not exists public.funder_nonprofits (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid not null references public.organizations(id) on delete cascade,
  nonprofit_id uuid not null references public.organizations(id) on delete cascade,
  project_limit int not null default 4,
  status public.funder_nonprofit_status not null default 'invited',
  invited_at timestamptz not null default now(),
  accepted_at timestamptz,
  unique (funder_id, nonprofit_id)
);
grant select, insert, update, delete on public.funder_nonprofits to authenticated;
grant all on public.funder_nonprofits to service_role;
alter table public.funder_nonprofits enable row level security;

-- 7. PROJECTS additions ---------------------------------------
alter table public.projects
  add column if not exists funder_id uuid references public.organizations(id) on delete set null,
  add column if not exists actual_spend numeric(14,2) not null default 0,
  add column if not exists variance numeric(14,2) generated always as (budget - actual_spend) stored,
  add column if not exists status public.project_status not null default 'active';

-- 8. DOCUMENTS additions --------------------------------------
alter table public.documents
  add column if not exists document_type public.document_type not null default 'other',
  add column if not exists source public.document_source not null default 'dashboard',
  add column if not exists approval_status public.approval_status not null default 'submitted',
  add column if not exists project_id uuid references public.projects(id) on delete cascade,
  add column if not exists uploaded_by uuid references public.users(id) on delete set null,
  add column if not exists reviewed_by uuid references public.users(id),
  add column if not exists reviewed_at timestamptz;

-- 9. EXPENSES -------------------------------------------------
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  document_id uuid references public.documents(id) on delete set null,
  category text not null,
  amount numeric(14,2) not null check (amount >= 0),
  submitted_by uuid references public.users(id),
  status public.approval_status not null default 'submitted',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
alter table public.expenses enable row level security;

-- 10. SUBSCRIPTIONS -------------------------------------------
create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  plan public.subscription_plan not null,
  billing_cycle text not null default 'annual',
  amount numeric(10,2) not null,
  status text not null default 'active',
  stripe_subscription_id text,
  stripe_customer_id text,
  renewal_date timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id)
);
grant select, insert, update on public.subscriptions to authenticated;
grant all on public.subscriptions to service_role;
alter table public.subscriptions enable row level security;

-- 11. RLS POLICIES --------------------------------------------
-- user_roles: user reads own; admins manage
drop policy if exists "users read own roles" on public.user_roles;
create policy "users read own roles" on public.user_roles
  for select to authenticated using (user_id = auth.uid());

drop policy if exists "admins manage roles" on public.user_roles;
create policy "admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- funder_nonprofits: funder admins manage their portfolio; nonprofit users read where they belong
drop policy if exists "funder admins manage portfolio" on public.funder_nonprofits;
create policy "funder admins manage portfolio" on public.funder_nonprofits
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'funder_admin', funder_id))
  with check (public.has_role_in_org(auth.uid(), 'funder_admin', funder_id));

drop policy if exists "nonprofit reads their funders" on public.funder_nonprofits;
create policy "nonprofit reads their funders" on public.funder_nonprofits
  for select to authenticated
  using (exists (
    select 1 from public.users u
    where u.id = auth.uid() and u.org_id = funder_nonprofits.nonprofit_id
  ));

-- expenses: org members read; PM/Finance/Director/Admin write
drop policy if exists "org members read expenses" on public.expenses;
create policy "org members read expenses" on public.expenses
  for select to authenticated
  using (exists (
    select 1 from public.projects p
    join public.users u on u.org_id = p.org_id
    where p.id = expenses.project_id and u.id = auth.uid()
  ));

drop policy if exists "approvers write expenses" on public.expenses;
create policy "approvers write expenses" on public.expenses
  for all to authenticated
  using (
    public.has_role(auth.uid(), 'admin') or
    public.has_role(auth.uid(), 'finance_manager') or
    public.has_role(auth.uid(), 'project_manager') or
    public.has_role(auth.uid(), 'director')
  )
  with check (true);

-- subscriptions: org members read own; service_role writes
drop policy if exists "org members read subscription" on public.subscriptions;
create policy "org members read subscription" on public.subscriptions
  for select to authenticated
  using (exists (
    select 1 from public.users u where u.id = auth.uid() and u.org_id = subscriptions.organization_id
  ));

-- 12. PROJECT LIMIT ENFORCEMENT -------------------------------
create or replace function public.enforce_project_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare _limit int; _count int;
begin
  if NEW.funder_id is null then
    -- self-registered nonprofit cap of 4
    select count(*) into _count from public.projects
      where org_id = NEW.org_id and funder_id is null;
    if _count >= 4 then
      raise exception 'Self-registered nonprofit project limit (4) reached';
    end if;
  else
    select project_limit into _limit from public.funder_nonprofits
      where funder_id = NEW.funder_id and nonprofit_id = NEW.org_id;
    if _limit is null then
      raise exception 'No active funding relationship between funder and nonprofit';
    end if;
    select count(*) into _count from public.projects
      where org_id = NEW.org_id and funder_id = NEW.funder_id;
    if _count >= _limit then
      raise exception 'Project limit (%) reached for this funder relationship', _limit;
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_enforce_project_limit on public.projects;
create trigger trg_enforce_project_limit
  before insert on public.projects
  for each row execute function public.enforce_project_limit();

-- 13. NONPROFIT-COUNT LIMIT FOR STARTER FUNDER ----------------
create or replace function public.enforce_funder_nonprofit_limit()
returns trigger language plpgsql security definer set search_path = public as $$
declare _plan public.subscription_plan; _count int;
begin
  select plan into _plan from public.subscriptions where organization_id = NEW.funder_id;
  if _plan = 'funder_starter' then
    select count(*) into _count from public.funder_nonprofits where funder_id = NEW.funder_id;
    if _count >= 10 then
      raise exception 'Starter funder plan limited to 10 nonprofits. Upgrade to Premium.';
    end if;
  end if;
  return NEW;
end $$;

drop trigger if exists trg_enforce_funder_np_limit on public.funder_nonprofits;
create trigger trg_enforce_funder_np_limit
  before insert on public.funder_nonprofits
  for each row execute function public.enforce_funder_nonprofit_limit();

-- =============================================================
-- DONE. After running, verify in Supabase dashboard:
--   - Tables: user_roles, funder_nonprofits, expenses, subscriptions
--   - Enums listed above
--   - Triggers on projects + funder_nonprofits
-- =============================================================
