
DROP POLICY IF EXISTS "authenticated can create organization" ON public.organizations;
CREATE POLICY "authenticated can create first organization"
  ON public.organizations FOR INSERT TO authenticated
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.org_id IS NOT NULL
    )
  );
