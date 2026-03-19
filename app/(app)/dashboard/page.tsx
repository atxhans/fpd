import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { MetricCard } from '@/components/shared/metric-card'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, Users, Wrench, AlertCircle } from 'lucide-react'
import { formatRelativeTime, formatDateTime } from '@/lib/utils'
import type { Metadata } from 'next'
import DashboardCharts from './dashboard-charts'

export const metadata: Metadata = { title: 'Dashboard' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id, role, tenants(name)')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const tenantId = membership?.tenant_id
  if (!tenantId) {
    // Platform-only users have no tenant — send them to the admin console
    const { data: profile } = await supabase.from('profiles').select('is_platform_user').eq('id', user.id).single()
    redirect(profile?.is_platform_user ? '/admin/platform' : '/login')
  }

  const { data: profile } = await supabase.from('profiles').select('first_name').eq('id', user.id).single()

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Parallel queries
  const [openJobsResult, activeTechsResult, todayJobsResult, followUpsResult, recentJobsResult] =
    await Promise.all([
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .in('status', ['assigned', 'in_progress'])
        .is('deleted_at', null),
      supabase.from('memberships').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('role', 'technician')
        .eq('is_active', true),
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .gte('created_at', today.toISOString())
        .is('deleted_at', null),
      supabase.from('jobs').select('id', { count: 'exact', head: true })
        .eq('tenant_id', tenantId)
        .eq('follow_up_required', true)
        .neq('status', 'completed')
        .is('deleted_at', null),
      supabase.from('jobs')
        .select('id, job_number, status, problem_description, updated_at, customers(name), profiles!jobs_assigned_technician_id_fkey(first_name, last_name)')
        .eq('tenant_id', tenantId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false })
        .limit(6),
    ])

  const openJobs = openJobsResult.count ?? 0
  const activeTechs = activeTechsResult.count ?? 0
  const todayJobs = todayJobsResult.count ?? 0
  const followUps = followUpsResult.count ?? 0
  const recentJobs = recentJobsResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Good ${getTimeOfDay()}, ${profile?.first_name ?? 'there'}`}
        subtitle="Here's what's happening today"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Open Jobs"           value={openJobs}   icon={Briefcase}   />
        <MetricCard title="Active Technicians"  value={activeTechs} icon={Users}       />
        <MetricCard title="Jobs Today"          value={todayJobs}  icon={Wrench}      />
        <MetricCard title="Follow-ups Needed"   value={followUps}  icon={AlertCircle} />
      </div>

      <DashboardCharts tenantId={tenantId} />

      <Card>
        <CardHeader><CardTitle>Recent Jobs</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recentJobs.length === 0 && (
              <p className="text-muted-foreground text-sm py-4 text-center">No jobs yet. Create your first job to get started.</p>
            )}
            {recentJobs.map((job: Record<string, unknown>) => {
              const customer = job.customers as { name: string } | null
              const tech = job.profiles as { first_name: string | null; last_name: string | null } | null
              const techName = tech ? [tech.first_name, tech.last_name].filter(Boolean).join(' ') : 'Unassigned'
              return (
                <div key={job.id as string} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold truncate">{customer?.name ?? '—'}</p>
                    <p className="text-sm text-muted-foreground">{job.job_number as string} · {techName} · {formatRelativeTime(job.updated_at as string)}</p>
                  </div>
                  <StatusBadge status={job.status as string} />
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}
