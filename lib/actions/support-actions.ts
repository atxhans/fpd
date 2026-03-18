'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { writeAudit } from '@/lib/audit'

// ─── Tenant user: submit a help request ─────────────────────────────────────

export async function createSupportCase(input: {
  subject: string
  description: string
  pageUrl: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { error: 'No active membership' }

  const { data, error } = await supabase
    .from('support_cases')
    .insert({
      tenant_id: membership.tenant_id,
      reported_by: user.id,
      subject: input.subject.trim(),
      description: input.description.trim() || null,
      page_url: input.pageUrl || null,
      status: 'open',
      priority: 'medium',
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  void writeAudit({ action: 'support_case.created', tenantId: membership.tenant_id, actorId: user.id, actorEmail: user.email, resourceType: 'support_case', resourceId: data.id, resourceLabel: input.subject, metadata: { page_url: input.pageUrl } })
  return { ok: true, caseId: data.id }
}

// ─── Platform admin: add a comment ──────────────────────────────────────────

async function requirePlatformAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' as const, user: null }
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()
  if (!profile?.is_platform_user) return { error: 'Unauthorized' as const, user: null }
  return { error: null, user }
}

export async function addSupportComment(input: {
  caseId: string
  body: string
  isInternal: boolean
}) {
  const { error: authError, user } = await requirePlatformAdmin()
  if (authError || !user) return { error: authError ?? 'Unauthorized' }

  const admin = await createAdminClient()
  const { error } = await admin.from('support_case_comments').insert({
    case_id: input.caseId,
    author_id: user.id,
    body: input.body.trim(),
    is_internal: input.isInternal,
  })

  if (error) return { error: error.message }
  void writeAudit({ action: 'support_case.comment_added', actorId: user.id, actorEmail: user.email, resourceType: 'support_case', resourceId: input.caseId, metadata: { is_internal: input.isInternal } })
  return { ok: true }
}

export async function updateSupportCaseStatus(
  caseId: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
) {
  const { error: authError, user } = await requirePlatformAdmin()
  if (authError) return { error: authError }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('support_cases')
    .update({ status })
    .eq('id', caseId)

  if (error) return { error: error.message }
  void writeAudit({ action: 'support_case.status_updated', actorId: user?.id ?? null, actorEmail: user?.email ?? null, resourceType: 'support_case', resourceId: caseId, metadata: { status } })
  return { ok: true }
}
