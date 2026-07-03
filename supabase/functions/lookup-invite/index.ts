// Public unauthenticated lookup of an invitation by token.
// Uses the service role to read a single invitation row after strict
// token-equality match. Returns only the fields the onboarding page needs.
import { CORS_HEADERS, getAdmin, json } from '../_shared/email.ts'

interface Body {
  token: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  const token = body?.token?.trim()
  if (!token || token.length < 8 || token.length > 200) {
    return json({ error: 'Invalid token' }, 400)
  }

  const admin = await getAdmin()
  const { data: invite, error } = await admin
    .from('invitations')
    .select('id, funder_org_id, nonprofit_name, nonprofit_email, status, expires_at')
    .eq('token', token)
    .maybeSingle()

  if (error) return json({ error: 'Lookup failed' }, 500)
  if (!invite) return json({ error: 'Invitation not found' }, 404)

  let funder_name: string | null = null
  const { data: org } = await admin
    .from('organizations')
    .select('name')
    .eq('id', invite.funder_org_id)
    .maybeSingle()
  funder_name = org?.name ?? null

  return json({
    id: invite.id,
    funder_org_id: invite.funder_org_id,
    nonprofit_name: invite.nonprofit_name,
    nonprofit_email: invite.nonprofit_email,
    status: invite.status,
    expires_at: invite.expires_at,
    funder_name,
  })
})
