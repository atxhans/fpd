import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Suspense } from 'react'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Clock } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { JobFilterBar } from './job-filter-bar'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Jobs' }

const PAGE_SIZE = 25

interface SearchParams {
  status?: string
  from?: string
  to?: string
  page?: string
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const statusFilter = params.status ?? ''
  const fromFilter = params.from ?? ''
  const toFilter = params.to ?? ''
  const page = Math.max(1, parseInt(params.page ?? '1', 10))
  const offset = (page - 1) * PAGE_SIZE

  // Build the data query
  let query = supabase
    .from('jobs')
    .select('id, job_number, status, priority, service_category, problem_description, scheduled_at, created_at, customers(name), sites(name, city, state), profiles!jobs_assigned_technician_id_fkey(first_name, last_name)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1)

  // Build the count query
  let countQuery = supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)

  // Technicians only see their own jobs
  if (membership?.role === 'technician') {
    query = query.eq('assigned_technician_id', user.id)
    countQuery = countQuery.eq('assigned_technician_id', user.id)
  }

  // Status filter
  type JobStatus = 'cancelled' | 'in_progress' | 'unassigned' | 'assigned' | 'paused' | 'completed'
  const validStatuses: JobStatus[] = ['unassigned', 'assigned', 'in_progress', 'paused', 'completed', 'cancelled']
  if (statusFilter && validStatuses.includes(statusFilter as JobStatus)) {
    query = query.eq('status', statusFilter as JobStatus)
    countQuery = countQuery.eq('status', statusFilter as JobStatus)
  }

  // Date range filter on scheduled_at
  if (fromFilter) {
    query = query.gte('scheduled_at', `${fromFilter}T00:00:00`)
    countQuery = countQuery.gte('scheduled_at', `${fromFilter}T00:00:00`)
  }
  if (toFilter) {
    query = query.lte('scheduled_at', `${toFilter}T23:59:59`)
    countQuery = countQuery.lte('scheduled_at', `${toFilter}T23:59:59`)
  }

  const [{ data: jobs }, { count }] = await Promise.all([query, countQuery])
  const total = count ?? 0

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

      <Suspense>
        <JobFilterBar
          currentStatus={statusFilter}
          currentFrom={fromFilter}
          currentTo={toFilter}
          total={total}
          page={page}
          pageSize={PAGE_SIZE}
        />
      </Suspense>

      <Card>
        <CardContent className="p-0">
          {!jobs?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <p className="font-medium">No jobs found</p>
              <p className="text-sm mt-1">
                {statusFilter || fromFilter || toFilter
                  ? 'Try adjusting your filters'
                  : 'Create a new job to get started'}
              </p>
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
