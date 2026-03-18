import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { Shield, AlertTriangle } from 'lucide-react'
import type { Metadata } from 'next'
import { ImpersonateForm } from './impersonate-form'

export const metadata: Metadata = { title: 'Impersonation' }

export default async function ImpersonationPage() {
  const supabase = await createClient()

  const { data: sessions } = await supabase
    .from('impersonation_sessions')
    .select('id, status, reason, started_at, ended_at, profiles!impersonation_sessions_initiated_by_fkey(email), profiles!impersonation_sessions_target_user_id_fkey(email, first_name, last_name), tenants(name)')
    .order('started_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Impersonation Controls"
        subtitle="Safe user impersonation — fully audited, reason required"
      />

      {/* Warning banner */}
      <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-300 rounded-lg">
        <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5 shrink-0" />
        <div>
          <p className="font-semibold text-orange-800">Impersonation is strictly controlled</p>
          <p className="text-sm text-orange-700 mt-1">
            All impersonation sessions are immutably logged. A business reason is required before starting.
            Impersonated actions are flagged in all audit logs. Use only for authorized support purposes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ImpersonateForm />

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <CardTitle>Recent Sessions</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {!sessions?.length ? (
              <p className="text-sm text-muted-foreground">No impersonation sessions on record</p>
            ) : (
              <div className="space-y-3">
                {sessions.map((s: Record<string, unknown>) => {
                  const initiator = (s as Record<string, unknown>)['profiles!impersonation_sessions_initiated_by_fkey'] as { email: string } | null
                  const target = (s as Record<string, unknown>)['profiles!impersonation_sessions_target_user_id_fkey'] as { email: string; first_name: string | null; last_name: string | null } | null
                  const tenant = s.tenants as { name: string } | null
                  return (
                    <div key={s.id as string} className="p-3 border border-border rounded-lg space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium">
                          {target?.first_name} {target?.last_name} ({target?.email})
                        </p>
                        <Badge variant={s.status === 'active' ? 'destructive' : 'secondary'}>
                          {s.status as string}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">by {initiator?.email} · {tenant?.name ?? 'N/A'}</p>
                      <p className="text-xs text-muted-foreground italic">"{s.reason as string}"</p>
                      <p className="text-xs text-muted-foreground">{formatDateTime(s.started_at as string)} → {s.ended_at ? formatDateTime(s.ended_at as string) : 'active'}</p>
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
