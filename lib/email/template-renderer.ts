import { createClient } from '@/lib/supabase/server'
import { getTemplateDefinition, type TemplateKey } from './template-defaults'

export interface RenderedTemplate {
  subject: string
  html: string
}

/** Substitute {{variable}} placeholders in a string */
function substitute(str: string, vars: Record<string, string | null | undefined>): string {
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '')
}

/**
 * Fetch a tenant's customized template from the DB.
 * Falls back to the hardcoded default if none is saved yet.
 */
export async function renderTemplate(
  tenantId: string,
  key: TemplateKey,
  vars: Record<string, string | null | undefined>
): Promise<RenderedTemplate> {
  const supabase = await createClient()

  const { data } = await supabase
    .from('email_templates')
    .select('subject, html_body')
    .eq('tenant_id', tenantId)
    .eq('key', key)
    .single()

  const def = getTemplateDefinition(key)
  const subject  = data?.subject   ?? def?.defaultSubject ?? ''
  const htmlBody = data?.html_body ?? def?.defaultHtml    ?? ''

  return {
    subject: substitute(subject, vars),
    html:    substitute(htmlBody, vars),
  }
}
