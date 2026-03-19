'use client'

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DispatchBoard } from './dispatch-board'
import { CalendarDayView } from './calendar-day-view'
import { CalendarWeekView } from './calendar-week-view'
import { CalendarMonthView } from './calendar-month-view'
import type { JobEntry, Technician, ViewType } from './types'

interface ScheduleContainerProps {
  jobs: JobEntry[]
  date: string
  view: ViewType
  technicians: Technician[]
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(`${dateStr}T12:00:00`)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().split('T')[0]
}

function getWeekRange(dateStr: string): { start: string; end: string } {
  const d = new Date(`${dateStr}T12:00:00`)
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

function formatHeader(date: string, view: ViewType): string {
  if (view === 'week') {
    const { start, end } = getWeekRange(date)
    const s = new Date(`${start}T12:00:00`)
    const e = new Date(`${end}T12:00:00`)
    const startFmt = s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endFmt = e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    return `${startFmt} – ${endFmt}`
  }
  if (view === 'month') {
    return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  }
  return new Date(`${date}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function localToday(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

const VIEWS: { key: ViewType; label: string }[] = [
  { key: 'board', label: 'Board' },
  { key: 'day', label: 'Day' },
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
]

export function ScheduleContainer({ jobs, date, view, technicians }: ScheduleContainerProps) {
  const router = useRouter()

  function navigate(newDate: string, newView: ViewType = view) {
    router.push(`/schedule?view=${newView}&date=${newDate}`)
  }

  function goPrev() {
    if (view === 'month') navigate(addMonths(date, -1))
    else if (view === 'week') navigate(addDays(date, -7))
    else navigate(addDays(date, -1))
  }

  function goNext() {
    if (view === 'month') navigate(addMonths(date, 1))
    else if (view === 'week') navigate(addDays(date, 7))
    else navigate(addDays(date, 1))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* View switcher */}
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          {VIEWS.map((v) => (
            <button
              key={v.key}
              onClick={() => navigate(date, v.key)}
              className={`px-3 py-1.5 text-sm font-medium transition-colors ${
                view === v.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>

        {/* Navigation */}
        <div className="flex items-center gap-1.5">
          <Button variant="outline" size="icon-sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(localToday())}>
            Today
          </Button>
        </div>

        <h2 className="text-lg font-semibold">{formatHeader(date, view)}</h2>
        <span className="ml-auto text-sm text-muted-foreground">
          {jobs.length} job{jobs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* View content */}
      {view === 'board' && <DispatchBoard jobs={jobs} technicians={technicians} />}
      {view === 'day' && <CalendarDayView jobs={jobs} date={date} />}
      {view === 'week' && (
        <CalendarWeekView jobs={jobs} date={date} onDayClick={(d) => navigate(d, 'day')} />
      )}
      {view === 'month' && (
        <CalendarMonthView jobs={jobs} date={date} onDayClick={(d) => navigate(d, 'day')} />
      )}
    </div>
  )
}
