'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'
import { writeAudit } from '@/lib/audit'

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  email:         z.string().email('Invalid email').or(z.literal('')).nullable().optional(),
  phone:         z.string().nullable().optional(),
  customer_type: z.enum(['residential', 'commercial', 'industrial']),
  notes:         z.string().nullable().optional(),
})

export async function updateCustomer(customerId: string, formData: z.infer<typeof schema>) {
  const parsed = schema.safeParse(formData)
  if (!parsed.success) return { error: 'Validation failed' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // Verify caller is a member of the tenant that owns this customer
  const { data: customer } = await supabase
    .from('customers')
    .select('id, tenant_id')
    .eq('id', customerId)
    .is('deleted_at', null)
    .single()

  if (!customer) return { error: 'Customer not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', customer.tenant_id)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  const { email, phone, notes } = parsed.data
  const { error } = await supabase
    .from('customers')
    .update({
      name:          parsed.data.name,
      email:         email || null,
      phone:         phone || null,
      customer_type: parsed.data.customer_type,
      notes:         notes || null,
    })
    .eq('id', customerId)

  if (error) return { error: error.message }
  void writeAudit({ action: 'customer.updated', tenantId: customer.tenant_id, actorId: user.id, actorEmail: user.email, resourceType: 'customer', resourceId: customerId, resourceLabel: parsed.data.name })
  return { ok: true }
}

export async function createCustomer(
  tenantId: string,
  data: {
    name: string
    email?: string | null
    phone?: string | null
    customer_type: 'residential' | 'commercial' | 'industrial'
    notes?: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  const { data: customer, error } = await supabase
    .from('customers')
    .insert({
      tenant_id: tenantId,
      name: data.name,
      email: data.email ?? null,
      phone: data.phone ?? null,
      customer_type: data.customer_type,
      notes: data.notes ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  void writeAudit({ action: 'customer.created', tenantId, actorId: user.id, actorEmail: user.email, resourceType: 'customer', resourceId: customer.id, resourceLabel: data.name, metadata: { customer_type: data.customer_type } })
  return { ok: true, customerId: customer.id }
}
