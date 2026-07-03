create table if not exists public.waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  country text not null,
  org_name text,
  created_at timestamptz not null default now()
);

grant insert on public.waitlist to anon, authenticated;
grant all on public.waitlist to service_role;

alter table public.waitlist enable row level security;

create policy "anyone can join waitlist" on public.waitlist
  for insert with check (true);