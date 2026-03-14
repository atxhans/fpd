import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Jobs' }

export default async function JobsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  let query = supabase
    .from('jobs')
    .select('id, job_number, status, priority, service_category, problem_description, scheduled_at, created_at, customers(name), sites(name, city, state), profiles!jobs_assigned_technician_id_fkey(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(50)

  // Technicians only see their own jobs
  if (membership?.role === 'technician') {
    query = query.eq('assigned_technician_id', user.id)
  }

  const { data: jobs } = await query

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Jobs"
        subtitle="All service jobs and work orders"
        actions={
          <Link href="/jobs/new">
            <Button className="bg-black text-primary hover:bg-black/90">
              <Plus className="h-4 w-4 mr-2" />
              New Job
            </Button>
          </Link>
        }
      />

      <Card>
        <CardContent className="p-0">
          {!jobs?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">Create a new job to get started</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map((job: Record<string, unknown>) => {
                const customer = job.customers as { name: string } | null
                const site = job.sites as { name: string; city: string; state: string } | null
                const tech = job.profiles as { first_name: string | null; last_name: string | null } | null
                const techName = tech ? [tech.first_name, tech.last_name].filter(Boolean).join(' ') : 'Unassigned'

                return (
                  <Link key={job.id as string} href={`/jobs/${job.id}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{job.job_number as string}</span>
                          <StatusBadge status={job.status as string} />
                        </div>
                        <p className="font-semibold truncate">{customer?.name ?? '—'}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {site ? `${site.name}, ${site.city}, ${site.state}` : '—'}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-medium">{techName}</p>
                        {job.scheduled_at != null && (
                          <p className="text-xs text-muted-foreground flex items-center gap-1 justify-end mt-1">
                            <Clock className="h-3 w-3" />
                            {formatDateTime(job.scheduled_at as string)}
                          </p>
                        )}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
