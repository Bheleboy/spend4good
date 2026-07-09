import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await req.json().catch(() => null)
  if (!body) return json({ error: 'Invalid body' }, 400)

  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } }
  )

  const {
    auth_user_id,
    org_name,
    slug,
    country,
    org_type,
    subscription_plan,
    role,
    full_name,
    email,
    phone,
    npo_registration_number,
    pbo_number,
    billing,
  } = body

  const orgInsert: Record<string, any> = {
    name: org_name,
    slug: slug || 'org-' + Date.now(),
    country,
    type: org_type,
    onboarding_status: 'pending',
    subscription_tier: subscription_plan,
    subscription_plan,
  }
  if (org_type === 'nonprofit') {
    orgInsert.npo_registration_number = npo_registration_number || null
    orgInsert.pbo_number = pbo_number || null
    orgInsert.is_verified = false
  }

  const { data: org, error: orgError } = await admin
    .from('organizations')
    .insert(orgInsert)
    .select()
    .single()

  if (orgError) return json({ error: 'Failed to create organization: ' + orgError.message }, 500)

  if (billing) {
    try {
      const { error: billingError } = await admin.from('billing_details').insert({
        org_id: org.id,
        legal_name: billing.legal_name || org_name,
        address_line1: billing.address_line1,
        address_line2: billing.address_line2 || null,
        city: billing.city,
        province: billing.province || null,
        postal_code: billing.postal_code,
        country: billing.country || country,
        vat_number: billing.vat_number || null,
        signatory_name: billing.signatory_name,
        signatory_title: billing.signatory_title,
        billing_email: billing.billing_email || email,
      })
      if (billingError) console.warn('billing insert failed', billingError)
    } catch (e) {
      console.warn('billing insert exception', e)
    }
  }

  const { error: userError } = await admin.from('users').insert({
    id: auth_user_id,
    org_id: org.id,
    full_name,
    email,
    phone_number: org_type === 'funder' ? null : phone,
    whatsapp_number: org_type === 'funder' ? null : phone,
    role,
    is_active: true,
  })

  if (userError) return json({ error: 'Failed to create user profile: ' + userError.message }, 500)

  try {
    const { error: roleError } = await admin.from('user_roles').insert({
      user_id: auth_user_id,
      role,
      org_id: org.id,
    })
    if (roleError) console.warn('user_roles insert failed', roleError)
  } catch (e) {
    console.warn('user_roles insert exception', e)
  }

  try {
    await admin.functions.invoke('send-welcome', {
      body: {
        full_name,
        email,
        org_name,
        account_type: org_type === 'funder' ? 'funder' : 'nonprofit',
        org_id: org.id,
      },
    })
  } catch (e) {
    console.warn('send-welcome failed', e)
  }

  return json({ ok: true, org_id: org.id, org_name: org.name })
})
