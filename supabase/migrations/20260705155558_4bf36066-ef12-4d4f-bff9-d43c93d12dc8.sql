ALTER TABLE public.user_roles DROP CONSTRAINT IF EXISTS user_roles_role_check;
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_role_check
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