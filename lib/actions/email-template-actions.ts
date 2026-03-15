'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function saveEmailTemplate(
  tenantId: string,
  key: string,
  subject: string,
  htmlBody: string
): Promise<{ ok?: true; error?: string }> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('email_templates')
    .upsert(
      { tenant_id: tenantId, key, subject, html_body: htmlBody },
      { onConflict: 'tenant_id,key' }
    )

  if (error) return { error: error.message }
  return { ok: true }
}
