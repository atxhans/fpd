import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Audit Logs' }

export default async function AuditLogsPage() {
  const supabase = await createClient()

  const { data: logs } = await supabase
    .from('audit_logs')
    .select('id, action, resource_type, resource_label, actor_email, tenant_id, impersonated_by, created_at, metadata, tenants(name)')
    .order('created_at', { ascending: false })
    .limit(100)

  const actionColor = (action: string) => {
    if (action.includes('impersonation')) return 'bg-orange-100 text-orange-800'
    if (action.includes('delete') || action.includes('suspend')) return 'bg-red-100 text-red-800'
    if (action.includes('create') || action.includes('invite')) return 'bg-green-100 text-green-800'
    return 'bg-gray-100 text-gray-700'
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Audit Logs" subtitle="Immutable record of all platform and HVAC contractor actions" />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold">Time</th>
                  <th className="text-left px-4 py-3 font-semibold">Action</th>
                  <th className="text-left px-4 py-3 font-semibold">Actor</th>
                  <th className="text-left px-4 py-3 font-semibold">HVAC Contractor</th>
                  <th className="text-left px-4 py-3 font-semibold">Resource</th>
                  <th className="text-left px-4 py-3 font-semibold">Flags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(logs ?? []).map((log: Record<string, unknown>) => {
                  const tenant = log.tenants as { name: string } | null
                  return (
                    <tr key={log.id as string} className="hover:bg-muted/20">
                      <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(log.created_at as string)}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-medium ${actionColor(log.action as string)}`}>
                          {log.action as string}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">{log.actor_email as string ?? '—'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{tenant?.name ?? 'Platform'}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {log.resource_type as string ? `${log.resource_type}: ${log.resource_label ?? ''}` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {(log.impersonated_by as string | null) && (
                          <Badge variant="outline" className="text-xs text-orange-700 border-orange-300">Impersonated</Badge>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {!logs?.length && (
              <div className="p-12 text-center text-muted-foreground">
                <p className="font-medium">No audit logs yet</p>
                <p className="text-sm mt-1">Actions will appear here as users interact with the platform</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
