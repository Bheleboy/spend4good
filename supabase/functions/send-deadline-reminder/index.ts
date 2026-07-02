import { CORS_HEADERS, sendEmail, shell, button, logEmail, getAdmin, json } from '../_shared/email.ts'

// Called by pg_cron daily at 06:00 UTC. Auth via X-Cron-Secret header.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = req.headers.get('x-cron-secret')
  if (!secret || secret !== Deno.env.get('CRON_SECRET')) {
    return json({ error: 'Unauthorized' }, 401)
  }

  const admin = await getAdmin()

  // Deadlines due in exactly 30, 14, or 7 days
  const { data: deadlines, error } = await admin
    .from('compliance_deadlines')
    .select('id, org_id, deadline_type, due_date, status')
    .in('status', ['not_started', 'in_progress'])
    .in(
      'due_date',
      [30, 14, 7].map((d) => {
        const dt = new Date()
        dt.setUTCDate(dt.getUTCDate() + d)
        return dt.toISOString().slice(0, 10)
      }),
    )

  if (error) return json({ error: error.message }, 500)

  const results: Array<{ id: string; ok: boolean; error?: string }> = []

  for (const dl of deadlines ?? []) {
    // Look up org name + admin email
    const { data: org } = await admin.from('organizations').select('name').eq('id', dl.org_id).single()
    const { data: adminUser } = await admin
      .from('users')
      .select('email, full_name')
      .eq('org_id', dl.org_id)
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (!adminUser?.email || !org?.name) {
      results.push({ id: dl.id, ok: false, error: 'no admin or org' })
      continue
    }

    const dueDate = new Date(dl.due_date as string)
    const daysUntil = Math.round((dueDate.getTime() - Date.now()) / 86400000)
    const subject = `Reminder: ${dl.deadline_type} due in ${daysUntil} days — ${org.name}`

    const html = shell(`
      <tr><td style="padding:8px 32px 0;">
        <h1 style="margin:16px 0 8px;font-size:22px;font-weight:800;">Compliance deadline reminder</h1>
        <p style="margin:0 0 16px;font-size:15px;line-height:22px;color:#c5c5c5;">
          This is a reminder that <strong style="color:#f5f5f5;">${dl.deadline_type}</strong> is due on
          <strong style="color:#f5f5f5;">${dueDate.toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>.
        </p>
        <p style="margin:0 0 24px;font-size:15px;line-height:22px;color:#c5c5c5;">
          Log in to your Spend4Good dashboard to update the status or generate your report.
        </p>
        <p style="margin:0 0 8px;">${button('View Compliance Calendar', 'https://spend4good.com/compliance/calendar')}</p>
      </td></tr>
    `)

    const result = await sendEmail({ to: adminUser.email, subject, html })
    await logEmail(admin, {
      org_id: dl.org_id,
      recipient_email: adminUser.email,
      email_type: 'deadline_reminder',
      resend_id: result.id ?? null,
      status: result.ok ? 'sent' : 'failed',
      error_details: result.error ?? null,
    })
    results.push({ id: dl.id, ok: result.ok, error: result.error })
  }

  return json({ ok: true, processed: results.length, results })
})
