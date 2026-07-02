
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  org_id uuid references public.organizations(id) on delete set null,
  recipient_email text not null,
  email_type text not null check (email_type in (
    'invite', 'welcome_nonprofit', 'welcome_funder',
    'expense_notification', 'deadline_reminder',
    'password_reset', 'confirm_signup'
  )),
  resend_id text,
  status text not null default 'sent' check (status in ('sent', 'failed', 'bounced')),
  sent_at timestamptz not null default now(),
  error_details text
);

grant select on public.email_logs to authenticated;
grant all on public.email_logs to service_role;

alter table public.email_logs enable row level security;

create policy "org admins read own email logs" on public.email_logs
  for select to authenticated
  using (org_id = public.current_user_org_id());

create policy "service role manages logs" on public.email_logs
  for all to service_role using (true) with check (true);

create index if not exists email_logs_org_sent_idx on public.email_logs (org_id, sent_at desc);
