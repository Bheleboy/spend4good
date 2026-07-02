import { CORS_HEADERS, sendEmail, shell, button, logEmail, getAdmin, json } from '../_shared/email.ts'

interface Body {
  funder_email: string
  funder_name: string
  nonprofit_org_name: string
  expense_amount: number
  expense_currency: string
  expense_description: string
  project_name: string
  submitted_by_name: string
  expense_id: string
  org_id?: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = (await req.json().catch(() => null)) as Body | null
  if (!body?.funder_email || !body.expense_id) return json({ error: 'Missing required fields' }, 400)

  const amount = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: body.expense_currency || 'USD',
  }).format(body.expense_amount)

  const subject = `New expense submitted by ${body.nonprofit_org_name}`
  const reviewUrl = `https://spend4good.com/expenses?highlight=${encodeURIComponent(body.expense_id)}`

  const html = shell(`
    <tr><td style="padding:8px 32px 0;">
      <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;">New expense to review</h1>
      <p style="margin:0 0 20px;font-size:15px;line-height:22px;color:#c5c5c5;">
        ${body.submitted_by_name} at <strong style="color:#f5f5f5;">${body.nonprofit_org_name}</strong> submitted an expense for review.
      </p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;margin:0 0 24px;border:1px solid #1f1f1f;border-radius:12px;background:#0a0a0a;">
        <tr><td style="padding:16px;border-bottom:1px solid #1f1f1f;">
          <div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Amount</div>
          <div style="color:#f5f5f5;font-size:24px;font-weight:800;margin-top:4px;">${amount}</div>
        </td></tr>
        <tr><td style="padding:16px;border-bottom:1px solid #1f1f1f;">
          <div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Project</div>
          <div style="color:#f5f5f5;font-size:15px;margin-top:4px;">${body.project_name}</div>
        </td></tr>
        <tr><td style="padding:16px;">
          <div style="color:#888;font-size:12px;text-transform:uppercase;letter-spacing:0.06em;">Description</div>
          <div style="color:#f5f5f5;font-size:15px;margin-top:4px;">${body.expense_description}</div>
        </td></tr>
      </table>
      <p style="margin:0 0 8px;">${button('Review Expense', reviewUrl)}</p>
    </td></tr>
  `)

  const admin = await getAdmin()
  const result = await sendEmail({ to: body.funder_email, subject, html })
  await logEmail(admin, {
    org_id: body.org_id ?? null,
    recipient_email: body.funder_email,
    email_type: 'expense_notification',
    resend_id: result.id ?? null,
    status: result.ok ? 'sent' : 'failed',
    error_details: result.error ?? null,
  })

  return result.ok ? json({ ok: true, id: result.id }) : json({ ok: false, error: result.error }, 502)
})
