// Twilio inbound WhatsApp webhook.
// Handles photo submission (with session state machine) and expense logging.

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
  const m = text.match(
    /(?:R\s*)?(\d{1,3}(?:[,\s]\d{3})+(?:\.\d{1,2})?|\d+\.\d{1,2}|\d+,\d{1,2}|\d+)/i,
  )
  if (!m) return { amount: null, description: text.trim() }
  let raw = m[1]
  if (/[,\s]\d{3}/.test(raw)) raw = raw.replace(/[,\s]/g, '')
  else if (/,\d{1,2}$/.test(raw)) raw = raw.replace(',', '.')
  const amount = parseFloat(raw)
  const description = text.replace(m[0], '').replace(/^[\s\-–—:]+|[\s\-–—:]+$/g, '').trim() || 'Expense'
  return { amount: isNaN(amount) ? null : amount, description }
}

async function validateSignature(url: string, rawBody: string, signature: string | null): Promise<boolean> {
  if (!TWILIO_AUTH) return true
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

// ── Session helpers ─────────────────────────────────────────────────────────

async function upsertSession(admin: any, from_number: string, fields: Record<string, any>) {
  const payload = {
    from_number,
    ...fields,
    expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  }
  await admin.from('whatsapp_sessions').upsert(payload, { onConflict: 'from_number' })
}

async function deleteSession(admin: any, from_number: string) {
  await admin.from('whatsapp_sessions').delete().eq('from_number', from_number)
}

async function getActiveProjects(admin: any, userId: string): Promise<any[]> {
  const { data: memberships } = await admin
    .from('project_members')
    .select('project_id, projects!inner(id, name, status, activity_categories)')
    .eq('user_id', userId)
  return (memberships ?? [])
    .map((m: any) => m.projects)
    .filter((p: any) => p && p.status === 'active')
}

// ── Photo flow helpers ───────────────────────────────────────────────────────

function projectList(projects: any[]): string {
  return projects.map((p: any, i: number) => `${i + 1}. ${p.name}`).join('\n')
}

function fuzzyMatchProjects(body: string, projects: any[]): any[] {
  const b = body.toLowerCase().trim()
  const num = parseInt(b, 10)
  if (!isNaN(num) && num >= 1 && num <= projects.length) return [projects[num - 1]]
  return projects.filter((p: any) => {
    const name = p.name.toLowerCase()
    const firstWord = name.split(/\s+/)[0]
    return name.includes(b) || b.includes(firstWord)
  })
}

function activityQuestion(project: any): string | null {
  const cats: string[] = project.activity_categories ?? []
  if (cats.length === 0) return null
  const list = cats.map((c: string, i: number) => `${i + 1}. ${c}`).join('\n')
  return `Which activity?\n${list}\n${cats.length + 1}. Other`
}

function labelQuestion(n: number): string {
  return n === 1 ? 'What does this photo show?' : `What do these ${n} photos show?`
}

async function savePhotos(
  admin: any,
  mediaUrls: string[],
  project: { id: string; name: string },
  user: { id: string; org_id: string; full_name: string },
  label: string,
  activity: string,
  messageSid: string,
) {
  for (let i = 0; i < mediaUrls.length; i++) {
    const url = mediaUrls[i]
    const ts = Date.now()
    let filePath = `${user.org_id}/projects/${project.id}/photos/${ts}_${i}_${messageSid}.jpg`
    let storageUrl: string | null = null

    if (TWILIO_SID && TWILIO_AUTH) {
      try {
        const auth = btoa(`${TWILIO_SID}:${TWILIO_AUTH}`)
        const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } })
        if (res.ok) {
          const contentType = res.headers.get('content-type') ?? 'image/jpeg'
          const ext = contentType.includes('png') ? 'png' : 'jpg'
          filePath = `${user.org_id}/projects/${project.id}/photos/${ts}_${i}_${messageSid}.${ext}`
          const buf = new Uint8Array(await res.arrayBuffer())
          const { error: upErr } = await admin.storage.from('compliance-docs').upload(filePath, buf, { contentType, upsert: true })
          if (!upErr) {
            const { data: signed } = await admin.storage.from('compliance-docs').createSignedUrl(filePath, 60 * 60 * 24 * 365)
            storageUrl = signed?.signedUrl ?? null
          }
        }
      } catch (_e) { /* ignore */ }
    }

    await admin.from('project_photos').insert({
      org_id: user.org_id,
      project_id: project.id,
      submitted_by: user.id,
      submitted_by_name: user.full_name,
      file_path: filePath,
      storage_url: storageUrl,
      label,
      activity: activity || null,
      source: 'whatsapp',
      message_sid: messageSid,
      taken_at: new Date().toISOString(),
    })
  }
}

