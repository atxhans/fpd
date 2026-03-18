import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'HVAC Contractors' }

export default async function TenantsPage() {
  const supabase = await createClient()

  const { data: tenants } = await supabase
    .from('tenants')
    .select('id, name, slug, status, plan, onboarding_status, city, state, created_at')
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="HVAC Contractors" subtitle={`${tenants?.length ?? 0} contractors on platform`} />
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold">Company</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Plan</th>
                  <th className="text-left px-4 py-3 font-semibold">Onboarding</th>
                  <th className="text-left px-4 py-3 font-semibold">Location</th>
                  <th className="text-left px-4 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(tenants ?? []).map((t: Record<string, unknown>) => (
                  <tr key={t.id as string} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3">
                      <Link href={`/admin/tenants/${t.id}`} className="font-semibold hover:underline">
                        {t.name as string}
                      </Link>
                      <p className="text-xs text-muted-foreground">{t.slug as string}</p>
                    </td>
                    <td className="px-4 py-3"><StatusBadge status={t.status as string} /></td>
                    <td className="px-4 py-3"><Badge variant="outline" className="capitalize">{t.plan as string}</Badge></td>
                    <td className="px-4 py-3 capitalize text-muted-foreground">{String(t.onboarding_status).replace('_', ' ')}</td>
                    <td className="px-4 py-3 text-muted-foreground">{t.city as string ? `${t.city}, ${t.state}` : '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(t.created_at as string)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
