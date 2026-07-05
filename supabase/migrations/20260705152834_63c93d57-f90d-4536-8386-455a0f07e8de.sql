ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role = ANY (ARRAY[
    'admin'::text,
    'member'::text,
    'viewer'::text,
    'funder_admin'::text,
    'funder_viewer'::text,
    'field_agent'::text,
    'project_manager'::text,
    'accountant'::text
  ]));