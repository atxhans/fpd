'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Cell, Legend,
} from 'recharts'
import {
  AlertTriangle, TrendingDown, MapPin, Users,
  Activity, Clock, ChevronUp, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EquipmentRecord {
  id: string
  manufacturer: string
  model_number: string | null
  unit_type: string
  install_date: string | null
  status: string
  health_score: number | null
  tenant_name: string
  customer_name: string
  state: string
  city: string
  flagged_90d: number
  critical_90d: number
}

interface FleetExplorerProps {
  equipment: EquipmentRecord[]
  monthlyData: { month: string; flagged: number }[]
}

type Tab = 'overview' | 'geographic' | 'customers' | 'forecast'
type CustomerSort = 'health' | 'risk' | 'units' | 'flags'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function healthColor(score: number | null): string {
  if (score == null) return '#94a3b8'
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 50) return '#eab308'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

function healthLabel(score: number | null): string {
  if (score == null) return '—'
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

function unitAge(installDate: string | null): number {
  if (!installDate) return 0
  return (Date.now() - new Date(installDate).getTime()) / (365.25 * 24 * 3600 * 1000)
}

type Urgency = 'critical' | 'high' | 'medium' | 'low'

function predictFailure(
  score: number | null,
  flagged90d: number,
  installDate: string | null,
): { label: string; urgency: Urgency } {
  if (score == null) return { label: '—', urgency: 'low' }
  if (score < 30) return { label: 'Immediate action', urgency: 'critical' }

  // Decay: ~8 pts/yr base, +2 pts/yr per recent-flag event (cap 5)
  const decayRate = 8 + Math.min(flagged90d, 5) * 2
  // Older units decline faster
  const age = unitAge(installDate)
  const ageFactor = age > 10 ? 1.6 : age > 7 ? 1.3 : 1.0
  const yearsTo = (score - 30) / (decayRate * ageFactor)

  if (yearsTo < 0.5) return { label: '< 6 months', urgency: 'critical' }
  if (yearsTo < 1)   return { label: '6–12 months', urgency: 'high' }
  if (yearsTo < 2)   return { label: '1–2 years',   urgency: 'medium' }
  if (yearsTo < 4)   return { label: '2–4 years',   urgency: 'low' }
  return { label: '4+ years', urgency: 'low' }
}

const URGENCY_CLASSES: Record<Urgency, string> = {
  critical: 'bg-red-100 text-red-700 border-red-200',
  high:     'bg-orange-100 text-orange-700 border-orange-200',
  medium:   'bg-yellow-100 text-yellow-700 border-yellow-200',
  low:      'bg-green-100 text-green-700 border-green-200',
}

// ─── KPI Card ────────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent }: {
  label: string; value: string | number; sub?: string; accent?: string
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={cn('text-2xl font-bold tabular-nums', accent)}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FleetExplorer({ equipment, monthlyData }: FleetExplorerProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [stateFilter, setStateFilter] = useState('all')
  const [mfgFilter, setMfgFilter] = useState('all')
  const [customerSort, setCustomerSort] = useState<CustomerSort>('health')
  const [customerSortDir, setCustomerSortDir] = useState<'asc' | 'desc'>('asc')

  // Filter options
  const allStates = useMemo(() =>
    [...new Set(equipment.map(e => e.state))].filter(s => s !== '—').sort(),
    [equipment])
  const allMfg = useMemo(() =>
    [...new Set(equipment.map(e => e.manufacturer))].sort(),
    [equipment])

  // Filtered dataset
  const filtered = useMemo(() =>
    equipment.filter(e =>
      (stateFilter === 'all' || e.state === stateFilter) &&
      (mfgFilter === 'all' || e.manufacturer === mfgFilter)
    ),
    [equipment, stateFilter, mfgFilter])

  const scored = filtered.filter(e => e.health_score != null)
  const totalUnits = filtered.length
  const scoredCount = scored.length
  const atRiskCount = scored.filter(e => e.health_score! < 50).length
  const criticalCount = scored.filter(e => e.health_score! < 30).length
  const avgHealth = scoredCount > 0
    ? Math.round(scored.reduce((s, e) => s + e.health_score!, 0) / scoredCount)
    : null

  // Health distribution histogram
  const healthBuckets = useMemo(() => {
    const buckets = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}–${i * 10 + 9}`,
      count: 0,
      midpoint: i * 10 + 5,
    }))
    for (const e of scored) {
      const idx = Math.min(Math.floor(e.health_score! / 10), 9)
      buckets[idx].count++
    }
    return buckets
  }, [scored])

  // Manufacturer health
  const mfgStats = useMemo(() => {
    const map: Record<string, { count: number; sum: number }> = {}
    for (const e of scored) {
      if (!map[e.manufacturer]) map[e.manufacturer] = { count: 0, sum: 0 }
      map[e.manufacturer].count++
      map[e.manufacturer].sum += e.health_score!
    }
    return Object.entries(map)
      .map(([m, v]) => ({ manufacturer: m, avg: Math.round(v.sum / v.count), count: v.count }))
      .sort((a, b) => a.avg - b.avg)
  }, [scored])

  // State stats
  const stateStats = useMemo(() => {
    const map: Record<string, { state: string; count: number; sumScore: number; atRisk: number }> = {}
    for (const e of filtered) {
      if (!map[e.state]) map[e.state] = { state: e.state, count: 0, sumScore: 0, atRisk: 0 }
      map[e.state].count++
      if (e.health_score != null) {
        map[e.state].sumScore += e.health_score
        if (e.health_score < 50) map[e.state].atRisk++
      }
    }
    return Object.values(map)
      .map(s => ({ ...s, avg_health: s.count > 0 ? Math.round(s.sumScore / s.count) : 0 }))
      .filter(s => s.state !== '—' && s.count >= 1)
      .sort((a, b) => a.avg_health - b.avg_health)
  }, [filtered])

  // Customer stats
  const customerStats = useMemo(() => {
    const map: Record<string, {
      customer: string; tenant: string; count: number; sumScore: number;
      scored: number; atRisk: number; critical: number; flags90d: number;
      minInstall: string | null
    }> = {}
    for (const e of filtered) {
      const key = `${e.customer_name}||${e.tenant_name}`
      if (!map[key]) map[key] = {
        customer: e.customer_name, tenant: e.tenant_name,
        count: 0, sumScore: 0, scored: 0, atRisk: 0, critical: 0,
        flags90d: 0, minInstall: null,
      }
      map[key].count++
      map[key].flags90d += e.flagged_90d
      map[key].critical += e.critical_90d
      if (e.health_score != null) {
        map[key].sumScore += e.health_score
        map[key].scored++
        if (e.health_score < 50) map[key].atRisk++
      }
      if (e.install_date) {
        if (!map[key].minInstall || e.install_date < map[key].minInstall!) {
          map[key].minInstall = e.install_date
        }
      }
    }
    const rows = Object.values(map).map(c => ({
      ...c,
      avg_health: c.scored > 0 ? Math.round(c.sumScore / c.scored) : null,
      oldest_age: c.minInstall ? Math.floor(unitAge(c.minInstall)) : null,
    }))

    const dir = customerSortDir === 'asc' ? 1 : -1
    return rows.sort((a, b) => {
      if (customerSort === 'health')  return ((a.avg_health ?? 999) - (b.avg_health ?? 999)) * dir
      if (customerSort === 'risk')    return (b.atRisk - a.atRisk) * dir
      if (customerSort === 'units')   return (b.count - a.count) * dir
      if (customerSort === 'flags')   return (b.flags90d - a.flags90d) * dir
      return 0
    })
  }, [filtered, customerSort, customerSortDir])

  // At-risk units for Forecast tab
  const atRiskUnits = useMemo(() =>
    filtered
      .filter(e => e.status === 'active' && e.health_score != null && e.health_score < 65)
      .sort((a, b) => (a.health_score ?? 100) - (b.health_score ?? 100)),
    [filtered])

  function toggleSort(col: CustomerSort) {
    if (customerSort === col) setCustomerSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setCustomerSort(col); setCustomerSortDir('asc') }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',    label: 'Overview' },
    { key: 'geographic',  label: 'Geographic & Seasonal' },
    { key: 'customers',   label: 'Customer Analysis' },
    { key: 'forecast',    label: 'Failure Forecast' },
  ]

  return (
    <div className="space-y-4">
      {/* Filters + tabs */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex rounded-lg border border-border overflow-hidden shrink-0">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 text-sm font-medium transition-colors',
                tab === t.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-muted-foreground hover:bg-muted'
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <select
          value={stateFilter}
          onChange={e => setStateFilter(e.target.value)}
          className="h-8 rounded-lg border border-border text-sm px-2 bg-background"
        >
          <option value="all">All States</option>
          {allStates.map(s => <option key={s} value={s}>{s}</option>)}
        </select>

        <select
          value={mfgFilter}
          onChange={e => setMfgFilter(e.target.value)}
          className="h-8 rounded-lg border border-border text-sm px-2 bg-background"
        >
          <option value="all">All Manufacturers</option>
          {allMfg.map(m => <option key={m} value={m}>{m}</option>)}
        </select>

        <span className="text-xs text-muted-foreground ml-auto">
          {filtered.length} of {equipment.length} units
        </span>
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* KPI row */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard label="Total Units" value={totalUnits} />
            <KpiCard
              label="Fleet Avg Health"
              value={avgHealth ?? '—'}
              sub={avgHealth ? healthLabel(avgHealth) : undefined}
              accent={avgHealth ? undefined : undefined}
            />
            <KpiCard label="Scored Units" value={scoredCount} sub={`${Math.round(scoredCount / totalUnits * 100)}% of fleet`} />
            <KpiCard label="At Risk" value={atRiskCount} sub="Health < 50" accent={atRiskCount > 0 ? 'text-orange-600' : undefined} />
            <KpiCard label="Critical" value={criticalCount} sub="Health < 30" accent={criticalCount > 0 ? 'text-red-600' : undefined} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health distribution */}
            <div className="border border-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-4">Health Score Distribution</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={healthBuckets} barCategoryGap="10%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="range" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`${v} units`]} />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {healthBuckets.map((b, i) => (
                      <Cell key={i} fill={healthColor(b.midpoint)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Manufacturer health */}
            <div className="border border-border rounded-xl p-4">
              <h3 className="font-semibold text-sm mb-4">Average Health by Manufacturer</h3>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={mfgStats} layout="vertical" barCategoryGap="15%">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                  <YAxis type="category" dataKey="manufacturer" tick={{ fontSize: 11 }} width={70} />
                  <Tooltip formatter={(v, _, p) => [`${v} (${p.payload.count} units)`]} />
                  <Bar dataKey="avg" radius={[0, 3, 3, 0]}>
                    {mfgStats.map((m, i) => (
                      <Cell key={i} fill={healthColor(m.avg)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Unit type breakdown */}
          <div className="border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-3">Unit Type Summary</h3>
            <div className="flex flex-wrap gap-3">
              {[...new Set(filtered.map(e => e.unit_type))].map(type => {
                const units = filtered.filter(e => e.unit_type === type)
                const scored = units.filter(e => e.health_score != null)
                const avg = scored.length > 0
                  ? Math.round(scored.reduce((s, e) => s + e.health_score!, 0) / scored.length)
                  : null
                return (
                  <div key={type} className="border border-border rounded-lg px-4 py-2.5 text-sm">
                    <p className="font-medium capitalize">{type.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-muted-foreground">{units.length} units</p>
                    {avg != null && (
                      <p className="text-xs font-semibold mt-0.5" style={{ color: healthColor(avg) }}>
                        {avg} avg health
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── GEOGRAPHIC & SEASONAL ─────────────────────────────────────────── */}
      {tab === 'geographic' && (
        <div className="space-y-6">
          {/* State health chart */}
          <div className="border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Average Health Score by State</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Sorted worst → best. States with lower health indicate harder climates, older fleets, or maintenance gaps.
            </p>
            <ResponsiveContainer width="100%" height={Math.max(200, stateStats.length * 36)}>
              <BarChart data={stateStats} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="state" tick={{ fontSize: 12 }} width={36} />
                <Tooltip
                  formatter={(v, _, p) => [
                    `${v} avg health · ${p.payload.count} units · ${p.payload.atRisk} at risk`
                  ]}
                />
                <Bar dataKey="avg_health" radius={[0, 3, 3, 0]}>
                  {stateStats.map((s, i) => (
                    <Cell key={i} fill={healthColor(s.avg_health)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* State detail table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['State', 'Units', 'Avg Health', 'At Risk (<50)', 'Risk %'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stateStats.map(s => (
                  <tr key={s.state} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 font-medium">{s.state}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{s.count}</td>
                    <td className="px-4 py-2.5">
                      <span className="font-semibold" style={{ color: healthColor(s.avg_health) }}>
                        {s.avg_health}
                      </span>
                      <span className="text-xs text-muted-foreground ml-1.5">{healthLabel(s.avg_health)}</span>
                    </td>
                    <td className="px-4 py-2.5 text-orange-600 font-medium">{s.atRisk}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">
                      {s.count > 0 ? `${Math.round(s.atRisk / s.count * 100)}%` : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Seasonal failure chart */}
          <div className="border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Seasonal Failure Pattern</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Flagged readings by month across all years. Peaks indicate when equipment is under the most stress —
              typically summer heat for cooling and winter cold for heat pumps.
            </p>
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => [`${v} flagged readings`]} />
                <Line
                  type="monotone"
                  dataKey="flagged"
                  stroke="#f97316"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#f97316' }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ── CUSTOMER ANALYSIS ─────────────────────────────────────────────── */}
      {tab === 'customers' && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl overflow-hidden">
            <div className="px-4 py-3 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">
                Click column headers to sort. Flags/unit (90d) measures recent maintenance burden — high values suggest
                active issues. Oldest unit age correlates with near-term replacement planning.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Customer</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Contractor</th>
                    {([
                      ['units',   'Units'],
                      ['health',  'Avg Health'],
                      ['risk',    'At Risk'],
                      ['flags',   'Flags/unit (90d)'],
                    ] as [CustomerSort, string][]).map(([key, label]) => (
                      <th
                        key={key}
                        className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                        onClick={() => toggleSort(key)}
                      >
                        <span className="flex items-center gap-1">
                          {label}
                          {customerSort === key
                            ? customerSortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                            : null}
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Oldest Unit</th>
                    <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Critical Diags (90d)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {customerStats.map((c, i) => {
                    const flagsPerUnit = c.count > 0 ? (c.flags90d / c.count).toFixed(1) : '0'
                    return (
                      <tr key={i} className="hover:bg-muted/20">
                        <td className="px-4 py-2.5 font-medium">{c.customer}</td>
                        <td className="px-4 py-2.5 text-xs text-muted-foreground">{c.tenant}</td>
                        <td className="px-4 py-2.5">{c.count}</td>
                        <td className="px-4 py-2.5">
                          {c.avg_health != null ? (
                            <span className="font-semibold" style={{ color: healthColor(c.avg_health) }}>
                              {c.avg_health}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.atRisk > 0
                            ? <span className="text-orange-600 font-semibold">{c.atRisk}</span>
                            : <span className="text-muted-foreground">0</span>}
                        </td>
                        <td className="px-4 py-2.5">
                          {parseFloat(flagsPerUnit) > 2
                            ? <span className="text-red-600 font-semibold">{flagsPerUnit}</span>
                            : parseFloat(flagsPerUnit) > 0.5
                              ? <span className="text-orange-500">{flagsPerUnit}</span>
                              : <span className="text-muted-foreground">{flagsPerUnit}</span>}
                        </td>
                        <td className="px-4 py-2.5 text-muted-foreground text-xs">
                          {c.oldest_age != null ? `${c.oldest_age}y` : '—'}
                        </td>
                        <td className="px-4 py-2.5">
                          {c.critical > 0
                            ? <span className="text-red-600 font-semibold">{c.critical}</span>
                            : <span className="text-muted-foreground">0</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Correlation insight */}
          <div className="border border-border rounded-xl p-4 bg-muted/20">
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Correlation Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-muted-foreground">
              <div>
                <p className="font-medium text-foreground mb-1">High flags/unit → active failure</p>
                <p>Customers with ≥2 flagged readings per unit in the last 90 days likely have ongoing issues (leaks, electrical, fouling). Prioritise site visits and root-cause analysis.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Old fleet age → replacement planning</p>
                <p>Units &gt;10 years old are past typical design life. Customers with old average fleet ages should be in active replacement conversation.</p>
              </div>
              <div>
                <p className="font-medium text-foreground mb-1">Low avg health + 0 flags = stale data</p>
                <p>A customer with poor health scores but no recent flags may simply not have had recent service visits — their data is stale, not necessarily improving.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── FAILURE FORECAST ──────────────────────────────────────────────── */}
      {tab === 'forecast' && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-4 bg-amber-50 border-amber-200">
            <p className="text-xs text-amber-800">
              <strong>Methodology:</strong> Estimated time to critical (&lt;30) is based on current health score,
              recent flagged reading rate (last 90 days), and unit age. Older units and units with active issues
              are weighted for faster decline. This is a directional estimate, not a precise prediction.
            </p>
          </div>

          {atRiskUnits.length === 0 ? (
            <div className="border border-border rounded-xl p-10 text-center text-muted-foreground">
              <p>No units with health score below 65 in the current filter.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {atRiskUnits.map((eq) => {
                const pred = predictFailure(eq.health_score, eq.flagged_90d, eq.install_date)
                const age = unitAge(eq.install_date)
                return (
                  <div key={eq.id} className="border border-border rounded-xl p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-semibold">
                            {eq.manufacturer} {eq.model_number ?? eq.unit_type}
                          </p>
                          <span className="text-xs text-muted-foreground font-mono">{eq.id.slice(0, 8)}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {eq.customer_name}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {eq.city}, {eq.state}
                          </span>
                          {age > 0 && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {Math.round(age)}y old
                            </span>
                          )}
                          <span className="text-muted-foreground capitalize">{eq.unit_type.replace(/_/g, ' ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {/* Health score */}
                        <div className="text-center">
                          <p className="text-2xl font-bold tabular-nums" style={{ color: healthColor(eq.health_score) }}>
                            {eq.health_score}
                          </p>
                          <p className="text-xs text-muted-foreground">{healthLabel(eq.health_score)}</p>
                        </div>

                        {/* Prediction badge */}
                        <div className={cn(
                          'rounded-lg border px-3 py-2 text-center min-w-[110px]',
                          URGENCY_CLASSES[pred.urgency]
                        )}>
                          <p className="text-xs font-semibold">Est. to critical</p>
                          <p className="text-sm font-bold mt-0.5">{pred.label}</p>
                        </div>
                      </div>
                    </div>

                    {/* Contributing factors */}
                    {(eq.flagged_90d > 0 || eq.critical_90d > 0) && (
                      <div className="mt-2.5 flex gap-2 flex-wrap">
                        {eq.flagged_90d > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-orange-50 text-orange-700 border border-orange-200 rounded px-2 py-0.5">
                            <AlertTriangle className="h-3 w-3" />
                            {eq.flagged_90d} flagged reading{eq.flagged_90d !== 1 ? 's' : ''} (90d)
                          </span>
                        )}
                        {eq.critical_90d > 0 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-red-50 text-red-700 border border-red-200 rounded px-2 py-0.5">
                            <TrendingDown className="h-3 w-3" />
                            {eq.critical_90d} critical diagnostic{eq.critical_90d !== 1 ? 's' : ''} (90d)
                          </span>
                        )}
                        {age > 10 && (
                          <span className="inline-flex items-center gap-1 text-xs bg-slate-50 text-slate-600 border border-slate-200 rounded px-2 py-0.5">
                            <Clock className="h-3 w-3" />
                            Past typical design life ({Math.round(age)}y)
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
