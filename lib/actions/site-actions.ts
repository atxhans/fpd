'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().nullable().optional(),
  city:          z.string().min(1, 'City is required'),
  state:         z.string().min(1, 'State is required'),
  zip:           z.string().min(1, 'ZIP is required'),
  site_type:     z.enum(['residential', 'commercial', 'industrial']),
  notes:         z.string().nullable().optional(),
})

async function getAuthorizedMembership(supabase: Awaited<ReturnType<typeof createClient>>, tenantId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) return null
  return membership
}

export async function createSite(
  customerId: string,
  tenantId: string,
  formData: z.infer<typeof schema>
) {
  const parsed = schema.safeParse(formData)
  if (!parsed.success) return { error: 'Validation failed' }

  const supabase = await createClient()
  if (!await getAuthorizedMembership(supabase, tenantId)) return { error: 'Unauthorized' }

  const { error } = await supabase.from('sites').insert({
    customer_id:   customerId,
    tenant_id:     tenantId,
    name:          parsed.data.name,
    address_line1: parsed.data.address_line1,
    address_line2: parsed.data.address_line2 || null,
    city:          parsed.data.city,
    state:         parsed.data.state,
    zip:           parsed.data.zip,
    site_type:     parsed.data.site_type,
    notes:         parsed.data.notes || null,
  })

  if (error) return { error: error.message }
  return { ok: true }
}

export async function updateSite(siteId: string, formData: z.infer<typeof schema>) {
  const parsed = schema.safeParse(formData)
  if (!parsed.success) return { error: 'Validation failed' }

  const supabase = await createClient()

  // Resolve tenant from the site record
  const { data: site } = await supabase
    .from('sites')
    .select('tenant_id')
    .eq('id', siteId)
    .is('deleted_at', null)
    .single()

  if (!site) return { error: 'Site not found' }
  if (!await getAuthorizedMembership(supabase, site.tenant_id)) return { error: 'Unauthorized' }

  const { error } = await supabase.from('sites').update({
    name:          parsed.data.name,
    address_line1: parsed.data.address_line1,
    address_line2: parsed.data.address_line2 || null,
    city:          parsed.data.city,
    state:         parsed.data.state,
    zip:           parsed.data.zip,
    site_type:     parsed.data.site_type,
    notes:         parsed.data.notes || null,
  }).eq('id', siteId)

  if (error) return { error: error.message }
  return { ok: true }
}
