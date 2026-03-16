import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { DispatchBoard } from '@/components/schedule/dispatch-board'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule' }

interface SearchParams {
  date?: string
}

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const params = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  // Default to today
  const date = params.date ?? new Date().toISOString().split('T')[0]

  const [jobsResult, techsResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, job_number, status, priority, scheduled_at, service_category, assigned_technician_id, customers(name), sites(name, city, state), profiles!jobs_assigned_technician_id_fkey(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('scheduled_at', `${date}T00:00:00`)
      .lte('scheduled_at', `${date}T23:59:59`)
      .order('scheduled_at', { ascending: true }),
    supabase
      .from('memberships')
      .select('user_id, profiles(id, first_name, last_name)')
      .eq('tenant_id', tenantId)
      .in('role', ['technician', 'company_admin', 'dispatcher'])
      .eq('is_active', true),
  ])

  const jobs = (jobsResult.data ?? []).map((j) => {
    const customer = j.customers as unknown as { name: string } | null
    const site = j.sites as unknown as { name: string; city: string; state: string } | null
    const tech = j.profiles as unknown as { first_name: string | null; last_name: string | null } | null
    return {
      id: j.id,
      job_number: j.job_number,
      status: j.status,
      priority: j.priority,
      scheduled_at: j.scheduled_at,
      service_category: j.service_category,
      assigned_technician_id: j.assigned_technician_id,
      customer_name: customer?.name ?? '—',
      site_city: site?.city ?? '',
      site_state: site?.state ?? '',
      tech_first: tech?.first_name ?? null,
      tech_last: tech?.last_name ?? null,
    }
  })

  const technicians = (techsResult.data ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as { id: string; first_name: string | null; last_name: string | null } | null
      if (!profile) return null
      return {
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown',
      }
    })
    .filter((t): t is { id: string; name: string } => t !== null)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Schedule"
        subtitle="Dispatch board — view and manage daily job assignments"
      />
      <DispatchBoard jobs={jobs} date={date} technicians={technicians} />
    </div>
  )
}
