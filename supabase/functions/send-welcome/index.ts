import { CORS_HEADERS, sendEmail, shell, button, logEmail, getAdmin, json } from '../_shared/email.ts'

interface Body {
  full_name: string
  email: string
  org_name: string
  account_type: 'nonprofit' | 'funder'
  invited_by?: string
  org_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.email || !body.full_name || !body.org_name || !body.account_type) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const subject = `Welcome to Spend4Good, ${body.org_name}`

  async function sendAndLog(email_type: 'welcome_nonprofit' | 'welcome_funder', html: string) {
    const admin = await getAdmin()
    const result = await sendEmail({ to: body!.email, subject, html })
    await logEmail(admin, {
      org_id: body!.org_id ?? null,
      recipient_email: body!.email,
      email_type,
      resend_id: result.id ?? null,
      status: result.ok ? 'sent' : 'failed',
      error_details: result.error ?? null,
    })
    if (!result.ok) throw new Error(result.error)
  }

  if (body.account_type === 'nonprofit') {
    const relationship = body.invited_by
      ? `<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">You've been connected to <strong style="color:#f5f5f5;">${body.invited_by}</strong> on Spend4Good. They can now view your projects and expenses.</p>`
      : `<p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">Your 14-day free trial starts now.</p>`
    const html = shell(`
      <tr><td style="padding:8px 32px 0;">
        <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;">Welcome, ${body.full_name}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">Your account for ${body.org_name} is ready.</p>
        ${relationship}
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 24px;border:1px solid #1f1f1f;border-radius:12px;">
          <tr><td style="padding:14px 16px;border-bottom:1px solid #1f1f1f;color:#f5f5f5;font-size:14px;"><span style="color:#888;">1.</span>&nbsp;&nbsp;Complete your compliance profile</td></tr>
          <tr><td style="padding:14px 16px;border-bottom:1px solid #1f1f1f;color:#f5f5f5;font-size:14px;"><span style="color:#888;">2.</span>&nbsp;&nbsp;Add your first project</td></tr>
          <tr><td style="padding:14px 16px;color:#f5f5f5;font-size:14px;"><span style="color:#888;">3.</span>&nbsp;&nbsp;Submit your first expense via WhatsApp</td></tr>
        </table>
        <p style="margin:0 0 8px;">${button('Go to my dashboard', 'https://spend4good.com/dashboard')}</p>
      </td></tr>
    `)
    await sendAndLog('welcome_nonprofit', html)
  } else {
    const html = shell(`
      <tr><td style="padding:8px 32px 0;">
        <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;">Welcome, ${body.full_name}</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">Your funder account for ${body.org_name} is ready.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:16px 0 24px;border:1px solid #1f1f1f;border-radius:12px;">
          <tr><td style="padding:14px 16px;border-bottom:1px solid #1f1f1f;color:#f5f5f5;font-size:14px;"><span style="color:#888;">1.</span>&nbsp;&nbsp;Invite your nonprofits (each pays nothing)</td></tr>
          <tr><td style="padding:14px 16px;border-bottom:1px solid #1f1f1f;color:#f5f5f5;font-size:14px;"><span style="color:#888;">2.</span>&nbsp;&nbsp;Review their spend in real time</td></tr>
          <tr><td style="padding:14px 16px;color:#f5f5f5;font-size:14px;"><span style="color:#888;">3.</span>&nbsp;&nbsp;See their compliance status at a glance</td></tr>
        </table>
        <p style="margin:0 0 8px;">${button('Invite my first nonprofit', 'https://spend4good.com/funder/invite')}</p>
      </td></tr>
    `)
    await sendAndLog('welcome_funder', html)
  }

  return json({ ok: true })
})
