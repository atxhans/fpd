import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SupportSearch } from './support-search'

export const metadata: Metadata = { title: 'Support Console' }

const PRIORITY_COLORS: Record<string, string> = {
  critical: 'bg-red-100 text-red-800 border-red-200',
  high:     'bg-orange-100 text-orange-800 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-800 border-yellow-200',
  low:      'bg-gray-100 text-gray-700 border-gray-200',
}

export default async function SupportConsolePage() {
  const supabase = await createClient()

  const [openCasesResult, allCasesResult] = await Promise.all([
    supabase
      .from('support_cases')
      .select('id, subject, status, priority, created_at, page_url, tenants(name), profiles!support_cases_reported_by_fkey(first_name, last_name, email)')
      .in('status', ['open', 'in_progress'])
      .order('created_at', { ascending: false })
      .limit(50),
    supabase
      .from('support_cases')
      .select('id, subject, status, priority, created_at, tenants(name)')
      .order('created_at', { ascending: false })
      .limit(20),
  ])

  const openCases = openCasesResult.data ?? []
  const allCases = allCasesResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Support Console"
        subtitle={`${openCases.length} open case${openCases.length !== 1 ? 's' : ''}`}
      />

      <SupportSearch />

      {/* Open / in-progress cases */}
      <Card>
        <CardHeader>
          <CardTitle>Open Cases ({openCases.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {openCases.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No open cases — all clear!</p>
          ) : (
            <div className="divide-y divide-border">
              {openCases.map((c: Record<string, unknown>) => {
                const tenant = c.tenants as { name: string } | null
                const reporter = c.profiles as { first_name: string | null; last_name: string | null; email: string } | null
                const reporterName = reporter
                  ? [reporter.first_name, reporter.last_name].filter(Boolean).join(' ') || reporter.email
                  : null
                return (
                  <Link key={c.id as string} href={`/admin/support/${c.id}`}>
                    <div className="flex items-start gap-4 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.subject as string}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {tenant?.name ?? 'No contractor'}
                          {reporterName && ` · ${reporterName}`}
                          {' · '}{formatRelativeTime(c.created_at as string)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant="outline"
                          className={`text-xs capitalize ${PRIORITY_COLORS[c.priority as string] ?? ''}`}
                        >
                          {c.priority as string}
                        </Badge>
                        <StatusBadge status={c.status as string} />
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent cases (all statuses) */}
      <Card>
        <CardHeader><CardTitle>Recent Cases</CardTitle></CardHeader>
        <CardContent className="p-0">
          {allCases.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">No cases yet</p>
          ) : (
            <div className="divide-y divide-border">
              {allCases.map((c: Record<string, unknown>) => {
                const tenant = c.tenants as { name: string } | null
                return (
                  <Link key={c.id as string} href={`/admin/support/${c.id}`}>
                    <div className="flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.subject as string}</p>
                        <p className="text-xs text-muted-foreground">
                          {tenant?.name ?? 'No contractor'} · {formatRelativeTime(c.created_at as string)}
                        </p>
                      </div>
                      <StatusBadge status={c.status as string} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
