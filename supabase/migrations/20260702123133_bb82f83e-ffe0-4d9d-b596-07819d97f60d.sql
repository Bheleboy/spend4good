
-- ORGANIZATIONS
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  type text not null check (type in ('nonprofit', 'funder')),
  country text not null default 'ZA',
  phone_number text,
  onboarding_status text not null default 'pending' check (onboarding_status in ('pending', 'active', 'suspended')),
  subscription_tier text not null default 'invited_free' check (subscription_tier in ('invited_free', 'nonprofit_starter', 'funder_starter', 'funder_growth', 'funder_unlimited')),
  subscription_plan text not null default 'invited_free' check (subscription_plan in ('invited_free', 'nonprofit_starter', 'funder_starter', 'funder_growth', 'funder_unlimited')),
  subscription_status text not null default 'trialing' check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'paused')),
  paddle_subscription_id text,
  paddle_customer_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- USERS
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  full_name text not null,
  email text not null,
  phone_number text,
  whatsapp_number text,
  role text not null default 'member' check (role in ('admin', 'member', 'viewer')),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- USER ROLES
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  role text not null check (role in ('admin', 'member', 'viewer', 'funder_admin', 'funder_viewer')),
  created_at timestamptz not null default now(),
  unique(user_id, org_id, role)
);

-- FUNDER-NONPROFIT RELATIONSHIPS
create table if not exists public.funder_nonprofits (
  id uuid primary key default gen_random_uuid(),
  funder_id uuid not null references public.organizations(id) on delete cascade,
  nonprofit_id uuid not null references public.organizations(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited', 'active', 'suspended')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(funder_id, nonprofit_id)
);

-- INVITATIONS
create table if not exists public.invitations (
  id uuid primary key default gen_random_uuid(),
  funder_org_id uuid not null references public.organizations(id) on delete cascade,
  nonprofit_name text not null,
  nonprofit_email text not null,
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'expired', 'revoked')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '14 days'),
  accepted_at timestamptz
);

-- PROJECTS
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  funder_id uuid references public.organizations(id),
  name text not null,
  description text,
  budget numeric(12,2) not null default 0,
  spent numeric(12,2) not null default 0,
  status text not null default 'active' check (status in ('active', 'completed', 'suspended', 'draft')),
  start_date date,
  end_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- EXPENSES
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  org_id uuid not null references public.organizations(id),
  submitted_by uuid not null references public.users(id),
  amount numeric(12,2) not null,
  currency text not null default 'USD',
  description text not null,
  category text,
  receipt_url text,
  whatsapp_message_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'flagged')),
  approved_by uuid references public.users(id),
  approved_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

-- COMPLIANCE DOCUMENTS
create table if not exists public.compliance_documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  category text not null,
  file_path text not null,
  expiry_date date,
  status text not null default 'current' check (status in ('current', 'expiring_soon', 'expired')),
  ai_review_notes text,
  created_at timestamptz not null default now()
);

-- COMPLIANCE DEADLINES
create table if not exists public.compliance_deadlines (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  deadline_type text not null,
  due_date date not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'complete', 'overdue')),
  is_custom boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

-- NARRATIVE REPORTS
create table if not exists public.narrative_reports (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  financial_year text not null,
  form_data jsonb not null default '{}',
  generated_content text,
  status text not null default 'draft' check (status in ('draft', 'final')),
  created_at timestamptz not null default now(),
  finalised_at timestamptz
);

-- COMPLIANCE SCORES
create table if not exists public.compliance_scores (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  overall_score int not null default 0,
  filing_score int not null default 0,
  document_score int not null default 0,
  governance_score int not null default 0,
  financial_score int not null default 0,
  policy_score int not null default 0,
  calculated_at timestamptz not null default now()
);

-- JURISDICTION REQUESTS
create table if not exists public.jurisdiction_requests (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  country text not null,
  requested_at timestamptz not null default now()
);

-- PADDLE WEBHOOK EVENTS
create table if not exists public.paddle_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed boolean not null default false
);

-- GRANTS
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.organizations to authenticated;
grant all on public.organizations to service_role;
grant select, insert, update, delete on public.users to authenticated;
grant all on public.users to service_role;
grant select, insert, update, delete on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
grant select, insert, update, delete on public.funder_nonprofits to authenticated;
grant all on public.funder_nonprofits to service_role;
grant select, insert, update, delete on public.invitations to authenticated;
grant all on public.invitations to service_role;
grant select on public.invitations to anon;
grant select, insert, update, delete on public.projects to authenticated;
grant all on public.projects to service_role;
grant select, insert, update, delete on public.expenses to authenticated;
grant all on public.expenses to service_role;
grant select, insert, update, delete on public.compliance_documents to authenticated;
grant all on public.compliance_documents to service_role;
grant select, insert, update, delete on public.compliance_deadlines to authenticated;
grant all on public.compliance_deadlines to service_role;
grant select, insert, update, delete on public.narrative_reports to authenticated;
grant all on public.narrative_reports to service_role;
grant select, insert, update, delete on public.compliance_scores to authenticated;
grant all on public.compliance_scores to service_role;
grant select, insert, update, delete on public.jurisdiction_requests to authenticated;
grant all on public.jurisdiction_requests to service_role;
grant all on public.paddle_webhook_events to service_role;

