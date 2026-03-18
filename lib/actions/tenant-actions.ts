'use server'

import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const slugSchema = z.string()
  .min(2, 'Slug must be at least 2 characters')
  .max(48, 'Slug must be 48 characters or fewer')
  .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')

export async function updateTenantSlug(tenantId: string, newSlug: string) {
  const parsed = slugSchema.safeParse(newSlug)
  if (!parsed.success) return { error: parsed.error.issues[0].message }

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

  if (membership?.role !== 'company_admin') return { error: 'Unauthorized' }

  const { error } = await supabase
    .from('tenants')
    .update({ slug: parsed.data })
    .eq('id', tenantId)

  if (error) {
    // Unique constraint violation
    if (error.code === '23505') return { error: 'That slug is already taken. Choose a different one.' }
    return { error: error.message }
  }

  return { ok: true }
}
