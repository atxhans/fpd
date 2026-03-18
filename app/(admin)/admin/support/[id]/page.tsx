import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ChevronLeft, ExternalLink } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { CaseDetailClient } from './case-detail-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Support Case' }

export default async function SupportCasePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [caseResult, commentsResult] = await Promise.all([
    supabase
      .from('support_cases')
      .select('*, tenants(name), profiles!support_cases_reported_by_fkey(first_name, last_name, email)')
      .eq('id', id)
      .single(),
    supabase
      .from('support_case_comments')
      .select('id, body, is_internal, created_at, profiles!support_case_comments_author_id_fkey(first_name, last_name, email)')
      .eq('case_id', id)
      .order('created_at', { ascending: true }),
  ])

  if (!caseResult.data) notFound()

  const c = caseResult.data
  const reporter = c.profiles as unknown as { first_name: string | null; last_name: string | null; email: string } | null
  const tenant = c.tenants as unknown as { name: string } | null
  const reporterName = reporter
    ? [reporter.first_name, reporter.last_name].filter(Boolean).join(' ') || reporter.email
    : '—'

  const comments = (commentsResult.data ?? []).map((cm: Record<string, unknown>) => ({
    id: cm.id as string,
    body: cm.body as string,
    is_internal: cm.is_internal as boolean,
    created_at: cm.created_at as string,
    author: cm.profiles as { first_name: string | null; last_name: string | null; email: string } | null,
  }))

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <Link
          href="/admin/support"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
        >
          <ChevronLeft className="h-4 w-4" /> Support Console
        </Link>
        <h1 className="text-xl font-bold">{c.subject}</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Opened {formatDateTime(c.created_at)}
        </p>
      </div>

      {/* Context */}
      <Card>
        <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Details</CardTitle></CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            {[
              { label: 'Submitted by', value: reporterName },
              { label: 'Email',        value: reporter?.email ?? '—' },
              { label: 'Contractor',   value: tenant?.name ?? '—' },
              { label: 'Priority',     value: <span className="capitalize">{c.priority}</span> },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs text-muted-foreground">{label}</dt>
                <dd className="mt-0.5 font-medium">{value}</dd>
              </div>
            ))}
            {c.page_url && (
              <div className="col-span-2">
                <dt className="text-xs text-muted-foreground">Page</dt>
                <dd className="mt-0.5 font-medium flex items-center gap-1.5">
                  <span className="truncate text-xs font-mono">{c.page_url}</span>
                  <a href={c.page_url} target="_blank" rel="noopener noreferrer" className="shrink-0 text-muted-foreground hover:text-foreground">
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </dd>
              </div>
            )}
          </dl>
        </CardContent>
      </Card>

      {/* Description */}
      {c.description && (
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Description</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{c.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Interactive: status + comments */}
      <CaseDetailClient
        caseId={c.id}
        currentStatus={c.status}
        comments={comments}
      />
    </div>
  )
}
