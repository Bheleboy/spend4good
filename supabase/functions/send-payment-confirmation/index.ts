import { CORS_HEADERS, sendEmail, shell, button, logEmail, getAdmin, json } from '../_shared/email.ts'

interface Body {
  org_id: string
  plan_name: string
  amount: number
  currency: string
  paddle_transaction_id: string
  billing_email: string
  billing_name: string
  signatory_name: string
  signatory_title: string
  legal_name: string
  address_line1: string
  city: string
  postal_code: string
  country: string
  vat_number?: string | null
}

function formatDate(d: Date): string {
  const months = ['January','February','March','April','May','June','July','August','September','October','November','December']
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
}

function formatAmount(amount: number, currency: string): string {
  // Paddle sends totals in the minor unit (cents) as a string/number
  const value = Number(amount) / 100
  try {
    return new Intl.NumberFormat('en', { style: 'currency', currency }).format(value)
  } catch {
    return `${currency} ${value.toFixed(2)}`
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.billing_email || !body.org_id || !body.plan_name) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const subject = `Payment confirmation — Spend4Good ${body.plan_name}`
  const amountStr = formatAmount(body.amount, body.currency)
  const dateStr = formatDate(new Date())

  const row = (label: string, value: string, last = false) => `
    <tr><td style="padding:10px 16px;${last ? '' : 'border-bottom:1px solid #1f1f1f;'}font-size:13px;">
      <span style="color:#888;">${label}</span>
      <span style="float:right;color:#f5f5f5;font-weight:600;">${value}</span>
    </td></tr>`

  const html = shell(`
    <tr><td style="padding:8px 32px 0;">
      <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;color:#f5f5f5;">Thank you for your payment</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#c5c5c5;">
        Your Spend4Good <strong style="color:#f5f5f5;">${body.plan_name}</strong> subscription is now active.
      </p>

      <p style="margin:20px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Payment summary</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border:1px solid #1f1f1f;border-radius:12px;">
        ${row('Amount', amountStr)}
        ${row('Plan', body.plan_name)}
        ${row('Transaction ID', body.paddle_transaction_id)}
        ${row('Date', dateStr, true)}
      </table>

      <p style="margin:20px 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;color:#888;">Billing details</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 20px;border:1px solid #1f1f1f;border-radius:12px;">
        ${row('Organisation', body.legal_name)}
        ${row('Address', `${body.address_line1}, ${body.city}, ${body.postal_code}, ${body.country}`)}
        ${row('VAT Number', body.vat_number || 'Not provided')}
        ${row('Authorised by', `${body.signatory_name} — ${body.signatory_title}`, true)}
      </table>

      <p style="margin:0 0 20px;font-size:12px;line-height:18px;color:#666;">
        This is a payment confirmation from Spend4Good (operated by Private Clients Advisory). Your official VAT receipt has been sent separately by Paddle to ${body.billing_email}. Retain both documents for your financial records.
      </p>

      <p style="margin:0 0 8px;">${button('Go to your dashboard', 'https://spend4good.com/dashboard')}</p>
    </td></tr>
  `)

  const admin = await getAdmin()
  const result = await sendEmail({ to: body.billing_email, subject, html })
  await logEmail(admin, {
    org_id: body.org_id,
    recipient_email: body.billing_email,
    email_type: 'payment_confirmation' as any,
    resend_id: result.id ?? null,
    status: result.ok ? 'sent' : 'failed',
    error_details: result.error ?? null,
  })

  return json({ ok: result.ok, id: result.id, error: result.error })
})
