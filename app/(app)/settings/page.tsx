import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Settings' }

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role, tenants(*)').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const tenant = membership?.tenants as Record<string, unknown> | null
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()

  return (
    <div className="space-y-6">

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Company Profile</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: 'Company Name', value: tenant?.name },
                { label: 'Plan', value: tenant?.plan },
                { label: 'Status', value: tenant?.status },
                { label: 'Phone', value: tenant?.phone ?? '—' },
                { label: 'City', value: tenant?.city ?? '—' },
                { label: 'State', value: tenant?.state ?? '—' },
                { label: 'Member Since', value: formatDate(tenant?.created_at as string) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1 border-b border-border last:border-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium capitalize">{String(value ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>My Profile</CardTitle></CardHeader>
          <CardContent>
            <dl className="space-y-3">
              {[
                { label: 'Name', value: [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || '—' },
                { label: 'Email', value: profile?.email },
                { label: 'Phone', value: profile?.phone ?? '—' },
                { label: 'Role', value: membership.role },
                { label: 'Member Since', value: formatDate(profile?.created_at) },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1 border-b border-border last:border-0">
                  <dt className="text-sm text-muted-foreground">{label}</dt>
                  <dd className="text-sm font-medium capitalize">{String(value ?? '—')}</dd>
                </div>
              ))}
            </dl>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
