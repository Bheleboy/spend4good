// Twilio inbound WhatsApp webhook.
// Verifies Twilio signature, matches sender to a user by whatsapp_number,
// parses amount + description, uploads any media receipt, creates an
// expense + whatsapp_messages row, and replies via Twilio TwiML.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-twilio-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const TWILIO_SID = Deno.env.get('TWILIO_ACCOUNT_SID') ?? ''
const TWILIO_AUTH = Deno.env.get('TWILIO_AUTH_TOKEN') ?? ''
const TWILIO_FROM = Deno.env.get('TWILIO_WHATSAPP_FROM') ?? ''
const TWILIO_WEBHOOK_URL = Deno.env.get('TWILIO_WEBHOOK_URL') ?? ''

function twiml(msg: string) {
  const esc = msg.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${esc}</Message></Response>`,
    { status: 200, headers: { ...CORS, 'Content-Type': 'text/xml' } },
  )
}

async function sendTwilio(to: string, body: string) {
  if (!TWILIO_SID || !TWILIO_AUTH || !TWILIO_FROM) return
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`
  const auth = btoa(`${TWILIO_SID}:${TWILIO_AUTH}`)
  const form = new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body })
  await fetch(url, { method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/x-www-form-urlencoded' }, body: form.toString() }).catch(() => null)
}

function parseAmount(text: string): { amount: number | null; description: string } {
  if (!text) return { amount: null, description: '' }
  // Handles: R250, R 250.00, R1,500, R1 500, petrol R250, 250 petrol, R250,50 (EU decimal)
  const m = text.match(
    /(?:R\s*)?(\d{1,3}(?:[,\s]\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2}|\d+,\d{1,2}|\d+)/i,
  )
  if (!m) return { amount: null, description: text.trim() }
  let raw = m[1]
  if (/[,\s]\d{3}/.test(raw)) raw = raw.replace(/[,\s]/g, '') // thousands separators
  else if (/,\d{1,2}$/.test(raw)) raw = raw.replace(',', '.') // EU decimal comma
  const amount = parseFloat(raw)
  const description = text.replace(m[0], '').replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '').trim() || 'Expense'
  return { amount: isNaN(amount) ? null : amount, description }
}

