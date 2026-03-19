'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { JobEntry, Technician } from './types'
import { PRIORITY_COLORS } from './types'

interface DispatchBoardProps {
  jobs: JobEntry[]
  technicians: Technician[]
}

export function DispatchBoard({ jobs, technicians }: DispatchBoardProps) {
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
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => {
        const colJobs = getJobsForTech(col.id)
        return (
          <div key={col.id ?? 'unassigned'} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <h3 className="font-semibold text-sm truncate flex-1">{col.label}</h3>
              <Badge variant="outline" className="text-xs shrink-0">
                {colJobs.length}
              </Badge>
            </div>

            <div className="space-y-2">
              {colJobs.length === 0 ? (
                <div className="p-4 border border-dashed border-border rounded-lg text-center">
                  <p className="text-xs text-muted-foreground">No jobs</p>
                </div>
              ) : (
                colJobs.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`} className="block">
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
  )
}
