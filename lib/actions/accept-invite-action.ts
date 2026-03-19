'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function acceptInvite(params: {
  token: string
  firstName: string
  lastName: string
  password: string
}): Promise<{ ok: true; redirectTo: string } | { error: string }> {
  const admin = await createAdminClient()

  // Re-validate the token (server-side — don't trust the client)
  const { data: invitation } = await admin
    .from('invitations')
    .select('email, role, tenant_id, invited_by, created_at')
    .eq('token', params.token)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .gte('expires_at', new Date().toISOString())
    .single()

  if (!invitation) return { error: 'This invitation is invalid or has expired.' }

  // Create the Supabase auth user with the chosen password
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email: invitation.email,
    password: params.password,
    email_confirm: true,
    user_metadata: {
      first_name: params.firstName,
      last_name: params.lastName,
    },
  })

  if (createError) {
    if (createError.message.toLowerCase().includes('already')) {
      return { error: 'An account with this email already exists. Please sign in instead.' }
    }
    return { error: createError.message }
  }

  const userId = created.user.id

  // Update profile with their name
  await admin.from('profiles').update({
    first_name: params.firstName || null,
    last_name: params.lastName || null,
  }).eq('id', userId)

  // Create membership
  await admin.from('memberships').insert({
    user_id: userId,
    tenant_id: invitation.tenant_id,
    role: invitation.role,
    is_active: true,
    invited_by: invitation.invited_by,
    invited_at: invitation.created_at,
    accepted_at: new Date().toISOString(),
  })

  // Mark invitation accepted
  await admin.from('invitations').update({
    accepted_at: new Date().toISOString(),
    accepted_by: userId,
  }).eq('token', params.token)

  // Sign the user in so they land on the dashboard directly
  const supabase = await createClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: invitation.email,
    password: params.password,
  })

  return { ok: true, redirectTo: signInError ? '/login?message=Account+created' : '/dashboard' }
}
