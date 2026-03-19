'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import type { JobEntry } from './types'
import { PRIORITY_COLORS } from './types'
import { WeatherIcon } from '@/components/shared/weather-icon'

const HOURS = Array.from({ length: 15 }, (_, i) => i + 6) // 6 AM – 8 PM

function formatHourLabel(hour: number): string {
  if (hour === 12) return '12 PM'
  return hour < 12 ? `${hour} AM` : `${hour - 12} PM`
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

interface CalendarDayViewProps {
  jobs: JobEntry[]
  date: string
}

export function CalendarDayView({ jobs }: CalendarDayViewProps) {
  const byHour: Record<number, JobEntry[]> = {}
  const unscheduled: JobEntry[] = []

  for (const job of jobs) {
    if (!job.scheduled_at) {
      unscheduled.push(job)
    } else {
      const hour = new Date(job.scheduled_at).getHours()
      if (!byHour[hour]) byHour[hour] = []
      byHour[hour].push(job)
    }
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {unscheduled.length > 0 && (
        <div className="flex border-b border-border bg-muted/10">
          <div className="w-20 shrink-0 px-3 py-3 text-right text-xs text-muted-foreground font-medium border-r border-border flex items-center justify-end">
            No time
          </div>
          <div className="flex-1 p-2 flex flex-wrap gap-2">
            {unscheduled.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>
        </div>
      )}

      {HOURS.map((hour) => {
        const hourJobs = byHour[hour] ?? []
        return (
          <div key={hour} className="flex min-h-[64px] border-b border-border last:border-0">
            <div className="w-20 shrink-0 pt-3 pr-3 text-right text-xs text-muted-foreground font-medium border-r border-border bg-muted/10 select-none">
              {formatHourLabel(hour)}
            </div>
            <div className="flex-1 p-2 flex flex-wrap gap-2 items-start content-start">
              {hourJobs.map((job) => (
                <JobCard key={job.id} job={job} showTime />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

function JobCard({ job, showTime }: { job: JobEntry; showTime?: boolean }) {
  const techName =
    job.tech_first || job.tech_last
      ? [job.tech_first, job.tech_last].filter(Boolean).join(' ')
      : 'Unassigned'

  const borderColor =
    job.priority === 'emergency' ? 'border-l-red-400' :
    job.priority === 'high' ? 'border-l-orange-400' :
    job.priority === 'normal' ? 'border-l-blue-400' :
    'border-l-gray-300'

  return (
    <Link href={`/jobs/${job.id}`} className="block">
      <div className={`border border-border border-l-4 ${borderColor} rounded-lg p-2.5 min-w-[180px] max-w-[260px] bg-white hover:bg-muted/30 hover:shadow-sm transition-all space-y-1`}>
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
          <StatusBadge status={job.status} />
        </div>
        <p className="text-sm font-semibold leading-tight truncate">{job.customer_name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {techName}
          {showTime && job.scheduled_at ? ` · ${formatTime(job.scheduled_at)}` : ''}
        </p>
        {job.weather_snapshot && (
          <div className="flex items-center gap-1.5 mt-0.5">
            <WeatherIcon icon={job.weather_snapshot.icon} size="xs" />
            <span className="text-xs font-medium tabular-nums">{job.weather_snapshot.temp_f}°F</span>
            <span className="text-xs text-muted-foreground capitalize">{job.weather_snapshot.description}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <span className={`text-xs px-1.5 py-0.5 rounded border font-medium ${PRIORITY_COLORS[job.priority] ?? PRIORITY_COLORS.normal}`}>
            {job.priority}
          </span>
          <span className="text-xs text-muted-foreground capitalize">
            {job.service_category.replace(/_/g, ' ')}
          </span>
        </div>
      </div>
    </Link>
  )
}
