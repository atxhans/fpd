import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { ManufacturerExplorer } from './manufacturer-explorer'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Manufacturer Analytics' }

export default async function ManufacturerAnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()
  if (!profile?.is_platform_user) redirect('/')

  const admin = await createAdminClient()

  const [eqResult, diagResult] = await Promise.all([
    // All equipment cross-tenant
    admin
      .from('equipment')
      .select('id, manufacturer, model_number, unit_type, install_date, status, health_score, sites(state)')
      .is('deleted_at', null)
      .limit(3000),

    // All diagnostics (equipment_id + title + severity)
    admin
      .from('diagnostic_results')
      .select('equipment_id, title, severity')
      .not('equipment_id', 'is', null)
      .limit(10000),
  ])

  // Build equipment_id → manufacturer lookup
  const eqById: Record<string, string> = {}
  for (const e of eqResult.data ?? []) {
    eqById[e.id] = e.manufacturer
  }

  // Attach manufacturer to each diagnostic
  type DiagWithMfg = { equipment_id: string; title: string; severity: string; manufacturer: string }
  const diagnostics: DiagWithMfg[] = []
  for (const d of (diagResult.data ?? []) as unknown as { equipment_id: string; title: string; severity: string }[]) {
    const mfg = eqById[d.equipment_id]
    if (mfg) diagnostics.push({ ...d, manufacturer: mfg })
  }

  const equipment = (eqResult.data ?? []).map(e => {
    const site = e.sites as unknown as { state: string } | null
    return {
      id: e.id,
      manufacturer: e.manufacturer,
      model_number: e.model_number ?? null,
      unit_type: e.unit_type,
      install_date: e.install_date ?? null,
      status: e.status as string,
      health_score: e.health_score ?? null,
      state: site?.state ?? '—',
    }
  })

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Manufacturer Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Cross-tenant equipment performance by brand and model · {equipment.length} units
        </p>
      </div>
      <ManufacturerExplorer equipment={equipment} diagnostics={diagnostics} />
    </div>
  )
}
