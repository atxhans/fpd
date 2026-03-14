import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatRelativeTime } from '@/lib/utils'
import Link from 'next/link'
import type { Metadata } from 'next'
import { SupportSearch } from './support-search'

export const metadata: Metadata = { title: 'Support Console' }

export default async function SupportConsolePage() {
  const supabase = await createClient()

  const [openCasesResult, recentCasesResult] = await Promise.all([
    supabase.from('support_cases').select('*').eq('status', 'open').order('created_at', { ascending: false }).limit(5),
    supabase.from('support_cases').select('id, subject, status, priority, created_at, tenants(name)').order('created_at', { ascending: false }).limit(10),
  ])

  const openCases = openCasesResult.data ?? []
  const recentCases = recentCasesResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Support Console" subtitle="Global search and support operations" />

      <SupportSearch />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Open Cases ({openCases.length})</CardTitle></CardHeader>
          <CardContent>
            {openCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No open cases</p>
            ) : (
              <div className="space-y-3">
                {openCases.map((c: Record<string, unknown>) => (
                  <div key={c.id as string} className="p-3 border border-border rounded-lg">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-sm">{c.subject as string}</p>
                      <StatusBadge status={String(c.priority)} />
                    </div>
                    <p className="text-xs text-muted-foreground">{formatRelativeTime(c.created_at as string)}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Recent Cases</CardTitle></CardHeader>
          <CardContent>
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground">No cases yet</p>
            ) : (
              <div className="space-y-2">
                {recentCases.map((c: Record<string, unknown>) => {
                  const tenant = c.tenants as { name: string } | null
                  return (
                    <div key={c.id as string} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{c.subject as string}</p>
                        <p className="text-xs text-muted-foreground">{tenant?.name ?? 'No tenant'} · {formatRelativeTime(c.created_at as string)}</p>
                      </div>
                      <StatusBadge status={c.status as string} />
                    </div>
                  )
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
