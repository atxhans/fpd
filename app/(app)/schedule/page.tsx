import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { ScheduleContainer } from '@/components/schedule/schedule-container'
import type { ViewType, WeatherSnapshot } from '@/components/schedule/types'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Schedule' }

interface SearchParams {
  date?: string
  view?: string
}

function getDateRange(date: string, view: string): { start: string; end: string } {
  if (view === 'week') {
    const d = new Date(`${date}T12:00:00`)
    const day = d.getDay()
    const monday = new Date(d)
    monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
    const sunday = new Date(monday)
    sunday.setDate(monday.getDate() + 6)
    return {
      start: monday.toISOString().split('T')[0],
      end: sunday.toISOString().split('T')[0],
    }
  }
  if (view === 'month') {
    const start = `${date.slice(0, 7)}-01`
    const d = new Date(`${start}T12:00:00`)
    d.setMonth(d.getMonth() + 1)
    d.setDate(0)
    return { start, end: d.toISOString().split('T')[0] }
  }
  return { start: date, end: date }
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

  const date = params.date ?? new Date().toISOString().split('T')[0]
  const view = (params.view ?? 'board') as ViewType
  const { start, end } = getDateRange(date, view)

  const [jobsResult, techsResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, job_number, status, priority, scheduled_at, service_category, assigned_technician_id, weather_snapshot, customers(name), sites(name, city, state), profiles!jobs_assigned_technician_id_fkey(first_name, last_name)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .gte('scheduled_at', `${start}T00:00:00+00:00`)
      .lte('scheduled_at', `${end}T23:59:59+00:00`)
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
      weather_snapshot: j.weather_snapshot as unknown as WeatherSnapshot | null,
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
      <ScheduleContainer jobs={jobs} date={date} view={view} technicians={technicians} />
    </div>
  )
}