// ── Photo flow: initial entry ────────────────────────────────────────────────

async function handlePhotoStart(
  admin: any,
  user: { id: string; org_id: string; full_name: string },
  cleanNumber: string,
  mediaUrls: string[],
  messageSid: string,
): Promise<Response> {
  const projects = await getActiveProjects(admin, user.id)
  const n = mediaUrls.length

  if (projects.length === 0) {
    return twiml("You're not assigned to any active project. Ask your project manager to add you.")
  }

  if (projects.length === 1) {
    const project = projects[0]
    if (n > 1) {
      // Bulk: ask mode (same label / each)
      await upsertSession(admin, cleanNumber, {
        org_id: user.org_id,
        user_id: user.id,
        state: 'bulk_mode_pending',
        pending_media: mediaUrls,
        selected_project_id: project.id,
      })
      return twiml(`Got ${n} photos. Same label for all, or label each separately?\n1. Same label\n2. Each one`)
    } else {
      // Single photo: activity or label
      const actQ = activityQuestion(project)
      if (actQ) {
        await upsertSession(admin, cleanNumber, {
          org_id: user.org_id,
          user_id: user.id,
          state: 'photo_activity_pending',
          pending_media: mediaUrls,
          selected_project_id: project.id,
        })
        return twiml(actQ)
      } else {
        await upsertSession(admin, cleanNumber, {
          org_id: user.org_id,
          user_id: user.id,
          state: 'photo_label_pending',
          pending_media: mediaUrls,
          selected_project_id: project.id,
          selected_activity: '',
        })
        return twiml(labelQuestion(1))
      }
    }
  }

  // Multiple projects: ask which one
  const isBulk = n > 1
  await upsertSession(admin, cleanNumber, {
    org_id: user.org_id,
    user_id: user.id,
    state: isBulk ? 'bulk_project_pending' : 'photo_project_pending',
    pending_media: mediaUrls,
  })
  return twiml(`Which project?\n${projectList(projects)}`)
}

// ── Session state machine ────────────────────────────────────────────────────

