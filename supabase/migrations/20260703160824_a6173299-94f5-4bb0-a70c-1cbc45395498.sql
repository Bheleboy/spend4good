
-- Fix: revoke anon EXECUTE on SECURITY DEFINER function; keep authenticated
REVOKE EXECUTE ON FUNCTION public.get_invitation_by_token(text) FROM anon, PUBLIC;

-- Fix: remove redundant permissive policy on email_logs (service_role bypasses RLS)
DROP POLICY IF EXISTS "service role manages logs" ON public.email_logs;

-- Fix: replace waitlist WITH CHECK (true) with a validated expression
DROP POLICY IF EXISTS "anyone can join waitlist" ON public.waitlist;
CREATE POLICY "anyone can join waitlist" ON public.waitlist
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL
    AND char_length(email) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND country IS NOT NULL
    AND char_length(country) BETWEEN 2 AND 8
    AND (org_name IS NULL OR char_length(org_name) <= 200)
  );
