import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/server'
import { sendServiceRequestConfirmation } from '@/lib/email/service-requests'

const schema = z.object({
  name:        z.string().min(2),
  email:       z.string().email(),
  phone:       z.string().min(7),
  address:     z.string().min(5),
  description: z.string().min(10),
  requestId:   z.string().uuid().nullable().optional(),
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

  const { name, email, phone, address, description, requestId } = parsed.data
  const supabase = await createAdminClient()

  // Try to match customer by email
  const { data: customer } = await supabase
    .from('customers')
    .select('id, name, tenant_id')
    .eq('email', email)
    .is('deleted_at', null)
    .limit(1)
    .single()

  if (requestId) {
    // Update existing service_request (from inbound email ref)
    const { error } = await supabase
      .from('service_requests')
      .update({
        contact_name:  name,
        contact_phone: phone,
        address,
        description,
        tenant_id:     customer?.tenant_id ?? null,
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
        tenant_id:     customer?.tenant_id ?? null,
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
    customerName: customer?.name ?? name,
    requestId:    requestId ?? 'NEW',
    description,
  }).catch(err => console.error('Failed to send confirmation email:', err))

  return NextResponse.json({ ok: true })
}
