import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { computeHealthScore } from '@/lib/health/score'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Equipment' }

function HealthBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-xs text-muted-foreground">—</span>
  const { label, cls } =
    score >= 85 ? { label: 'Excellent', cls: 'bg-green-100 text-green-800' } :
    score >= 70 ? { label: 'Good',      cls: 'bg-lime-100 text-lime-800' } :
    score >= 50 ? { label: 'Fair',      cls: 'bg-yellow-100 text-yellow-800' } :
    score >= 30 ? { label: 'Poor',      cls: 'bg-orange-100 text-orange-800' } :
                  { label: 'Critical',  cls: 'bg-red-100 text-red-800' }
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cls}`}>
      <span className="tabular-nums">{score}</span>
      <span className="font-normal opacity-75">{label}</span>
    </span>
  )
}

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, manufacturer, model_number, serial_number, unit_type, refrigerant_type, tonnage, install_date, status, health_score, customers(name), sites(name, city, state)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  const eqIds = (equipment ?? []).map(e => e.id)

  // Fetch scoring inputs in bulk for all equipment
  const [flaggedResult, diagnosticsResult, jobsResult] = eqIds.length > 0
    ? await Promise.all([
        supabase.from('readings')
          .select('equipment_id, captured_at, is_flagged, reading_types(key)')
          .in('equipment_id', eqIds)
          .eq('is_flagged', true),
        supabase.from('diagnostic_results')
          .select('equipment_id, severity, created_at, title')
          .in('equipment_id', eqIds),
        supabase.from('job_equipment')
          .select('equipment_id, jobs(completed_at, service_category)')
          .in('equipment_id', eqIds),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }]

  // Group by equipment_id
  type FlaggedRow = { equipment_id: string; captured_at: string; is_flagged: boolean; reading_types: { key: string } | null }
  type DiagRow = { equipment_id: string; severity: string; created_at: string; title: string }
  type JobRow = { equipment_id: string; jobs: { completed_at: string | null; service_category: string } | null }

  const flaggedByEq: Record<string, FlaggedRow[]> = {}
  for (const r of (flaggedResult.data ?? []) as unknown as FlaggedRow[]) {
    if (!flaggedByEq[r.equipment_id]) flaggedByEq[r.equipment_id] = []
    flaggedByEq[r.equipment_id].push(r)
  }

  const diagByEq: Record<string, DiagRow[]> = {}
  for (const d of (diagnosticsResult.data ?? []) as unknown as DiagRow[]) {
    if (!diagByEq[d.equipment_id]) diagByEq[d.equipment_id] = []
    diagByEq[d.equipment_id].push(d)
  }

  const jobsByEq: Record<string, { completed_at: string | null; service_category: string }[]> = {}
  for (const je of (jobsResult.data ?? []) as unknown as JobRow[]) {
    if (!je.jobs) continue
    if (!jobsByEq[je.equipment_id]) jobsByEq[je.equipment_id] = []
    jobsByEq[je.equipment_id].push(je.jobs)
  }

  // Compute score for each unit; prefer DB score if already stored (includes trend penalty)
  const scores: Record<string, number> = {}
  const toUpdate: { id: string; score: number }[] = []
  for (const eq of equipment ?? []) {
    if (eq.health_score != null) {
      scores[eq.id] = eq.health_score
      continue
    }
    const breakdown = computeHealthScore(
      (flaggedByEq[eq.id] ?? []).map(r => ({
        value: 1, captured_at: r.captured_at, is_flagged: true,
        reading_types: r.reading_types ? { key: r.reading_types.key } : null,
      })),
      diagByEq[eq.id] ?? [],
      jobsByEq[eq.id] ?? [],
    )
    scores[eq.id] = breakdown.total
    toUpdate.push({ id: eq.id, score: breakdown.total })
  }

  // Persist newly computed scores (fire-and-forget)
  if (toUpdate.length > 0) {
    void Promise.all(
      toUpdate.map(({ id, score }) =>
        supabase.from('equipment').update({ health_score: score, health_score_at: new Date().toISOString() }).eq('id', id)
      )
    )
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Equipment" subtitle="All HVAC units and equipment records" />

      <Card>
        <CardContent className="p-0">
          {!equipment?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No equipment on file</p>
              <p className="text-sm mt-1">Equipment is added when creating customers and sites</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {equipment.map((eq: Record<string, unknown>) => {
                const customer = eq.customers as { name: string } | null
                const site = eq.sites as { name: string; city: string; state: string } | null
                return (
                  <Link key={eq.id as string} href={`/equipment/${eq.id}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black shrink-0">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{eq.manufacturer as string} {eq.model_number as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer?.name} · {site ? `${site.city}, ${site.state}` : ''}
                          {eq.serial_number ? ` · S/N: ${eq.serial_number}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <div><HealthBadge score={scores[eq.id as string] ?? null} /></div>
                        <Badge variant="outline">{String(eq.unit_type).replace(/_/g, ' ')}</Badge>
                        {eq.refrigerant_type != null && <p className="text-xs text-muted-foreground">{eq.refrigerant_type as string}</p>}
                        {eq.install_date != null && <p className="text-xs text-muted-foreground">Installed {formatDate(eq.install_date as string)}</p>}
                      </div>
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
