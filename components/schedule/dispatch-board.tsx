'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface JobEntry {
  id: string
  job_number: string
  status: string
  priority: string
  scheduled_at: string | null
  service_category: string
  assigned_technician_id: string | null
  customer_name: string
  site_city: string
  site_state: string
  tech_first: string | null
  tech_last: string | null
}

interface Technician {
  id: string
  name: string
}

interface DispatchBoardProps {
  jobs: JobEntry[]
  date: string
  technicians: Technician[]
}

const PRIORITY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function formatDisplayDate(dateStr: string): string {
  const d = new Date(`${dateStr}T12:00:00`)
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function DispatchBoard({ jobs, date, technicians }: DispatchBoardProps) {
  const router = useRouter()

  function navigate(newDate: string) {
    router.push(`/schedule?date=${newDate}`)
  }

  // Build columns: technicians + unassigned
  const columns: Array<{ id: string | null; label: string }> = [
    { id: null, label: 'Unassigned' },
    ...technicians.map((t) => ({ id: t.id, label: t.name })),
  ]

  function getJobsForTech(techId: string | null): JobEntry[] {
    return jobs
      .filter((j) => (techId === null ? !j.assigned_technician_id : j.assigned_technician_id === techId))
      .sort((a, b) => {
        if (!a.scheduled_at) return 1
        if (!b.scheduled_at) return -1
        return a.scheduled_at.localeCompare(b.scheduled_at)
      })
  }

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon-sm" onClick={() => navigate(addDays(date, -1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{formatDisplayDate(date)}</h2>
        <Button variant="outline" size="icon-sm" onClick={() => navigate(addDays(date, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="ml-2"
          onClick={() => navigate(new Date().toISOString().split('T')[0])}
        >
          Today
        </Button>
        <span className="ml-auto text-sm text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Board columns */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {columns.map((col) => {
          const colJobs = getJobsForTech(col.id)
          return (
            <div key={col.id ?? 'unassigned'} className="flex-shrink-0 w-64">
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <h3 className="font-semibold text-sm truncate flex-1">{col.label}</h3>
                <Badge variant="outline" className="text-xs shrink-0">
                  {colJobs.length}
                </Badge>
              </div>

              {/* Jobs */}
              <div className="space-y-2">
                {colJobs.length === 0 ? (
                  <div className="p-4 border border-dashed border-border rounded-lg text-center">
                    <p className="text-xs text-muted-foreground">No jobs</p>
                  </div>
                ) : (
                  colJobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="p-3 border border-border rounded-lg bg-white hover:bg-muted/40 transition-colors space-y-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-mono text-muted-foreground flex-1 truncate">
                            {job.job_number}
                          </span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="font-semibold text-sm leading-tight truncate">
                          {job.customer_name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {job.site_city}, {job.site_state}
                        </p>
                        {job.scheduled_at && (
                          <p className="text-xs text-muted-foreground">
                            {formatDateTime(job.scheduled_at)}
                          </p>
                        )}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[job.priority] ?? PRIORITY_COLORS.normal}`}
                          >
                            {job.priority}
                          </span>
                          <span className="text-xs text-muted-foreground capitalize">
                            {job.service_category.replace(/_/g, ' ')}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
