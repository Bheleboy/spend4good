// Paddle webhook receiver
// Verifies Paddle-Signature header (HMAC-SHA256), handles subscription + transaction events,
// and triggers the send-payment-confirmation email on transaction.completed.

import { CORS_HEADERS, json } from '../_shared/email.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'

async function verifySignature(rawBody: string, header: string | null, secret: string): Promise<boolean> {
  if (!header) return false
  // Paddle format: "ts=1700000000;h1=<hex>"
  const parts = Object.fromEntries(
    header.split(';').map((kv) => kv.split('=').map((s) => s.trim())),
  ) as Record<string, string>
  const ts = parts['ts']
  const h1 = parts['h1']
  if (!ts || !h1) return false

  const signed = `${ts}:${rawBody}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signed))
  const hex = Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
  // constant-time compare
  if (hex.length !== h1.length) return false
  let diff = 0
  for (let i = 0; i < hex.length; i++) diff |= hex.charCodeAt(i) ^ h1.charCodeAt(i)
  return diff === 0
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS_HEADERS })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const secret = Deno.env.get('PADDLE_WEBHOOK_SECRET') ?? ''
  const admin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  )

  const rawBody = await req.text()
  const sigHeader = req.headers.get('paddle-signature') ?? req.headers.get('Paddle-Signature')

  let verified = false
  try {
    verified = secret ? await verifySignature(rawBody, sigHeader, secret) : false
  } catch (e) {
    console.error('sig verify error', e)
  }

  if (!verified) {
    // Always return 200 to Paddle but log & bail
    console.warn('Invalid Paddle signature; dropping event')
    return new Response('ok', { status: 200 })
  }

  let event: any
  try { event = JSON.parse(rawBody) } catch { return new Response('ok', { status: 200 }) }

  const eventType: string = event?.event_type ?? 'unknown'
  const eventId: string = event?.event_id ?? crypto.randomUUID()

  // Log the event (best-effort)
  try {
    await admin.from('paddle_webhook_events').insert({
      id: eventId,
      event_type: eventType,
      payload: event,
    })
  } catch (e) {
    console.warn('webhook log insert failed', e)
  }

  try {
    const data = event?.data ?? {}
    const customData = data?.custom_data ?? {}
    const orgId: string | undefined = customData?.org_id
    const planId: string | undefined = customData?.plan_id

    if (eventType === 'subscription.activated' && orgId) {
      await admin.from('organizations').update({
        subscription_status: 'active',
        subscription_plan: planId ?? undefined,
        paddle_subscription_id: data.id,
        paddle_customer_id: data.customer_id,
      }).eq('id', orgId)
    } else if (eventType === 'subscription.canceled' && orgId) {
      await admin.from('organizations').update({ subscription_status: 'canceled' }).eq('id', orgId)
    } else if (
      (eventType === 'subscription.payment_failed' || eventType === 'transaction.payment_failed') && orgId
    ) {
      await admin.from('organizations').update({ subscription_status: 'past_due' }).eq('id', orgId)
    } else if (eventType === 'transaction.completed' && orgId) {
      // Look up billing details & org, then fire payment confirmation email
      const { data: billing } = await admin
        .from('billing_details')
        .select('*')
        .eq('org_id', orgId)
        .maybeSingle()

      const { data: org } = await admin
        .from('organizations')
        .select('name, subscription_plan')
        .eq('id', orgId)
        .maybeSingle()

      if (billing && org) {
        await admin.functions.invoke('send-payment-confirmation', {
          body: {
            org_id: orgId,
            plan_name: org.subscription_plan ?? planId ?? 'Subscription',
            amount: data?.details?.totals?.total ?? 0,
            currency: data?.currency_code ?? 'USD',
            paddle_transaction_id: data.id,
            billing_email: billing.billing_email,
            billing_name: billing.legal_name,
            signatory_name: billing.signatory_name,
            signatory_title: billing.signatory_title,
            legal_name: billing.legal_name,
            address_line1: billing.address_line1,
            city: billing.city,
            postal_code: billing.postal_code,
            country: billing.country,
            vat_number: billing.vat_number,
          },
        }).catch(() => null)
      }
    }
  } catch (e) {
    console.error('event handler error', e)
  }

  // Always 200
  return new Response('ok', { status: 200 })
})
