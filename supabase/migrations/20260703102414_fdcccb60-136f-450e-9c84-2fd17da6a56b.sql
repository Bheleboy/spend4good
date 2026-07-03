
DROP POLICY IF EXISTS "authenticated can create organization" ON public.organizations;
CREATE POLICY "authenticated can create organization"
  ON public.organizations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "users insert own initial role" ON public.user_roles;
CREATE POLICY "users insert own initial role"
  ON public.user_roles FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
