import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import type { Metadata } from 'next'
import { FeatureFlagToggle } from './feature-flag-toggle'

export const metadata: Metadata = { title: 'Feature Flags' }

export default async function FeatureFlagsPage() {
  const supabase = await createClient()

  const [globalFlagsResult, tenantFlagsResult] = await Promise.all([
    supabase.from('platform_feature_flags').select('*').order('flag_key'),
    supabase.from('tenant_feature_flags')
      .select('id, flag_key, enabled, tenant_id')
      .order('tenant_id'),
  ])

  const globalFlags = globalFlagsResult.data ?? []
  const tenantFlags = tenantFlagsResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Feature Flags" subtitle="Control feature rollout globally and per HVAC contractor" />

      <Card>
        <CardHeader><CardTitle>Global Platform Flags</CardTitle></CardHeader>
        <CardContent>
          {globalFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No global flags configured</p>
          ) : (
            <div className="space-y-3">
              {globalFlags.map((f) => (
                <div key={f.id as string} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="font-mono text-sm font-semibold">{f.flag_key}</p>
                    {f.description != null && <p className="text-xs text-muted-foreground mt-0.5">{f.description}</p>}
                  </div>
                  <FeatureFlagToggle id={f.id} flagKey={f.flag_key} enabled={f.enabled} scope="global" />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Per-Contractor Flag Overrides</CardTitle></CardHeader>
        <CardContent>
          {tenantFlags.length === 0 ? (
            <p className="text-sm text-muted-foreground">No per-contractor overrides set</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-3 font-semibold">HVAC Contractor</th>
                    <th className="text-left py-2 px-3 font-semibold">Flag</th>
                    <th className="text-left py-2 px-3 font-semibold">State</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tenantFlags.map((f) => (
                    <tr key={f.id}>
                      <td className="py-2 px-3">{f.tenant_id}</td>
                      <td className="py-2 px-3 font-mono text-xs">{f.flag_key}</td>
                      <td className="py-2 px-3">
                        <Badge variant={f.enabled ? 'default' : 'secondary'} className={f.enabled ? 'bg-black text-primary' : ''}>
                          {f.enabled ? 'ON' : 'OFF'}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
