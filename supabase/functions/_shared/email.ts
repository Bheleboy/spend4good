// Shared helpers for Spend4Good edge-function emails.
// deno-lint-ignore-file no-explicit-any

export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cron-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const FROM = 'Spend4Good <noreply@spend4good.com>'
const REPLY_TO = 'hello@spend4good.com'

export type EmailType =
  | 'invite'
  | 'welcome_nonprofit'
  | 'welcome_funder'
  | 'expense_notification'
  | 'deadline_reminder'
  | 'password_reset'
  | 'confirm_signup'
  | 'payment_confirmation'
  | 'admin_new_npo'

export function shell(innerHtml: string): string {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#f5f5f5;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:32px 16px;">
<tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background:#111111;border:1px solid #1f1f1f;border-radius:16px;overflow:hidden;">
<tr><td style="padding:32px 32px 8px;">
<div style="display:inline-block;width:36px;height:36px;background:#f5f5f5;color:#0a0a0a;font-weight:900;font-size:14px;border-radius:8px;text-align:center;line-height:36px;">S4G</div>
</td></tr>
${innerHtml}
<tr><td style="padding:24px 32px 32px;border-top:1px solid #1f1f1f;color:#666666;font-size:12px;line-height:18px;text-align:center;">
Spend4Good · <a href="https://spend4good.com" style="color:#888888;text-decoration:none;">spend4good.com</a> · noreply@spend4good.com
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

export function button(label: string, href: string): string {
  return `<a href="${href}" style="display:inline-block;background:#ffffff;color:#0a0a0a;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;">${label}</a>`
}

export async function sendEmail(params: {
  to: string
  subject: string
  html: string
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) return { ok: false, error: 'RESEND_API_KEY not configured' }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        reply_to: REPLY_TO,
        to: [params.to],
        subject: params.subject,
        html: params.html,
      }),
    })
    const body = await res.json().catch(() => ({}))
    if (!res.ok) {
      return { ok: false, error: `Resend ${res.status}: ${JSON.stringify(body)}` }
    }
    return { ok: true, id: (body as any).id }
  } catch (err) {
    return { ok: false, error: (err as Error).message }
  }
}

export async function logEmail(supabaseAdmin: any, row: {
  org_id?: string | null
  recipient_email: string
  email_type: EmailType
  resend_id?: string | null
  status: 'sent' | 'failed' | 'bounced'
  error_details?: string | null
}) {
  try {
    await supabaseAdmin.from('email_logs').insert(row)
  } catch {
    // silently discard — never let logging block a send
  }
}

export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

export function getAdmin() {
  // Lazy import to keep cold start small
  return import('https://esm.sh/@supabase/supabase-js@2.45.0').then(({ createClient }) =>
    createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
      { auth: { persistSession: false } },
    ),
  )
}
