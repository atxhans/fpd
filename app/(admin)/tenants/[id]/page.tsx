import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { getRoleLabel } from '@/types/user'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Tenant Detail' }

export default async function TenantDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [tenantResult, membersResult, jobsResult, flagsResult] = await Promise.all([
    supabase.from('tenants').select('*').eq('id', id).single(),
    supabase.from('memberships').select('id, role, is_active, accepted_at, profiles(first_name, last_name, email)').eq('tenant_id', id).order('created_at'),
    supabase.from('jobs').select('id, job_number, status, created_at').eq('tenant_id', id).is('deleted_at', null).order('created_at', { ascending: false }).limit(5),
    supabase.from('tenant_feature_flags').select('flag_key, enabled').eq('tenant_id', id),
  ])

  if (!tenantResult.data) notFound()

  const tenant = tenantResult.data
  const members = membersResult.data ?? []
  const jobs = jobsResult.data ?? []
  const flags = flagsResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={tenant.name}
        subtitle={`/${tenant.slug}`}
        actions={<StatusBadge status={tenant.status} />}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Details */}
          <Card>
            <CardHeader><CardTitle>Tenant Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                {[
                  { label: 'Status', value: <StatusBadge status={tenant.status} /> },
                  { label: 'Plan', value: <Badge variant="outline" className="capitalize">{tenant.plan}</Badge> },
                  { label: 'Onboarding', value: tenant.onboarding_status.replace('_', ' ') },
                  { label: 'Phone', value: tenant.phone ?? '—' },
                  { label: 'City', value: tenant.city ?? '—' },
                  { label: 'State', value: tenant.state ?? '—' },
                  { label: 'ZIP', value: tenant.zip ?? '—' },
                  { label: 'Created', value: formatDate(tenant.created_at) },
                  { label: 'Seat Limit', value: tenant.seat_limit ?? 'Unlimited' },
                  { label: 'Contract Tier', value: tenant.contract_tier ?? '—' },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="mt-0.5 text-sm font-medium">{typeof value === 'string' || typeof value === 'number' ? value : value}</dd>
                  </div>
                ))}
              </dl>
              {tenant.internal_notes && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">Internal Notes</p>
                  <p className="text-sm text-yellow-900">{tenant.internal_notes}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader><CardTitle>Team Members ({members.length})</CardTitle></CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                {members.map((m: Record<string, unknown>) => {
                  const profile = m.profiles as { first_name: string | null; last_name: string | null; email: string } | null
                  const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email : '—'
                  return (
                    <div key={m.id as string} className="flex items-center gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{name}</p>
                        <p className="text-xs text-muted-foreground">{profile?.email}</p>
                      </div>
                      <Badge variant="outline" className="text-xs capitalize">{getRoleLabel(m.role as never)}</Badge>
                      {!m.is_active && <Badge variant="secondary" className="text-xs">Inactive</Badge>}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Feature Flags */}
          <Card>
            <CardHeader><CardTitle>Feature Flags</CardTitle></CardHeader>
            <CardContent>
              {flags.length === 0 ? (
                <p className="text-sm text-muted-foreground">No overrides set</p>
              ) : (
                <div className="space-y-2">
                  {flags.map((f) => (
                    <div key={f.flag_key} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{f.flag_key}</span>
                      <Badge variant={f.enabled ? 'default' : 'secondary'} className={f.enabled ? 'bg-black text-primary' : ''}>
                        {f.enabled ? 'ON' : 'OFF'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Jobs */}
          <Card>
            <CardHeader><CardTitle>Recent Jobs</CardTitle></CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No jobs yet</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((j: Record<string, unknown>) => (
                    <div key={j.id as string} className="flex items-center justify-between">
                      <span className="text-sm font-mono">{j.job_number as string}</span>
                      <StatusBadge status={j.status as string} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
