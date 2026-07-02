
DROP POLICY IF EXISTS "public can validate invite by token" ON public.invitations;

CREATE OR REPLACE FUNCTION public.get_invitation_by_token(_token text)
RETURNS TABLE (
  id uuid,
  funder_org_id uuid,
  nonprofit_name text,
  nonprofit_email text,
  status text,
  expires_at timestamptz,
  funder_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT i.id, i.funder_org_id, i.nonprofit_name, i.nonprofit_email,
         i.status::text, i.expires_at, o.name AS funder_name
  FROM public.invitations i
  LEFT JOIN public.organizations o ON o.id = i.funder_org_id
  WHERE i.token = _token
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_invitation_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_invitation_by_token(text) TO anon, authenticated;

REVOKE ALL ON FUNCTION public.has_role_in_org(uuid, text, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_role_in_org(uuid, text, uuid) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.current_user_org_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_org_id() TO authenticated, service_role;
