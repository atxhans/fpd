'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { writeAudit } from '@/lib/audit'

export async function saveEmailTemplate(
  tenantId: string,
  key: string,
  subject: string,
  htmlBody: string
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { error } = await supabase
    .from('email_templates')
    .upsert(
      { tenant_id: tenantId, key, subject, html_body: htmlBody },
      { onConflict: 'tenant_id,key' }
    )

  if (error) return { error: error.message }
  void writeAudit({ action: 'email_template.updated', tenantId, actorId: user?.id ?? null, actorEmail: user?.email ?? null, resourceType: 'email_template', resourceLabel: key, metadata: { subject } })
  return { ok: true }
}
