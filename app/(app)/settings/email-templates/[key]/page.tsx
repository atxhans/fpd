import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { getTemplateDefinition } from '@/lib/email/template-defaults'
import { TemplateEditor } from '@/components/email-templates/template-editor'
import { ChevronLeft } from 'lucide-react'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ key: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { key } = await params
  const def = getTemplateDefinition(key)
  return { title: def ? `${def.label} — Email Templates` : 'Email Template' }
}

export default async function EditTemplatePage({ params }: Props) {
  const { key } = await params
  const def = getTemplateDefinition(key)
  if (!def) notFound()

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id').eq('user_id', user.id).eq('is_active', true).single()
  if (!membership?.tenant_id) redirect('/login')

  // Load saved template if it exists
  const { data: saved } = await supabase
    .from('email_templates')
    .select('subject, html_body')
    .eq('tenant_id', membership.tenant_id)
    .eq('key', key)
    .single()

  const initialSubject = saved?.subject  ?? def.defaultSubject
  const initialHtml    = saved?.html_body ?? def.defaultHtml

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link
          href="/settings/email-templates"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-2"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          Email Templates
        </Link>
        <h2 className="text-lg font-semibold">{def.label}</h2>
        <p className="text-sm text-muted-foreground">{def.description}</p>
      </div>

      <TemplateEditor
        tenantId={membership.tenant_id}
        def={def}
        initialSubject={initialSubject}
        initialHtml={initialHtml}
      />
    </div>
  )
}
