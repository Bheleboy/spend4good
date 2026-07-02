import { CORS_HEADERS, sendEmail, shell, button, logEmail, getAdmin, json } from '../_shared/email.ts'

interface Body {
  nonprofit_name: string
  nonprofit_email: string
  funder_org_name: string
  invite_token: string
  org_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.nonprofit_email || !body.invite_token || !body.funder_org_name || !body.nonprofit_name) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const inviteUrl = `https://spend4good.com/onboarding?type=invited&token=${encodeURIComponent(body.invite_token)}`
  const subject = `${body.funder_org_name} has invited your organisation to Spend4Good`
  const html = shell(`
    <tr><td style="padding:8px 32px 0;">
      <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;">You're invited to Spend4Good</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">
        <strong style="color:#f5f5f5;">${body.funder_org_name}</strong> uses Spend4Good to manage nonprofit partnerships transparently.
        They've invited <strong style="color:#f5f5f5;">${body.nonprofit_name}</strong> to join.
      </p>
      <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c5c5c5;">
        Track spend, stay compliant, and build funder trust — all in one platform.
      </p>
      <p style="margin:0 0 20px;">${button('Accept Invite & Set Up Your Account', inviteUrl)}</p>
      <p style="margin:0 0 8px;font-size:13px;line-height:20px;color:#888888;">
        This invite expires in 14 days. You will not be charged — your account is fully funded by ${body.funder_org_name}.
      </p>
    </td></tr>
  `)

  const admin = await getAdmin()
  const result = await sendEmail({ to: body.nonprofit_email, subject, html })
  await logEmail(admin, {
    org_id: body.org_id ?? null,
    recipient_email: body.nonprofit_email,
    email_type: 'invite',
    resend_id: result.id ?? null,
    status: result.ok ? 'sent' : 'failed',
    error_details: result.error ?? null,
  })

  return result.ok ? json({ ok: true, id: result.id }) : json({ ok: false, error: result.error }, 502)
})
