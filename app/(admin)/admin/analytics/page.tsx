import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { FleetExplorer } from './fleet-explorer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Fleet Intelligence' }

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()
  if (!profile?.is_platform_user) redirect('/')

  const admin = await createAdminClient()

  // All equipment with tenant, customer, site
  const [eqResult, flaggedResult, recent90dResult, diagResult] = await Promise.all([
    admin
      .from('equipment')
      .select('id, manufacturer, model_number, unit_type, install_date, status, health_score, tenants(name), customers(name), sites(state, city)')
      .is('deleted_at', null)
      .limit(3000),

    // All flagged reading timestamps for seasonal analysis
    admin
      .from('readings')
      .select('captured_at, equipment_id')
      .eq('is_flagged', true)
      .limit(25000),

    // Last-90-day flagged readings per equipment
    admin
      .from('readings')
      .select('equipment_id')
      .eq('is_flagged', true)
      .gte('captured_at', new Date(Date.now() - 90 * 86400000).toISOString()),

    // Last-90-day critical diagnostics per equipment
    admin
      .from('diagnostic_results')
      .select('equipment_id')
      .eq('severity', 'critical')
      .gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString()),
  ])

  // Build lookup maps
  const flagged90d: Record<string, number> = {}
  for (const r of recent90dResult.data ?? []) {
    const eid = r.equipment_id as string | null
    if (eid) flagged90d[eid] = (flagged90d[eid] ?? 0) + 1
  }
  const diag90d: Record<string, number> = {}
  for (const d of (diagResult.data ?? []) as unknown as { equipment_id: string | null }[]) {
    if (d.equipment_id) diag90d[d.equipment_id] = (diag90d[d.equipment_id] ?? 0) + 1
  }

  const equipment = (eqResult.data ?? []).map((e) => {
    const tenant = e.tenants as unknown as { name: string } | null
    const customer = e.customers as unknown as { name: string } | null
    const site = e.sites as unknown as { state: string; city: string } | null
    return {
      id: e.id,
      manufacturer: e.manufacturer,
      model_number: e.model_number ?? null,
      unit_type: e.unit_type,
      install_date: e.install_date ?? null,
      status: e.status as string,
      health_score: e.health_score ?? null,
      tenant_name: tenant?.name ?? 'Unknown',
      customer_name: customer?.name ?? 'Unknown',
      state: site?.state ?? '—',
      city: site?.city ?? '—',
      flagged_90d: flagged90d[e.id] ?? 0,
      critical_90d: diag90d[e.id] ?? 0,
    }
  })

  // Monthly flagged reading distribution (1–12) for seasonal chart
  const monthMap: Record<number, number> = {}
  for (const r of flaggedResult.data ?? []) {
    const m = new Date(r.captured_at).getMonth() + 1
    monthMap[m] = (monthMap[m] ?? 0) + 1
  }
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyData = MONTHS.map((label, i) => ({ month: label, flagged: monthMap[i + 1] ?? 0 }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Fleet Intelligence</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-tenant equipment analytics · {equipment.length} units across all contractors
        </p>
      </div>
      <FleetExplorer equipment={equipment} monthlyData={monthlyData} />
    </div>
  )
}
