'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/shared/status-badge'
import type { JobEntry } from './types'
import { PRIORITY_COLORS } from './types'

interface CalendarWeekViewProps {
  jobs: JobEntry[]
  date: string
  onDayClick: (date: string) => void
}

function getWeekDays(dateStr: string): string[] {
  const d = new Date(`${dateStr}T12:00:00`)
  const day = d.getDay()
  const monday = new Date(d)
  monday.setDate(d.getDate() - (day === 0 ? 6 : day - 1))
  return Array.from({ length: 7 }, (_, i) => {
    const dd = new Date(monday)
    dd.setDate(monday.getDate() + i)
    return dd.toISOString().split('T')[0]
  })
}

function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

function formatTime(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

export function CalendarWeekView({ jobs, date, onDayClick }: CalendarWeekViewProps) {
  const weekDays = getWeekDays(date)
  const today = localToday()

  // Group by UTC date (slice 0-10 matches server query boundaries)
  const byDate: Record<string, JobEntry[]> = {}
  for (const job of jobs) {
    if (!job.scheduled_at) continue
    const key = job.scheduled_at.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(job)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/10">
        {weekDays.map((dayStr) => {
          const d = new Date(`${dayStr}T12:00:00`)
          const isToday = dayStr === today
          const dayName = d.toLocaleDateString('en-US', { weekday: 'short' })
          const dayNum = d.getDate()
          const jobCount = (byDate[dayStr] ?? []).length
          return (
            <div
              key={dayStr}
              className={`p-2 text-center border-r last:border-0 border-border ${isToday ? 'bg-primary/5' : ''}`}
            >
              <div className="text-xs font-medium text-muted-foreground">{dayName}</div>
              <button
                onClick={() => onDayClick(dayStr)}
                className={`w-8 h-8 rounded-full text-sm font-semibold mx-auto flex items-center justify-center mt-0.5 transition-colors ${
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {dayNum}
              </button>
              {jobCount > 0 && (
                <div className="text-xs text-muted-foreground mt-0.5">{jobCount} job{jobCount !== 1 ? 's' : ''}</div>
              )}
            </div>
          )
        })}
      </div>

      {/* Job columns */}
      <div className="grid grid-cols-7 divide-x divide-border min-h-[480px]">
        {weekDays.map((dayStr) => {
          const isToday = dayStr === today
          const dayJobs = (byDate[dayStr] ?? []).sort((a, b) => {
            if (!a.scheduled_at) return 1
            if (!b.scheduled_at) return -1
            return a.scheduled_at.localeCompare(b.scheduled_at)
          })

          return (
            <div key={dayStr} className={`p-1.5 space-y-1 ${isToday ? 'bg-primary/5' : ''}`}>
              {dayJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`}>
                  <div
                    className={`rounded px-1.5 py-1 text-xs hover:opacity-75 transition-opacity cursor-pointer ${PRIORITY_COLORS[job.priority] ?? PRIORITY_COLORS.normal}`}
                  >
                    <div className="font-medium truncate">
                      {job.scheduled_at ? formatTime(job.scheduled_at) : '—'}
                    </div>
                    <div className="truncate opacity-90">{job.customer_name}</div>
                    <div className="mt-0.5">
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
