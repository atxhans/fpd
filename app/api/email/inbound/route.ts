import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendServiceRequestConfirmation,
  sendUnmatchedInboundReply,
} from '@/lib/email/service-requests'

// Resend inbound email payload shape
interface ResendInboundPayload {
  from: string
  to: string[]
  subject: string
  text?: string
  html?: string
  headers?: Record<string, string>
  messageId?: string
}

function extractEmail(from: string): string {
  // "John Smith <john@example.com>" → "john@example.com"
  const match = from.match(/<([^>]+)>/)
  return match ? match[1].toLowerCase() : from.toLowerCase().trim()
}

function extractName(from: string): string | null {
  const match = from.match(/^([^<]+)</)
  return match ? match[1].trim() : null
}

export async function POST(req: NextRequest) {
  // --- Verify Resend webhook signature ---
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('RESEND_WEBHOOK_SECRET not set')
    return NextResponse.json({ error: 'Webhook secret not configured' }, { status: 500 })
  }

  const svix = new Webhook(secret)
  const body = await req.text()

  try {
    svix.verify(body, {
      'svix-id':        req.headers.get('svix-id') ?? '',
      'svix-timestamp': req.headers.get('svix-timestamp') ?? '',
      'svix-signature': req.headers.get('svix-signature') ?? '',
    })
  } catch {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 })
  }

  const payload = JSON.parse(body) as ResendInboundPayload
  const supabase = await createAdminClient()

  const contactEmail = extractEmail(payload.from)
  const contactName  = extractName(payload.from)
  const subject      = payload.subject ?? '(no subject)'
  const description  = payload.text?.slice(0, 2000) ?? payload.html?.replace(/<[^>]+>/g, '').slice(0, 2000) ?? ''
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.fieldpiecedigital.com'

  // --- Try to match sender to an existing customer ---
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, tenant_id')
    .eq('email', contactEmail)
    .is('deleted_at', null)
    .limit(1)
    .single()

  // --- Create the service request row ---
  const { data: sr, error: srError } = await supabase
    .from('service_requests')
    .insert({
      tenant_id:     customer?.tenant_id ?? null,
      customer_id:   customer?.id ?? null,
      source:        'email',
      contact_name:  contactName ?? customer?.name ?? null,
      contact_email: contactEmail,
      subject,
      description,
      status:        'new',
      raw_payload:   payload as unknown as import('@/types/database').Json,
    })
    .select('id')
    .single()

  if (srError || !sr) {
    console.error('Failed to create service request:', srError)
    return NextResponse.json({ error: 'Failed to create service request' }, { status: 500 })
  }

  // --- Send appropriate auto-response ---
  if (customer) {
    // Known customer — confirm receipt
    await sendServiceRequestConfirmation({
      to:           contactEmail,
      customerName: customer.name,
      requestId:    sr.id,
      description,
    })

    // Mark auto-response sent
    await supabase
      .from('service_requests')
      .update({ status: 'acknowledged', auto_response_sent_at: new Date().toISOString() })
      .eq('id', sr.id)
  } else {
    // Unknown sender — send signup link
    const signupUrl = `${appUrl}/request-service?ref=${sr.id}`
    await sendUnmatchedInboundReply({ to: contactEmail, signupUrl, description })

    await supabase
      .from('service_requests')
      .update({ auto_response_sent_at: new Date().toISOString() })
      .eq('id', sr.id)
  }

  return NextResponse.json({ received: true, id: sr.id })
}
