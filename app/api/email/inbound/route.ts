import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { createAdminClient } from '@/lib/supabase/server'
import {
  sendServiceRequestConfirmation,
  sendUnmatchedInboundReply,
} from '@/lib/email/service-requests'

// Resend inbound email webhook payload shape
// Resend wraps the email fields inside a `data` object
interface ResendInboundPayload {
  type: string
  created_at: string
  data: {
    from: string
    to: string[]
    subject: string
    text?: string
    html?: string
    headers?: Record<string, string>
    messageId?: string
  }
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
  const email    = payload.data
  const supabase = await createAdminClient()

  if (!email?.from) {
    console.error('Inbound webhook missing data.from — raw payload:', body.slice(0, 500))
    return NextResponse.json({ error: 'Unexpected payload shape' }, { status: 400 })
  }

  const contactEmail = extractEmail(email.from)
  const contactName  = extractName(email.from)
  const subject      = email.subject ?? '(no subject)'
  const description  = email.text?.slice(0, 2000) ?? email.html?.replace(/<[^>]+>/g, '').slice(0, 2000) ?? ''
  const appUrl       = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.fieldpiecedigital.com'

  // --- Resolve tenant from the `to` address (e.g. abc-hvac@inbound.fieldpiecedigital.com) ---
  let tenantFromAddress: { id: string; name: string; slug: string } | null = null
  const toAddress = Array.isArray(email.to) ? email.to[0] : email.to
  if (toAddress) {
    const localPart = toAddress.split('@')[0]?.toLowerCase()
    if (localPart) {
      const { data: t } = await supabase
        .from('tenants')
        .select('id, name, slug')
        .eq('slug', localPart)
        .eq('status', 'active')
        .single()
      tenantFromAddress = t ?? null
    }
  }

  // --- Try to match sender to an existing customer ---
  let customerQuery = supabase
    .from('customers')
    .select('id, name, tenant_id')
    .eq('email', contactEmail)
    .is('deleted_at', null)
    .limit(1)

  if (tenantFromAddress) customerQuery = customerQuery.eq('tenant_id', tenantFromAddress.id)

  const { data: customer } = await customerQuery.single()

  // Resolved tenant: address slug > customer's tenant > null
  const resolvedTenantId = tenantFromAddress?.id ?? customer?.tenant_id ?? null
  const resolvedSlug     = tenantFromAddress?.slug ?? null

  // --- Create the service request row ---
  const { data: sr, error: srError } = await supabase
    .from('service_requests')
    .insert({
      tenant_id:     resolvedTenantId,
      customer_id:   customer?.id ?? null,
      source:        'email',
      contact_name:  contactName ?? customer?.name ?? null,
      contact_email: contactEmail,
      subject,
      description,
      status:        'new',
      raw_payload:   email as unknown as import('@/types/database').Json,
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
      tenantId:     customer.tenant_id,
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
    // Unknown sender — send link to per-tenant form if slug known, else generic form
    const formBase = resolvedSlug
      ? `${appUrl}/request-service/${resolvedSlug}`
      : `${appUrl}/request-service`
    const signupUrl = `${formBase}?ref=${sr.id}`
    await sendUnmatchedInboundReply({ to: contactEmail, tenantId: resolvedTenantId, signupUrl, description })

    await supabase
      .from('service_requests')
      .update({ auto_response_sent_at: new Date().toISOString() })
      .eq('id', sr.id)
  }

  return NextResponse.json({ received: true, id: sr.id })
}
