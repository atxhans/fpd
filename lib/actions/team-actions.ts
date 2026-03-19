'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const TENANT_ROLES = ['technician', 'dispatcher', 'company_admin'] as const
export type TenantRole = 'technician' | 'dispatcher' | 'company_admin'

async function requireTenantAdmin(tenantId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' as const, user: null, supabase: null }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  if (membership?.role !== 'company_admin') return { error: 'Unauthorized' as const, user: null, supabase: null }
  return { error: null, user, supabase }
}

export interface InviteTeamMemberInput {
  tenantId: string
  email: string
  firstName: string
  lastName: string
  role: TenantRole
}

export async function inviteTeamMember(
  input: InviteTeamMemberInput,
): Promise<{ ok: true } | { error: string }> {
  const { error: authError, user } = await requireTenantAdmin(input.tenantId)
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  if (!TENANT_ROLES.includes(input.role)) return { error: 'Invalid role' }

  const admin = await createAdminClient()
  const email = input.email.toLowerCase().trim()
  let userId: string

  // Invite via Supabase auth (sends magic-link email)
  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    data: { first_name: input.firstName, last_name: input.lastName },
  })

  if (inviteError) {
    const alreadyRegistered =
      inviteError.message.toLowerCase().includes('already been registered') ||
      inviteError.message.toLowerCase().includes('already registered')

    if (alreadyRegistered) {
      // User already has an account — just look them up and add the membership
      const { data: existingProfile } = await admin
        .from('profiles')
        .select('id')
        .eq('email', email)
        .single()
      if (!existingProfile) return { error: 'User exists but profile was not found. Contact support.' }
      userId = existingProfile.id
    } else {
      return { error: inviteError.message }
    }
  } else {
    userId = invited.user.id
    if (input.firstName || input.lastName) {
      await admin.from('profiles').update({
        first_name: input.firstName || null,
        last_name: input.lastName || null,
      }).eq('id', userId)
    }
  }

  // Check for an existing membership (active or inactive)
  const { data: existingMembership } = await admin
    .from('memberships')
    .select('id, is_active')
    .eq('user_id', userId)
    .eq('tenant_id', input.tenantId)
    .single()

  if (existingMembership) {
    if (existingMembership.is_active) return { error: 'This person is already a member of your team.' }
    // Reactivate a previously removed member
    await admin.from('memberships').update({
      role: input.role,
      is_active: true,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
      accepted_at: null,
    }).eq('id', existingMembership.id)
  } else {
    await admin.from('memberships').insert({
      user_id: userId,
      tenant_id: input.tenantId,
      role: input.role,
      is_active: true,
      invited_by: user.id,
      invited_at: new Date().toISOString(),
    })
  }

  revalidatePath('/team')
  return { ok: true }
}

export async function updateMemberRole(
  membershipId: string,
  tenantId: string,
  role: TenantRole,
): Promise<{ ok: true } | { error: string }> {
  const { error: authError } = await requireTenantAdmin(tenantId)
  if (authError) return { error: authError }
  if (!TENANT_ROLES.includes(role)) return { error: 'Invalid role' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('memberships')
    .update({ role })
    .eq('id', membershipId)
    .eq('tenant_id', tenantId)

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { ok: true }
}

export async function deactivateMember(
  membershipId: string,
  tenantId: string,
): Promise<{ ok: true } | { error: string }> {
  const { error: authError, user } = await requireTenantAdmin(tenantId)
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('memberships')
    .update({ is_active: false })
    .eq('id', membershipId)
    .eq('tenant_id', tenantId)
    .neq('user_id', user.id) // Can't remove yourself

  if (error) return { error: error.message }
  revalidatePath('/team')
  return { ok: true }
}
