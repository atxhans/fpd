import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendServiceRequestConfirmation } from '@/lib/email/service-requests'
import { writeAudit } from '@/lib/audit'

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().min(7),
  address:     z.string().min(5),
  description: z.string().min(10),
  requestId:   z.string().uuid().nullable().optional(),
  tenantId:    z.string().uuid().nullable().optional(),
  website:     z.string().max(0).optional(), // honeypot
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  // Honeypot check
  if (body.website) {
    return NextResponse.json({ ok: true }) // silently accept but ignore
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation failed', issues: parsed.error.issues }, { status: 422 })
  }

  const { name, email, phone, address, description, requestId, tenantId: explicitTenantId } = parsed.data
  const supabase = await createAdminClient()

  // Try to match customer by email — scoped to the tenant if one is known
  let customerQuery = supabase
    .from('customers')
    .select('id, name, tenant_id')
    .eq('email', email)
    .is('deleted_at', null)
    .limit(1)

  if (explicitTenantId) customerQuery = customerQuery.eq('tenant_id', explicitTenantId)

  const { data: customer } = await customerQuery.single()

  // Resolved tenant: explicit > customer's tenant > null
  const resolvedTenantId = explicitTenantId ?? customer?.tenant_id ?? null

  if (requestId) {
    // Verify the request belongs to this email before allowing update (prevent IDOR)
    const { data: existingRequest } = await supabase
      .from('service_requests')
      .select('id, contact_email')
      .eq('id', requestId)
      .eq('status', 'new')
      .single()

    if (!existingRequest || existingRequest.contact_email !== email) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Update existing service_request (from inbound email ref)
    const { error } = await supabase
      .from('service_requests')
      .update({
        contact_name:  name,
        contact_phone: phone,
        address,
        description,
        tenant_id:     resolvedTenantId,
        customer_id:   customer?.id ?? null,
        status:        'acknowledged',
        auto_response_sent_at: new Date().toISOString(),
      })
      .eq('id', requestId)
      .eq('status', 'new') // only update if still unprocessed

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  } else {
    // Create a new service_request from the web form
    const { error } = await supabase
      .from('service_requests')
      .insert({
        source:        'web_form',
        contact_name:  name,
        contact_email: email,
        contact_phone: phone,
        address,
        description,
        tenant_id:     resolvedTenantId,
        customer_id:   customer?.id ?? null,
        status:        'acknowledged',
        auto_response_sent_at: new Date().toISOString(),
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
  }

  // Send confirmation email
  await sendServiceRequestConfirmation({
    to:           email,
    tenantId:     resolvedTenantId,
    customerName: customer?.name ?? name,
    requestId:    requestId ?? 'NEW',
    description,
  }).catch(err => console.error('Failed to send confirmation email:', err))

  void writeAudit({ action: 'service_request.web_form_submitted', tenantId: resolvedTenantId, resourceType: 'service_request', metadata: { email, customer_matched: !!customer, request_id: requestId ?? null } })
  return NextResponse.json({ ok: true })
}
