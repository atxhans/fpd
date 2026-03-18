'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { writeAudit } from '@/lib/audit'

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' as const, user: null }

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()

  if (!profile?.is_platform_user) return { error: 'Unauthorized' as const, user: null }
  return { error: null, user }
}

/**
 * Assign an unmatched (or mismatched) service request to a tenant.
 * Optionally links to an existing customer if their email matches one in the target tenant.
 */
export async function assignServiceRequest(srId: string, tenantId: string) {
  const { error: authError, user } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()

  // Try to match a customer in the target tenant by contact_email
  const { data: sr } = await admin
    .from('service_requests')
    .select('contact_email')
    .eq('id', srId)
    .single()

  let customerId: string | null = null
  if (sr?.contact_email) {
    const { data: customer } = await admin
      .from('customers')
      .select('id')
      .eq('email', sr.contact_email)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single()
    customerId = customer?.id ?? null
  }

  const { error } = await admin
    .from('service_requests')
    .update({
      tenant_id:   tenantId,
      customer_id: customerId,
      status:      'acknowledged',
    })
    .eq('id', srId)

  if (error) return { error: error.message }
  void writeAudit({ action: 'service_request.assigned', actorId: user?.id ?? null, actorEmail: user?.email ?? null, resourceType: 'service_request', resourceId: srId, metadata: { tenant_id: tenantId, customer_matched: !!customerId } })
  return { ok: true, customerMatched: !!customerId }
}

/**
 * Mark a service request as spam/closed without assigning it.
 */
export async function dismissServiceRequest(srId: string, status: 'spam' | 'closed') {
  const { error: authError, user } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('service_requests')
    .update({ status })
    .eq('id', srId)

  if (error) return { error: error.message }
  void writeAudit({ action: `service_request.${status}`, actorId: user?.id ?? null, actorEmail: user?.email ?? null, resourceType: 'service_request', resourceId: srId, metadata: { status } })
  return { ok: true }
}

/**
 * Reassign a customer (and all their sites, equipment, jobs) to a different tenant.
 */
export async function reassignCustomer(customerId: string, newTenantId: string) {
  const { error: authError, user } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()

  // Verify customer exists and get current state
  const { data: customer } = await admin
    .from('customers')
    .select('id, name, tenant_id')
    .eq('id', customerId)
    .single()

  if (!customer) return { error: 'Customer not found' }
  if (customer.tenant_id === newTenantId) return { error: 'Customer is already in that tenant' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenantUpdate = { tenant_id: newTenantId } as any

  // Move customer
  const { error: customerErr } = await admin
    .from('customers')
    .update(tenantUpdate)
    .eq('id', customerId)
  if (customerErr) return { error: customerErr.message }

  // Move sites
  await admin.from('sites').update(tenantUpdate).eq('customer_id', customerId)

  // Move equipment
  await admin.from('equipment').update(tenantUpdate).eq('customer_id', customerId)

  // Move open/active jobs (not completed or cancelled — leave history in place)
  await admin
    .from('jobs')
    .update(tenantUpdate)
    .eq('customer_id', customerId)
    .in('status', ['unassigned', 'assigned', 'in_progress', 'paused'])

  // Re-link any service requests
  await admin
    .from('service_requests')
    .update({ tenant_id: newTenantId })
    .eq('customer_id', customerId)

  void writeAudit({ action: 'customer.tenant_reassigned', actorId: user?.id ?? null, actorEmail: user?.email ?? null, resourceType: 'customer', resourceId: customerId, resourceLabel: customer.name, metadata: { from_tenant: customer.tenant_id, to_tenant: newTenantId } })
  return { ok: true }
}
