import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { TEMPLATE_DEFINITIONS } from '@/lib/email/template-defaults'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronRight, Mail } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Email Templates — Settings' }

export default async function EmailTemplatesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id').eq('user_id', user.id).eq('is_active', true).single()
  if (!membership?.tenant_id) redirect('/login')

  // Which templates have been customized?
  const { data: saved } = await supabase
    .from('email_templates')
    .select('key')
    .eq('tenant_id', membership.tenant_id)

  const customizedKeys = new Set(saved?.map(t => t.key) ?? [])

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-muted-foreground">
        Customize the emails sent to your customers. Changes apply to your company only.
      </p>

      <div className="space-y-2">
        {TEMPLATE_DEFINITIONS.map(def => (
          <Link key={def.key} href={`/settings/email-templates/${def.key}`}>
            <Card className="hover:border-primary/50 transition-colors cursor-pointer">
              <CardContent className="flex items-center gap-4 py-4">
                <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{def.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{def.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {customizedKeys.has(def.key)
                    ? <Badge variant="secondary" className="text-xs">Customized</Badge>
                    : <Badge variant="outline" className="text-xs">Default</Badge>
                  }
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  )
}
