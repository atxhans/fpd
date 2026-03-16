'use server'

import { createClient } from '@/lib/supabase/server'

export async function updateEquipment(
  equipmentId: string,
  data: {
    manufacturer?: string
    model_number?: string | null
    serial_number?: string | null
    unit_type?: string
    location?: 'indoor' | 'outdoor' | 'both' | null
    refrigerant_type?: string | null
    tonnage?: number | null
    install_date?: string | null
    warranty_expiry?: string | null
    status?: 'active' | 'retired' | 'decommissioned'
    notes?: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, tenant_id')
    .eq('id', equipmentId)
    .is('deleted_at', null)
    .single()

  if (!equipment) return { error: 'Equipment not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', equipment.tenant_id)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  const { error } = await supabase
    .from('equipment')
    .update({
      ...data,
      tonnage: data.tonnage ?? null,
    })
    .eq('id', equipmentId)

  if (error) return { error: error.message }
  return { ok: true }
}
