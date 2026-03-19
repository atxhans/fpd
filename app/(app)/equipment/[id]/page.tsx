import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { EquipmentEditForm } from './equipment-edit-form'
import { EquipmentTabs } from './equipment-tabs'
import { HealthScoreCard } from './health-score-card'
import { AiSummaryCard } from './ai-summary-card'
import { ResearchCard } from './research-card'
import type { EquipmentResearch } from '@/lib/actions/equipment-research-action'
import type { ReadingRow, ReadingTypeStats } from './equipment-tabs'
import { computeHealthScore } from '@/lib/health/score'
import type { AiSummary } from '@/types/health'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Equipment Detail' }

// ─── Fleet stats helper ────────────────────────────────────────────────────

type RawReading = { value: number | null; reading_types: { key: string; label: string; unit: string } | null }

function computeFleetStats(raw: RawReading[]) {
  const grouped: Record<string, { key: string; label: string; unit: string; values: number[] }> = {}
  for (const r of raw) {
    if (r.value == null || !r.reading_types) continue
    const { key, label, unit } = r.reading_types
    if (!grouped[key]) grouped[key] = { key, label, unit, values: [] }
    grouped[key].values.push(r.value)
  }
  const result: Record<string, { avg: number; min: number; max: number; p25: number; p75: number; count: number }> = {}
  for (const [key, { values }] of Object.entries(grouped)) {
    values.sort((a, b) => a - b)
    const n = values.length
    result[key] = {
      avg: values.reduce((s, v) => s + v, 0) / n,
      min: values[0],
      max: values[n - 1],
      p25: values[Math.floor(n * 0.25)],
      p75: values[Math.floor(n * 0.75)],
      count: n,
    }
  }
  return result
}

