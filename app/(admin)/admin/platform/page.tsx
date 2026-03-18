import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/shared/metric-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Building2, Users, Briefcase, Activity, HeadphonesIcon } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import type { Metadata } from 'next'
import PlatformCharts from './platform-charts'

export const metadata: Metadata = { title: 'Platform Dashboard' }

export default async function PlatformDashboardPage() {
  const supabase = await createClient()

  const [tenantsResult, usersResult, jobsResult, readingsResult, supportResult, recentTenantsResult] =
    await Promise.all([
      supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active').is('deleted_at', null),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_platform_user', false),
      supabase.from('jobs').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('readings').select('id', { count: 'exact', head: true }).gte('created_at', new Date(new Date().setHours(0,0,0,0)).toISOString()),
      supabase.from('support_cases').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('tenants').select('id, name, status, plan, created_at').is('deleted_at', null).order('created_at', { ascending: false }).limit(8),
    ])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Platform Dashboard" subtitle="Fieldpiece Digital platform overview" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <MetricCard title="Active Contractors"      value={tenantsResult.count ?? 0}  icon={Building2} />
        <MetricCard title="Active Users"        value={usersResult.count ?? 0}    icon={Users} />
        <MetricCard title="Jobs Today"          value={jobsResult.count ?? 0}     icon={Briefcase} />
        <MetricCard title="Readings Today"      value={readingsResult.count ?? 0} icon={Activity} />
        <MetricCard title="Open Support Cases"  value={supportResult.count ?? 0}  icon={HeadphonesIcon} />
      </div>

      <PlatformCharts />

      <Card>
        <CardHeader><CardTitle>Recent HVAC Contractors</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {(recentTenantsResult.data ?? []).map((t: Record<string, unknown>) => (
              <div key={t.id as string} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                <div>
                  <p className="font-semibold">{t.name as string}</p>
                  <p className="text-sm text-muted-foreground capitalize">{t.plan as string} · {formatRelativeTime(t.created_at as string)}</p>
                </div>
                <StatusBadge status={t.status as string} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
