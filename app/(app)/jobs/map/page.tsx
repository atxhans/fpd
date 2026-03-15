import { createClient } from '@/lib/supabase/server'
import { JobsMap } from '@/components/jobs/jobs-map'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Job Map — Fieldpiece Digital' }

export default async function JobMapPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>
}) {
  const { date } = await searchParams
  const targetDate = date ?? new Date().toISOString().slice(0, 10)

  const supabase = await createClient()

  const dayStart = `${targetDate}T00:00:00.000Z`
  const dayEnd   = `${targetDate}T23:59:59.999Z`

  const { data: jobs } = await supabase
    .from('jobs')
    .select(`
      id,
      job_number,
      status,
      scheduled_at,
      notes,
      customers ( id, name, email, phone ),
      sites ( id, address_line1, address_line2, city, state, zip, latitude, longitude )
    `)
    .gte('scheduled_at', dayStart)
    .lte('scheduled_at', dayEnd)
    .order('scheduled_at', { ascending: true })

  return (
    <div className="h-full flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">Job Map</h1>
        <p className="text-muted-foreground text-sm">Scheduled jobs for {targetDate}</p>
      </div>
      <div className="flex-1 min-h-0">
        <JobsMap jobs={jobs ?? []} selectedDate={targetDate} />
      </div>
    </div>
  )
}
