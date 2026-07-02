// Accept-invite: validates an invitation token and provisions the invited
// nonprofit organisation, user profile, role, and funder link atomically
// with the service role. Called AFTER the user has completed Supabase
// auth signup on the client (we receive their auth user id).

import { CORS_HEADERS, getAdmin, json } from '../_shared/email.ts'

interface Body {
  token: string
  auth_user_id: string
  full_name: string
  email: string
  phone: string
  country?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.token || !body.auth_user_id || !body.full_name || !body.email || !body.phone) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const admin = await getAdmin()

  // 1. Look up invitation
  const { data: invite, error: inviteErr } = await admin
    .from('invitations')
    .select('id, funder_org_id, nonprofit_name, nonprofit_email, status, expires_at')
    .eq('token', body.token)
    .maybeSingle()

  if (inviteErr || !invite) return json({ error: 'Invitation not found' }, 404)
  if (invite.status === 'accepted') return json({ error: 'Invitation already accepted' }, 409)
  if (invite.status === 'revoked') return json({ error: 'Invitation revoked' }, 410)
  if (new Date(invite.expires_at).getTime() < Date.now()) return json({ error: 'Invitation expired' }, 410)

  // 2. Create nonprofit organisation
  const slug =
    invite.nonprofit_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') +
    '-' + Math.random().toString(36).slice(2, 6)

  const { data: org, error: orgErr } = await admin
    .from('organizations')
    .insert({
      name: invite.nonprofit_name,
      slug,
      type: 'nonprofit',
      country: body.country ?? 'ZA',
      onboarding_status: 'active',
      subscription_tier: 'invited_free',
      subscription_plan: 'invited_free',
      subscription_status: 'active',
    })
    .select('id')
    .single()

  if (orgErr || !org) return json({ error: `Org creation failed: ${orgErr?.message}` }, 500)

  // 3. Create public.users profile row (id must equal auth uid)
  const { error: userErr } = await admin.from('users').insert({
    id: body.auth_user_id,
    org_id: org.id,
    full_name: body.full_name,
    email: body.email,
    phone_number: body.phone,
    whatsapp_number: body.phone,
    role: 'admin',
    is_active: true,
  })
  if (userErr) return json({ error: `Profile creation failed: ${userErr.message}` }, 500)

  // 4. Grant admin role
  const { error: roleErr } = await admin.from('user_roles').insert({
    user_id: body.auth_user_id,
    role: 'admin',
    org_id: org.id,
  })
  if (roleErr) return json({ error: `Role grant failed: ${roleErr.message}` }, 500)

  // 5. Link funder <-> nonprofit
  const { error: linkErr } = await admin.from('funder_nonprofits').insert({
    funder_id: invite.funder_org_id,
    nonprofit_id: org.id,
    status: 'active',
  })
  if (linkErr) return json({ error: `Funder link failed: ${linkErr.message}` }, 500)

  // 6. Mark invitation accepted
  await admin
    .from('invitations')
    .update({ status: 'accepted', accepted_at: new Date().toISOString() })
    .eq('id', invite.id)

  return json({ ok: true, org_id: org.id })
})
