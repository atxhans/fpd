'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
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

export interface InviteUserInput {
  email: string
  firstName: string
  lastName: string
  isPlatformUser: boolean
  platformRole: string | null
  tenantId: string | null
  tenantRole: string | null
}

export async function inviteUser(input: InviteUserInput) {
  const { error: authError, user: adminUser } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()

  // Send invite email — Supabase creates auth user + sends magic-link invite
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    input.email,
    { data: { first_name: input.firstName, last_name: input.lastName } }
  )
  if (inviteError) return { error: inviteError.message }

  const userId = invited.user.id

  // Update profile with additional fields
  await admin
    .from('profiles')
    .update({
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      is_platform_user: input.isPlatformUser,
      platform_role: input.isPlatformUser ? input.platformRole : null,
    })
    .eq('id', userId)

  // Optionally add tenant membership
  if (!input.isPlatformUser && input.tenantId && input.tenantRole) {
    await admin.from('memberships').insert({
      user_id: userId,
      tenant_id: input.tenantId,
      role: input.tenantRole,
      is_active: true,
      invited_at: new Date().toISOString(),
    })
  }

  void writeAudit({ action: 'user.invited', actorId: adminUser?.id ?? null, actorEmail: adminUser?.email ?? null, resourceType: 'user', resourceId: userId, resourceLabel: input.email, metadata: { is_platform_user: input.isPlatformUser, tenant_id: input.tenantId } })
  return { ok: true }
}

export interface UpdateUserInput {
  userId: string
  firstName: string
  lastName: string
  phone: string
  isActive: boolean
  isPlatformUser: boolean
  platformRole: string | null
}

export async function updateAdminUser(input: UpdateUserInput) {
  const { error: authError, user: adminUser } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()

  const { error } = await admin
    .from('profiles')
    .update({
      first_name: input.firstName || null,
      last_name: input.lastName || null,
      phone: input.phone || null,
      is_active: input.isActive,
      is_platform_user: input.isPlatformUser,
      platform_role: input.isPlatformUser ? input.platformRole : null,
    })
    .eq('id', input.userId)

  if (error) return { error: error.message }
  void writeAudit({ action: 'user.updated', actorId: adminUser?.id ?? null, actorEmail: adminUser?.email ?? null, resourceType: 'user', resourceId: input.userId, metadata: { is_active: input.isActive, is_platform_user: input.isPlatformUser } })
  return { ok: true }
}