async function validateSignature(url: string, rawBody: string, signature: string | null): Promise<boolean> {
  if (!TWILIO_AUTH) return true // no secret configured = skip (dev)
  if (!signature) return false
  const params = new URLSearchParams(rawBody)
  const sortedKeys = [...params.keys()].sort()
  const sigStr = url + sortedKeys.map((k) => k + (params.get(k) ?? '')).join('')
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(TWILIO_AUTH),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(sigStr))
  const expected = btoa(String.fromCharCode(...new Uint8Array(sigBuf)))
  return expected === signature
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const rawBody = await req.text()
  const url = TWILIO_WEBHOOK_URL || req.url.split('?')[0]
  const sig = req.headers.get('x-twilio-signature')

  // Allow test payloads if signature is missing AND TWILIO_AUTH is unset,
  // otherwise enforce signature.
  const testMode = req.headers.get('x-test-mode') === 'spend4good-test' && !TWILIO_AUTH
  if (!testMode) {
    const ok = await validateSignature(url, rawBody, sig)
    if (!ok) return new Response('Forbidden', { status: 403, headers: CORS })
  }

  const form = new URLSearchParams(rawBody)
  const fromRaw = form.get('From') ?? ''
  const cleanNumber = fromRaw.replace(/^whatsapp:/, '').trim()
  const body = (form.get('Body') ?? '').trim()
  const numMedia = parseInt(form.get('NumMedia') ?? '0', 10) || 0
  const mediaUrlRaw = numMedia > 0 ? form.get('MediaUrl0') : null
  const messageSid = form.get('MessageSid') ?? crypto.randomUUID()

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // 1. lookup user
  const { data: user } = await admin
    .from('users')
    .select('id, org_id, full_name')
    .eq('whatsapp_number', cleanNumber)
    .eq('is_active', true)
    .maybeSingle()

  if (!user) {
    await admin.from('whatsapp_messages').insert({
      org_id: null, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia, message_sid: messageSid,
    })
    return twiml('Your number is not registered on Spend4Good. Ask your project manager to add you at spend4good.com')
  }

  // 2. active projects for user
  const { data: memberships } = await admin
    .from('project_members')
    .select('project_id, projects!inner(id, name, status)')
    .eq('user_id', user.id)

  const activeProjects = (memberships ?? [])
    .map((m: any) => m.projects)
    .filter((p: any) => p && p.status === 'active')

  if (activeProjects.length === 0) {
    await admin.from('whatsapp_messages').insert({
      org_id: user.org_id, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia,
      matched_user_id: user.id, message_sid: messageSid,
    })
    return twiml("You're not assigned to any active project. Ask your project manager to add you.")
  }

  let project = activeProjects[0]
  if (activeProjects.length > 1) {
    const hint = activeProjects.find((p: any) => body.toLowerCase().includes(p.name.toLowerCase()))
    if (!hint) {
      await admin.from('whatsapp_messages').insert({
        org_id: user.org_id, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia,
        matched_user_id: user.id, message_sid: messageSid,
      })
      const names = activeProjects.map((p: any) => p.name).join(', ')
      return twiml(`You're on multiple projects: ${names}. Start your message with the project name. E.g. "${activeProjects[0].name} - R250 petrol"`)
    }
    project = hint
  }

  // 3. strip project name if present, then parse amount
  let bodyToParse = body
  const nameRe = new RegExp('^\\s*' + project.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '[\\s\\-–—:]*', 'i')
  bodyToParse = bodyToParse.replace(nameRe, '')
  const { amount, description } = parseAmount(bodyToParse)

  if (amount === null || amount <= 0) {
    await admin.from('whatsapp_messages').insert({
      org_id: user.org_id, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia,
      matched_user_id: user.id, matched_project_id: project.id, message_sid: messageSid,
    })
    return twiml("Please include an amount. E.g. 'R250 petrol receipt'")
  }

  // 4. download + upload media if any
  let receiptUrl: string | null = null
  if (mediaUrlRaw && TWILIO_SID && TWILIO_AUTH) {
    try {
      const auth = btoa(`${TWILIO_SID}:${TWILIO_AUTH}`)
      const res = await fetch(mediaUrlRaw, { headers: { Authorization: `Basic ${auth}` } })
      if (res.ok) {
        const contentType = res.headers.get('content-type') ?? 'image/jpeg'
        const ext = contentType.includes('png') ? 'png' : 'jpg'
        const buf = new Uint8Array(await res.arrayBuffer())
        const path = `${user.org_id}/receipts/${messageSid}.${ext}`
        const { error: upErr } = await admin.storage.from('compliance-docs').upload(path, buf, { contentType, upsert: true })
        if (!upErr) {
          const { data: signed } = await admin.storage.from('compliance-docs').createSignedUrl(path, 60 * 60 * 24 * 365)
          receiptUrl = signed?.signedUrl ?? null
        }
      }
    } catch (_e) { /* ignore */ }
  } else if (mediaUrlRaw) {
    receiptUrl = mediaUrlRaw
  }

  // 5. insert expense
  const { data: expense, error: expErr } = await admin
    .from('expenses')
    .insert({
      project_id: project.id,
      org_id: user.org_id,
      submitted_by: user.id,
      amount,
      currency: 'ZAR',
      description,
      category: 'whatsapp_submission',
      receipt_url: receiptUrl,
      whatsapp_message_id: messageSid,
      status: 'pending',
      submitted_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (expErr) {
    console.error('expense insert failed', expErr)
    return twiml('Sorry, we could not log your expense. Please try again.')
  }

  // 6. whatsapp_messages row
  await admin.from('whatsapp_messages').insert({
    org_id: user.org_id, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia,
    matched_user_id: user.id, matched_project_id: project.id, expense_id: expense.id, message_sid: messageSid,
  })

  // 7. notify linked funder if any
  try {
    const { data: link } = await admin
      .from('funder_nonprofits')
      .select('funder_id, organizations!funder_nonprofits_funder_id_fkey(id, name)')
      .eq('nonprofit_id', user.org_id)
      .eq('status', 'active')
      .maybeSingle()
    if (link) {
      // find a funder admin email
      const { data: funderAdmin } = await admin
        .from('users')
        .select('email, full_name')
        .eq('org_id', (link as any).funder_id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      const { data: nonprofit } = await admin
        .from('organizations')
        .select('name')
        .eq('id', user.org_id)
        .maybeSingle()
      if (funderAdmin?.email) {
        await admin.functions.invoke('send-expense-notification', {
          body: {
            funder_email: funderAdmin.email,
            funder_name: funderAdmin.full_name ?? 'there',
            nonprofit_org_name: nonprofit?.name ?? '',
            expense_amount: amount,
            expense_currency: 'ZAR',
            expense_description: description,
            project_name: project.name,
            submitted_by_name: user.full_name,
            expense_id: expense.id,
            org_id: user.org_id,
          },
        }).catch(() => null)
      }
    }
  } catch (_e) { /* ignore */ }

  const reply = receiptUrl
    ? `Receipt received — R${amount} for ${description} logged to ${project.name}. Your manager will review it.`
    : `Expense logged — R${amount} for ${description} on ${project.name}. Tip: attach a photo of your receipt next time.`
  return twiml(reply)
})
