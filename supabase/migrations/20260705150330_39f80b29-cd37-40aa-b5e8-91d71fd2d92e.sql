
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS npo_registration_number text,
  ADD COLUMN IF NOT EXISTS pbo_number text,
  ADD COLUMN IF NOT EXISTS is_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS verified_by text;

CREATE TABLE IF NOT EXISTS public.billing_details (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  address_line1 text NOT NULL,
  address_line2 text,
  city text NOT NULL,
  province text,
  postal_code text NOT NULL,
  country text NOT NULL,
  vat_number text,
  signatory_name text NOT NULL,
  signatory_title text NOT NULL,
  billing_email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.billing_details TO authenticated;
GRANT ALL ON public.billing_details TO service_role;

ALTER TABLE public.billing_details ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org members manage own billing details" ON public.billing_details
  FOR ALL TO authenticated
  USING (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM public.users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS billing_details_org_id_idx ON public.billing_details(org_id);