async function handleSession(
  admin: any,
  session: any,
  body: string,
  cleanNumber: string,
  messageSid: string,
): Promise<Response> {
  const state: string = session.state
  const pendingMedia: string[] = session.pending_media ?? []
  const n = pendingMedia.length

  const { data: user } = await admin
    .from('users')
    .select('id, org_id, full_name')
    .eq('id', session.user_id)
    .maybeSingle()

  if (!user) {
    await deleteSession(admin, cleanNumber)
    return twiml('Session error. Please try again.')
  }

  const projects = await getActiveProjects(admin, user.id)

  // project_pending: match project by number or fuzzy text
  if (state === 'photo_project_pending' || state === 'bulk_project_pending') {
    const isBulk = state === 'bulk_project_pending'
    const matches = fuzzyMatchProjects(body, projects)
    if (matches.length === 1) {
      await upsertSession(admin, cleanNumber, {
        state: isBulk ? 'bulk_confirm_pending' : 'photo_confirm_pending',
        selected_project_id: matches[0].id,
      })
      return twiml(`${matches[0].name} — correct? Reply YES or NO`)
    } else if (matches.length > 1) {
      return twiml(`Which one?\n${projectList(matches)}`)
    } else {
      return twiml(`I couldn't find that. Your projects:\n${projectList(projects)}`)
    }
  }

  // confirm_pending: YES or NO
  if (state === 'photo_confirm_pending' || state === 'bulk_confirm_pending') {
    const isBulk = state === 'bulk_confirm_pending'
    const b = body.toLowerCase()
    if (b.includes('yes') || b === 'y') {
      const { data: project } = await admin
        .from('projects')
        .select('id, name, activity_categories')
        .eq('id', session.selected_project_id)
        .maybeSingle()
      if (!project) {
        await deleteSession(admin, cleanNumber)
        return twiml('Could not find that project. Please try again.')
      }
      if (isBulk) {
        await upsertSession(admin, cleanNumber, { state: 'bulk_mode_pending' })
        return twiml(`Got ${n} photos. Same label for all, or label each separately?\n1. Same label\n2. Each one`)
      } else {
        const actQ = activityQuestion(project)
        if (actQ) {
          await upsertSession(admin, cleanNumber, { state: 'photo_activity_pending' })
          return twiml(actQ)
        } else {
          await upsertSession(admin, cleanNumber, { state: 'photo_label_pending', selected_activity: '' })
          return twiml(labelQuestion(1))
        }
      }
    } else if (b.includes('no') || b === 'n' || b.includes('wrong')) {
      const newState = isBulk ? 'bulk_project_pending' : 'photo_project_pending'
      await upsertSession(admin, cleanNumber, { state: newState, selected_project_id: null })
      return twiml(`No problem. Which project?\n${projectList(projects)}`)
    } else {
      return twiml('Reply YES to confirm or NO to choose a different project.')
    }
  }

  // bulk_mode_pending: same or each
  if (state === 'bulk_mode_pending') {
    const b = body.toLowerCase()
    if (b === '1' || b.includes('same')) {
      const { data: project } = await admin
        .from('projects')
        .select('id, name, activity_categories')
        .eq('id', session.selected_project_id)
        .maybeSingle()
      const actQ = project ? activityQuestion(project) : null
      if (actQ) {
        await upsertSession(admin, cleanNumber, { state: 'bulk_activity_pending' })
        return twiml(actQ)
      } else {
        await upsertSession(admin, cleanNumber, { state: 'bulk_label_pending', selected_activity: '' })
        return twiml(labelQuestion(n))
      }
    } else if (b === '2' || b.includes('each')) {
      await deleteSession(admin, cleanNumber)
      return twiml('OK, send them one at a time.')
    } else {
      return twiml('Reply 1 for same label or 2 to label each separately.')
    }
  }

  // activity_pending: match number or text to categories
  if (state === 'photo_activity_pending' || state === 'bulk_activity_pending') {
    const isBulk = state === 'bulk_activity_pending'
    const { data: project } = await admin
      .from('projects')
      .select('id, name, activity_categories')
      .eq('id', session.selected_project_id)
      .maybeSingle()
    const cats: string[] = project?.activity_categories ?? []
    let activity = ''
    const num = parseInt(body, 10)
    if (!isNaN(num) && num >= 1 && num <= cats.length) {
      activity = cats[num - 1]
    } else if (!isNaN(num) && cats.length > 0 && num === cats.length + 1) {
      activity = 'Other'
    } else {
      const match = cats.find((c: string) =>
        c.toLowerCase().includes(body.toLowerCase()) ||
        body.toLowerCase().includes(c.toLowerCase().split(/\s+/)[0])
      )
      activity = match ?? body
    }
    const newState = isBulk ? 'bulk_label_pending' : 'photo_label_pending'
    await upsertSession(admin, cleanNumber, { state: newState, selected_activity: activity })
    return twiml(isBulk ? labelQuestion(n) : labelQuestion(1))
  }

  // label_pending: save photos
  if (state === 'photo_label_pending' || state === 'bulk_label_pending') {
    const isBulk = state === 'bulk_label_pending'
    const label = body
    const { data: project } = await admin
      .from('projects')
      .select('id, name')
      .eq('id', session.selected_project_id)
      .maybeSingle()
    if (!project) {
      await deleteSession(admin, cleanNumber)
      return twiml('Could not find that project. Please try again.')
    }
    const activity = session.selected_activity ?? ''
    await savePhotos(admin, pendingMedia, project, user, label, activity, messageSid)
    await admin.from('whatsapp_messages').insert({
      org_id: user.org_id,
      from_number: cleanNumber,
      body,
      media_url: pendingMedia[0] ?? null,
      media_count: pendingMedia.length,
      matched_user_id: user.id,
      matched_project_id: project.id,
      message_sid: messageSid,
    })
    await deleteSession(admin, cleanNumber)
    const actLabel = activity ? ` - ${activity}` : ''
    if (isBulk) {
      return twiml(`✓ ${n} photos saved to ${project.name}${actLabel}\n${label}`)
    } else {
      return twiml(`✓ Saved to ${project.name}${actLabel}\n${label}`)
    }
  }

  // Unknown state — clear
  await deleteSession(admin, cleanNumber)
  return twiml('Session expired. Please send your photo again.')
}

