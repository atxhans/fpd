'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface JobFilterBarProps {
  currentStatus: string
  currentFrom: string
  currentTo: string
  total: number
  page: number
  pageSize: number
}

export function JobFilterBar({
  currentStatus,
  currentFrom,
  currentTo,
  total,
  page,
  pageSize,
}: JobFilterBarProps) {
  const router = useRouter()
  const searchParams = useSearchParams() as ReturnType<typeof useSearchParams>

  function updateParams(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
    }
    // Reset page on filter change (unless explicitly updating page)
    if (!('page' in updates)) {
      params.delete('page')
    }
    router.push(`/jobs?${params.toString()}`)
  }

  const totalPages = Math.ceil(total / pageSize)
  const startRecord = total === 0 ? 0 : (page - 1) * pageSize + 1
  const endRecord = Math.min(page * pageSize, total)

  return (
    <div className="flex flex-wrap items-center gap-3 p-4 bg-muted/30 border border-border rounded-lg">
      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Select
          value={currentStatus || 'all'}
          onValueChange={(v) => updateParams({ status: (v === 'all' || !v) ? '' : String(v) })}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="unassigned">Unassigned</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Date range */}
      <div className="flex items-center gap-2">
        <Input
          type="date"
          className="w-36 h-8 text-sm"
          value={currentFrom ?? ''}
          placeholder="From"
          onChange={(e) => updateParams({ from: e.target.value })}
        />
        <span className="text-muted-foreground text-sm">—</span>
        <Input
          type="date"
          className="w-36 h-8 text-sm"
          value={currentTo ?? ''}
          placeholder="To"
          onChange={(e) => updateParams({ to: e.target.value })}
        />
      </div>

      {/* Job count */}
      <div className="ml-auto flex items-center gap-3">
        <span className="text-sm text-muted-foreground">
          {total === 0
            ? '0 jobs'
            : `${startRecord}–${endRecord} of ${total} jobs`}
        </span>

        {/* Pagination */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => updateParams({ page: String(page - 1) })}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm px-2">
            {page} / {Math.max(totalPages, 1)}
          </span>
          <Button
            variant="outline"
            size="icon-sm"
            disabled={page >= totalPages}
            onClick={() => updateParams({ page: String(page + 1) })}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