// ─── Page ──────────────────────────────────────────────────────────────────

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const [eqResult, jobEquipmentResult, readingsResult, diagnosticsResult] = await Promise.all([
    supabase.from('equipment')
      .select('*, customers(name, email, phone), sites(name, address_line1, city, state, zip)')
      .eq('id', id).eq('tenant_id', tenantId).is('deleted_at', null).single(),
    supabase.from('job_equipment')
      .select('jobs(id, job_number, status, scheduled_at, service_category, completed_at)')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('readings')
      .select('*, reading_types(key, label, unit, category, normal_min, normal_max), jobs(job_number, scheduled_at, weather_snapshot)')
      .eq('equipment_id', id)
      .order('captured_at', { ascending: true }),
    supabase.from('diagnostic_results')
      .select('severity, created_at, title')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false })
      .limit(100),
  ])

  if (!eqResult.data) notFound()

  const eq = eqResult.data
  const jobs = (jobEquipmentResult.data ?? [])
    .map((je) => je.jobs as unknown as { id: string; job_number: string; status: string; scheduled_at: string | null; service_category: string; completed_at: string | null } | null)
    .filter((j): j is { id: string; job_number: string; status: string; scheduled_at: string | null; service_category: string; completed_at: string | null } => j !== null)
  const readings = (readingsResult.data ?? []) as unknown as ReadingRow[]
  const diagnosticResults = (diagnosticsResult.data ?? []) as unknown as { severity: string; created_at: string; title: string }[]

  const healthBreakdown = computeHealthScore(
    readings.map(r => ({ value: r.value, captured_at: r.captured_at, is_flagged: r.is_flagged, reading_types: r.reading_types ? { key: r.reading_types.key } : null })),
    diagnosticResults,
    jobs.map(j => ({ completed_at: j.completed_at, service_category: j.service_category })),
  )

  // Persist health score for list-page display (fire-and-forget)
  void supabase.from('equipment').update({ health_score: healthBreakdown.total, health_score_at: new Date().toISOString() }).eq('id', id)

  const customer = eq.customers as unknown as Record<string, unknown>
  const site = eq.sites as unknown as Record<string, unknown>
  const canEdit = ['company_admin', 'dispatcher'].includes(membership?.role ?? '')

  // ─── Fleet comparison queries ───────────────────────────────────────────

  // 1. Same model (only if model_number is set)
  const hasModel = !!eq.model_number
  const [sameModelEqResult, sameTypeEqResult, preFailureEqResult] = await Promise.all([
    hasModel
      ? supabase.from('equipment').select('id').eq('tenant_id', tenantId).eq('model_number', eq.model_number!).neq('id', id).is('deleted_at', null)
      : Promise.resolve({ data: [] }),
    supabase.from('equipment').select('id').eq('tenant_id', tenantId).eq('unit_type', eq.unit_type).neq('id', id).is('deleted_at', null),
    supabase.from('equipment').select('id').eq('tenant_id', tenantId).in('status', ['retired', 'decommissioned']).is('deleted_at', null),
  ])

  const sameModelIds = (sameModelEqResult.data ?? []).map(e => e.id)
  const sameTypeIds = (sameTypeEqResult.data ?? []).map(e => e.id)
  const preFailureIds = (preFailureEqResult.data ?? []).map(e => e.id)

  // Fetch readings for each comparison group in parallel
  type FleetReading = { value: number | null; reading_types: { key: string; label: string; unit: string } | null }
  const readingSelect = 'value, reading_types(key, label, unit)'

  const [sameModelRaw, sameTypeRaw, healthyRaw, preFailureRaw] = await Promise.all([
    sameModelIds.length > 0
      ? supabase.from('readings').select(readingSelect).in('equipment_id', sameModelIds).not('value', 'is', null).limit(2000)
      : Promise.resolve({ data: [] }),
    sameTypeIds.length > 0
      ? supabase.from('readings').select(readingSelect).in('equipment_id', sameTypeIds).not('value', 'is', null).limit(2000)
      : Promise.resolve({ data: [] }),
    // Healthy: readings where is_flagged = false across this tenant's equipment
    supabase.from('readings').select(readingSelect).eq('tenant_id', tenantId).eq('is_flagged', false).not('value', 'is', null).limit(2000),
    preFailureIds.length > 0
      ? supabase.from('readings').select(readingSelect).in('equipment_id', preFailureIds).not('value', 'is', null).limit(2000)
      : Promise.resolve({ data: [] }),
  ])

  const sameModelStats = computeFleetStats((sameModelRaw.data ?? []) as unknown as FleetReading[])
  const sameTypeStats = computeFleetStats((sameTypeRaw.data ?? []) as unknown as FleetReading[])
  const healthyStats = computeFleetStats((healthyRaw.data ?? []) as unknown as FleetReading[])
  const preFailureStats = computeFleetStats((preFailureRaw.data ?? []) as unknown as FleetReading[])

  // Compute "this unit" stats
  const thisUnitRaw: FleetReading[] = readings
    .filter(r => r.value != null && r.reading_types)
    .map(r => ({ value: r.value, reading_types: r.reading_types ? { key: r.reading_types.key, label: r.reading_types.label, unit: r.reading_types.unit } : null }))
  const thisUnitStats = computeFleetStats(thisUnitRaw)

  // Build unified stats array per reading type
  const allKeys = new Set([
    ...Object.keys(thisUnitStats),
    ...Object.keys(sameModelStats),
    ...Object.keys(sameTypeStats),
    ...Object.keys(healthyStats),
    ...Object.keys(preFailureStats),
  ])
  const stats: ReadingTypeStats[] = []
  for (const key of allKeys) {
    // Get label/unit from readings
    const rt = readings.find(r => r.reading_types?.key === key)?.reading_types
    if (!rt) continue
    stats.push({
      key,
      label: rt.label,
      unit: rt.unit,
      thisUnit: thisUnitStats[key] ? { avg: thisUnitStats[key].avg, min: thisUnitStats[key].min, max: thisUnitStats[key].max, count: thisUnitStats[key].count } : null,
      sameModel: sameModelStats[key] ?? null,
      sameType: sameTypeStats[key] ?? null,
      healthy: healthyStats[key] ?? null,
      preFailure: preFailureStats[key] ?? null,
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────

  const details = [
    { label: 'Manufacturer', value: eq.manufacturer },
    { label: 'Model Number', value: eq.model_number ?? '—' },
    { label: 'Serial Number', value: eq.serial_number ?? '—' },
    { label: 'Unit Type', value: String(eq.unit_type).replace(/_/g, ' ') },
    { label: 'Refrigerant', value: eq.refrigerant_type ?? '—' },
    { label: 'Tonnage', value: eq.tonnage ? `${eq.tonnage} tons` : '—' },
    { label: 'Install Date', value: formatDate(eq.install_date) },
    { label: 'Warranty Expiry', value: formatDate(eq.warranty_expiry) },
    { label: 'Location', value: eq.location ?? '—' },
    { label: 'Status', value: eq.status },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${eq.manufacturer} ${eq.model_number ?? ''}`}
        subtitle={`${customer?.name ?? ''} · ${site?.city as string}, ${site?.state as string}`}
        actions={canEdit ? (
          <EquipmentEditForm
            equipmentId={id}
            defaultValues={{
              manufacturer: eq.manufacturer,
              model_number: eq.model_number ?? null,
              serial_number: eq.serial_number ?? null,
              unit_type: eq.unit_type,
              location: eq.location ?? null,
              refrigerant_type: eq.refrigerant_type ?? null,
              tonnage: eq.tonnage ?? null,
              install_date: eq.install_date ?? null,
              warranty_expiry: eq.warranty_expiry ?? null,
              status: eq.status,
              notes: eq.notes ?? null,
            }}
          />
        ) : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content: details + readings tabs */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Equipment Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-sm mt-0.5">
                      {label === 'Status' ? <StatusBadge status={String(value)} /> : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {readings.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Readings</CardTitle></CardHeader>
              <CardContent>
                <EquipmentTabs
                  readings={readings}
                  stats={stats}
                  hasModelComparison={sameModelIds.length > 0}
                />
              </CardContent>
            </Card>
          )}

          <AiSummaryCard
            equipmentId={id}
            initialSummary={(eq.ai_summary ?? null) as AiSummary | null}
            hasExistingResearch={!!eq.research_data}
          />

          <ResearchCard
            equipmentId={id}
            manufacturer={eq.manufacturer}
            modelNumber={eq.model_number ?? null}
            initialResearch={(eq.research_data ?? null) as EquipmentResearch | null}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <HealthScoreCard breakdown={healthBreakdown} />

          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{customer?.name as string}</p>
              <p className="text-sm text-muted-foreground">{customer?.phone as string}</p>
              <p className="text-sm text-muted-foreground">{customer?.email as string}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Site</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{site?.name as string}</p>
              <p className="text-sm text-muted-foreground">{site?.address_line1 as string}</p>
              <p className="text-sm text-muted-foreground">{site?.city as string}, {site?.state as string} {site?.zip as string}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Service History</CardTitle></CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service history</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm font-medium capitalize">{job.service_category.replace(/_/g, ' ')}</p>
                        {job.scheduled_at && (
                          <p className="text-xs text-muted-foreground">{formatDateTime(job.scheduled_at)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