-- HELPER FUNCTIONS (security definer, avoids RLS recursion)
create or replace function public.has_role_in_org(
  _user_id uuid,
  _required_role text,
  _org_id uuid
) returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = _user_id
      and ur.role = _required_role
      and ur.org_id = _org_id
  );
$$;

-- Returns caller's org_id from public.users. Security definer avoids
-- recursive RLS when policies on users/other tables need to look up org_id.
create or replace function public.current_user_org_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select org_id from public.users where id = auth.uid();
$$;

-- ENABLE RLS
alter table public.organizations enable row level security;
alter table public.users enable row level security;
alter table public.user_roles enable row level security;
alter table public.funder_nonprofits enable row level security;
alter table public.invitations enable row level security;
alter table public.projects enable row level security;
alter table public.expenses enable row level security;
alter table public.compliance_documents enable row level security;
alter table public.compliance_deadlines enable row level security;
alter table public.narrative_reports enable row level security;
alter table public.compliance_scores enable row level security;
alter table public.jurisdiction_requests enable row level security;
alter table public.paddle_webhook_events enable row level security;

-- ORGANIZATIONS
create policy "users see own org" on public.organizations
  for select to authenticated using (id = public.current_user_org_id());
create policy "users update own org" on public.organizations
  for update to authenticated using (id = public.current_user_org_id());
create policy "funders see linked nonprofits" on public.organizations
  for select to authenticated using (
    id in (
      select nonprofit_id from public.funder_nonprofits
      where funder_id = public.current_user_org_id()
    )
  );

-- USERS
create policy "users see own org members" on public.users
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "users update own record" on public.users
  for update to authenticated using (id = auth.uid());
create policy "users insert self" on public.users
  for insert to authenticated with check (id = auth.uid());

-- USER ROLES
create policy "users see own org roles" on public.user_roles
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "org admins manage roles" on public.user_roles
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id))
  with check (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- FUNDER-NONPROFIT RELATIONSHIPS
create policy "funders manage their relationships" on public.funder_nonprofits
  for all to authenticated
  using (funder_id = public.current_user_org_id())
  with check (funder_id = public.current_user_org_id());
create policy "nonprofits see their funder relationships" on public.funder_nonprofits
  for select to authenticated using (nonprofit_id = public.current_user_org_id());

-- INVITATIONS
create policy "funder admins manage their invitations" on public.invitations
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'funder_admin', funder_org_id))
  with check (public.has_role_in_org(auth.uid(), 'funder_admin', funder_org_id));
create policy "public can validate invite by token" on public.invitations
  for select to anon, authenticated using (true);

-- PROJECTS
create policy "org members see own projects" on public.projects
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "funders see linked nonprofit projects" on public.projects
  for select to authenticated using (
    org_id in (
      select nonprofit_id from public.funder_nonprofits
      where funder_id = public.current_user_org_id() and status = 'active'
    )
  );
create policy "org admins manage projects" on public.projects
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id))
  with check (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- EXPENSES
create policy "org members see own expenses" on public.expenses
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "funders see linked nonprofit expenses" on public.expenses
  for select to authenticated using (
    org_id in (
      select nonprofit_id from public.funder_nonprofits
      where funder_id = public.current_user_org_id() and status = 'active'
    )
  );
create policy "members submit expenses" on public.expenses
  for insert to authenticated with check (org_id = public.current_user_org_id());
create policy "admins approve expenses" on public.expenses
  for update to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- COMPLIANCE DOCUMENTS
create policy "org members see own documents" on public.compliance_documents
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "org admins manage documents" on public.compliance_documents
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id))
  with check (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- COMPLIANCE DEADLINES
create policy "org members see own deadlines" on public.compliance_deadlines
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "org admins manage deadlines" on public.compliance_deadlines
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id))
  with check (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- NARRATIVE REPORTS
create policy "org members see own reports" on public.narrative_reports
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "org admins manage reports" on public.narrative_reports
  for all to authenticated
  using (public.has_role_in_org(auth.uid(), 'admin', org_id))
  with check (public.has_role_in_org(auth.uid(), 'admin', org_id));

-- COMPLIANCE SCORES
create policy "org members see own score" on public.compliance_scores
  for select to authenticated using (org_id = public.current_user_org_id());
create policy "funders see linked nonprofit scores" on public.compliance_scores
  for select to authenticated using (
    org_id in (
      select nonprofit_id from public.funder_nonprofits
      where funder_id = public.current_user_org_id() and status = 'active'
    )
  );

-- JURISDICTION REQUESTS
create policy "org members insert own requests" on public.jurisdiction_requests
  for insert to authenticated with check (org_id = public.current_user_org_id());
create policy "org members read own requests" on public.jurisdiction_requests
  for select to authenticated using (org_id = public.current_user_org_id());

-- PADDLE WEBHOOK EVENTS (service role only)
create policy "no user access to webhook events" on public.paddle_webhook_events
  for all to authenticated using (false) with check (false);
