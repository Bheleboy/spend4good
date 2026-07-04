
-- project_members
CREATE TABLE IF NOT EXISTS public.project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'field_agent' CHECK (role IN ('field_agent','project_manager','accountant','viewer')),
  added_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_members TO authenticated;
GRANT ALL ON public.project_members TO service_role;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members manage project members" ON public.project_members
  FOR ALL TO authenticated
  USING (org_id = public.current_user_org_id())
  WITH CHECK (org_id = public.current_user_org_id());

-- whatsapp_messages
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  from_number text NOT NULL,
  body text,
  media_url text,
  media_count int NOT NULL DEFAULT 0,
  matched_user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  matched_project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  expense_id uuid REFERENCES public.expenses(id) ON DELETE SET NULL,
  message_sid text,
  received_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "org members see own whatsapp messages" ON public.whatsapp_messages
  FOR SELECT TO authenticated
  USING (org_id IS NULL OR org_id = public.current_user_org_id());

-- expenses: add rejection_reason, broaden update policy
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS rejection_reason text;

DROP POLICY IF EXISTS "admins approve expenses" ON public.expenses;
CREATE POLICY "admins and pms approve expenses" ON public.expenses
  FOR UPDATE TO authenticated
  USING (
    org_id = public.current_user_org_id()
    AND (
      public.has_role_in_org(auth.uid(), 'admin', org_id)
      OR EXISTS (
        SELECT 1 FROM public.project_members pm
        WHERE pm.project_id = expenses.project_id
          AND pm.user_id = auth.uid()
          AND pm.role = 'project_manager'
      )
    )
  );