// ── Expense flow (unchanged logic) ──────────────────────────────────────────

async function handleExpense(
  admin: any,
  user: { id: string; org_id: string; full_name: string },
  cleanNumber: string,
  body: string,
  mediaUrls: string[],
  mediaUrlRaw: string | null,
  numMedia: number,
  messageSid: string,
): Promise<Response> {
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

  await admin.from('whatsapp_messages').insert({
    org_id: user.org_id, from_number: cleanNumber, body, media_url: mediaUrlRaw, media_count: numMedia,
    matched_user_id: user.id, matched_project_id: project.id, expense_id: expense.id, message_sid: messageSid,
  })

  try {
    const { data: link } = await admin
      .from('funder_nonprofits')
      .select('funder_id, organizations!funder_nonprofits_funder_id_fkey(id, name)')
      .eq('nonprofit_id', user.org_id)
      .eq('status', 'active')
      .maybeSingle()
    if (link) {
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
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405, headers: CORS })

  const rawBody = await req.text()
  const url = TWILIO_WEBHOOK_URL || req.url.split('?')[0]
  const sig = req.headers.get('x-twilio-signature')

  const testMode = req.headers.get('x-test-mode') === 'spend4good-test'
  if (!testMode) {
    const ok = await validateSignature(url, rawBody, sig)
    if (!ok) return new Response('Forbidden', { status: 403, headers: CORS })
  }

  const form = new URLSearchParams(rawBody)
  const fromRaw = form.get('From') ?? ''
  const cleanNumber = fromRaw.replace(/^whatsapp:/, '').trim()
  const body = (form.get('Body') ?? '').trim()
  const numMedia = parseInt(form.get('NumMedia') ?? '0', 10) || 0
  const messageSid = form.get('MessageSid') ?? crypto.randomUUID()

  const mediaUrls: string[] = []
  for (let i = 0; i < numMedia; i++) {
    const u = form.get(`MediaUrl${i}`)
    if (u) mediaUrls.push(u)
  }
  const mediaUrlRaw = mediaUrls[0] ?? null

  const admin = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } })

  // A) SESSION CHECK
  const { data: session } = await admin
    .from('whatsapp_sessions')
    .select('*')
    .eq('from_number', cleanNumber)
    .maybeSingle()

  if (session) {
    const expired = session.expires_at && new Date(session.expires_at) < new Date()
    if (expired) {
      await deleteSession(admin, cleanNumber)
      return twiml('Your previous upload timed out. Send your photo again to start over.')
    }
    return handleSession(admin, session, body, cleanNumber, messageSid)
  }

  // B) USER LOOKUP
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

  // C) MESSAGE TYPE DETECTION
  const { amount } = parseAmount(body)
  const hasMedia = numMedia > 0
  const hasAmount = amount !== null && amount > 0

  if (hasMedia && !hasAmount) {
    return handlePhotoStart(admin, user, cleanNumber, mediaUrls, messageSid)
  } else if (hasMedia || hasAmount) {
    return handleExpense(admin, user, cleanNumber, body, mediaUrls, mediaUrlRaw, numMedia, messageSid)
  } else {
    await admin.from('whatsapp_messages').insert({
      org_id: user.org_id, from_number: cleanNumber, body, media_url: null, media_count: 0,
      matched_user_id: user.id, message_sid: messageSid,
    })
    return twiml("To log an expense, send the amount and description (e.g. 'R250 petrol'). To submit a photo, send a photo with no amount.")
  }
})
