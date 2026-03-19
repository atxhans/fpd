'use client'

import Link from 'next/link'
import type { JobEntry } from './types'
import { PRIORITY_COLORS } from './types'

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MAX_VISIBLE = 3

interface CalendarMonthViewProps {
  jobs: JobEntry[]
  date: string
  onDayClick: (date: string) => void
}

function getMonthGrid(dateStr: string): Array<string | null> {
  const year = parseInt(dateStr.slice(0, 4))
  const month = parseInt(dateStr.slice(5, 7)) - 1 // 0-indexed
  const firstDayOfWeek = new Date(year, month, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: Array<string | null> = []
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(`${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export function CalendarMonthView({ jobs, date, onDayClick }: CalendarMonthViewProps) {
  const grid = getMonthGrid(date)
  const today = localToday()

  const byDate: Record<string, JobEntry[]> = {}
  for (const job of jobs) {
    if (!job.scheduled_at) continue
    const key = job.scheduled_at.slice(0, 10)
    if (!byDate[key]) byDate[key] = []
    byDate[key].push(job)
  }

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      {/* Day name headers */}
      <div className="grid grid-cols-7 border-b border-border bg-muted/10">
        {DAY_NAMES.map((name) => (
          <div
            key={name}
            className="p-2 text-center text-xs font-semibold text-muted-foreground border-r last:border-0 border-border"
          >
            {name}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 divide-x divide-y divide-border">
        {grid.map((dayStr, idx) => {
          if (!dayStr) {
            return <div key={`empty-${idx}`} className="min-h-[110px] bg-muted/5" />
          }

          const dayJobs = byDate[dayStr] ?? []
          const dayNum = parseInt(dayStr.slice(8))
          const isToday = dayStr === today
          const visible = dayJobs.slice(0, MAX_VISIBLE)
          const overflow = dayJobs.length - MAX_VISIBLE

          return (
            <div key={dayStr} className={`min-h-[110px] p-1.5 ${isToday ? 'bg-primary/5' : ''}`}>
              <button
                onClick={() => onDayClick(dayStr)}
                className={`w-7 h-7 rounded-full text-xs font-semibold flex items-center justify-center mb-1 transition-colors ${
                  isToday
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                {dayNum}
              </button>

              <div className="space-y-0.5">
                {visible.map((job) => (
                  <Link key={job.id} href={`/jobs/${job.id}`}>
                    <div
                      className={`rounded px-1.5 py-0.5 text-xs truncate hover:opacity-75 transition-opacity cursor-pointer ${PRIORITY_COLORS[job.priority] ?? PRIORITY_COLORS.normal}`}
                    >
                      {job.customer_name}
                    </div>
                  </Link>
                ))}
                {overflow > 0 && (
                  <button
                    onClick={() => onDayClick(dayStr)}
                    className="text-xs text-primary hover:underline pl-1.5 font-medium"
                  >
                    +{overflow} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
