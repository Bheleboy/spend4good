const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), {
  status: s, headers: { ...CORS, 'Content-Type': 'application/json' },
})

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const body = await req.json().catch(() => null) as
    | { to_number: string; agent_name: string; project_name: string; org_name: string; manager_name: string }
    | null
  if (!body?.to_number || !body?.agent_name || !body?.project_name) {
    return json({ error: 'Missing required fields' }, 400)
  }

  const SID = Deno.env.get('TWILIO_ACCOUNT_SID')
  const TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
  const FROM = Deno.env.get('TWILIO_WHATSAPP_FROM')
  if (!SID || !TOKEN || !FROM) return json({ error: 'Twilio not configured' }, 500)

  const text =
`Hi ${body.agent_name}, you have been added to ${body.project_name} by ${body.org_name}.

To submit photos and expenses, save this number and send a message:
+16626414965

No app needed. Just WhatsApp.

Your manager: ${body.manager_name}`

  const to = body.to_number.startsWith('whatsapp:') ? body.to_number : `whatsapp:${body.to_number}`
  const from = FROM.startsWith('whatsapp:') ? FROM : `whatsapp:${FROM}`

  const form = new URLSearchParams({ To: to, From: from, Body: text })
  const url = `https://api.twilio.com/2010-04-01/Accounts/${SID}/Messages.json`
  const auth = btoa(`${SID}:${TOKEN}`)

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: form.toString(),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('Twilio error', res.status, data)
    return json({ ok: false, error: (data as any)?.message ?? 'Twilio send failed', status: res.status }, 502)
  }
  return json({ ok: true, sid: (data as any)?.sid })
})
