import { CORS_HEADERS, sendEmail, shell, json } from '../_shared/email.ts'

interface Body {
  org_name: string
  npo_number?: string
  pbo_number?: string
  email: string
  country?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.org_name || !body.email) return json({ error: 'Missing fields' }, 400)

  const subject = `New unverified NPO signup: ${body.org_name}`
  const html = shell(`
    <tr><td style="padding:8px 32px 0;">
      <h1 style="margin:16px 0 8px;font-size:20px;font-weight:800;color:#f5f5f5;">New NPO signup requires verification</h1>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:12px 0 16px;border:1px solid #1f1f1f;border-radius:12px;">
        <tr><td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#c5c5c5;">Organisation<span style="float:right;color:#f5f5f5;font-weight:600;">${body.org_name}</span></td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#c5c5c5;">NPO Number<span style="float:right;color:#f5f5f5;">${body.npo_number || '—'}</span></td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#c5c5c5;">PBO Number<span style="float:right;color:#f5f5f5;">${body.pbo_number || '—'}</span></td></tr>
        <tr><td style="padding:10px 16px;border-bottom:1px solid #1f1f1f;font-size:13px;color:#c5c5c5;">Email<span style="float:right;color:#f5f5f5;">${body.email}</span></td></tr>
        <tr><td style="padding:10px 16px;font-size:13px;color:#c5c5c5;">Country<span style="float:right;color:#f5f5f5;">${body.country || '—'}</span></td></tr>
      </table>
      <p style="margin:12px 0 0;font-size:13px;color:#888;line-height:20px;">
        Log in to the backend to set <code style="color:#f5f5f5;">is_verified = true</code> on the organisation once confirmed at <a href="https://npo.gov.za" style="color:#c5c5c5;">npo.gov.za</a>.
      </p>
    </td></tr>
  `)

  const result = await sendEmail({ to: 'hello@spend4good.com', subject, html })
  return json({ ok: result.ok, error: result.error })
})
