
-- 1. Extend projects
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS activity_categories text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS province text,
  ADD COLUMN IF NOT EXISTS location_description text,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'ZAR';

-- Alias budget_amount -> budget: keep code compatibility with existing insert
ALTER TABLE public.projects
  ADD COLUMN IF NOT EXISTS budget_amount numeric;

UPDATE public.projects SET budget_amount = budget WHERE budget_amount IS NULL;

-- 2. project_photos
CREATE TABLE IF NOT EXISTS public.project_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  submitted_by uuid REFERENCES public.users(id) ON DELETE SET NULL,
  submitted_by_name text,
  file_path text,
  storage_url text,
  label text,
  activity text,
  source text NOT NULL DEFAULT 'whatsapp',
  message_sid text,
  taken_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_photos_project ON public.project_photos(project_id, taken_at DESC);
CREATE INDEX IF NOT EXISTS idx_project_photos_org ON public.project_photos(org_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.project_photos TO authenticated;
GRANT ALL ON public.project_photos TO service_role;

ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view project photos"
  ON public.project_photos FOR SELECT
  TO authenticated
  USING (org_id = public.current_user_org_id());

CREATE POLICY "Org members can insert project photos"
  ON public.project_photos FOR INSERT
  TO authenticated
  WITH CHECK (org_id = public.current_user_org_id());

CREATE POLICY "Org members can update project photos"
  ON public.project_photos FOR UPDATE
  TO authenticated
  USING (org_id = public.current_user_org_id());

CREATE POLICY "Org members can delete project photos"
  ON public.project_photos FOR DELETE
  TO authenticated
  USING (org_id = public.current_user_org_id());
