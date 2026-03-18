import { createAdminClient } from '@/lib/supabase/server'

export interface AuditEvent {
  action: string
  tenantId?: string | null
  actorId?: string | null
  actorEmail?: string | null
  resourceType?: string
  resourceId?: string
  resourceLabel?: string
  metadata?: Record<string, unknown>
}

/**
 * Write an immutable audit log entry.
 * Never throws — audit failures must never break the calling operation.
 */
export async function writeAudit(event: AuditEvent): Promise<void> {
  try {
    const admin = await createAdminClient()
    await admin.from('audit_logs').insert({
      action:         event.action,
      tenant_id:      event.tenantId   ?? null,
      actor_id:       event.actorId    ?? null,
      actor_email:    event.actorEmail ?? null,
      resource_type:  event.resourceType  ?? null,
      resource_id:    event.resourceId    ?? null,
      resource_label: event.resourceLabel ?? null,
      metadata:       (event.metadata ?? {}) as import('@/types/database').Json,
    })
  } catch (err) {
    console.error('[audit] write failed for action:', event.action, err)
  }
}
