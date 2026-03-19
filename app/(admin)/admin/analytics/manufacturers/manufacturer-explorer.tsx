'use client'

import { useState, useMemo } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell, LineChart, Line, Legend,
} from 'recharts'
import { ChevronUp, ChevronDown, AlertTriangle, TrendingDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FleetBrief } from './fleet-brief'
import { RiskProfileSheet } from './risk-profile-sheet'

// ─── Types ───────────────────────────────────────────────────────────────────

interface EquipmentRecord {
  id: string
  manufacturer: string
  model_number: string | null
  unit_type: string
  install_date: string | null
  status: string
  health_score: number | null
  state: string
}

interface DiagRecord {
  equipment_id: string
  title: string
  severity: string
  manufacturer: string
}

interface ManufacturerExplorerProps {
  equipment: EquipmentRecord[]
  diagnostics: DiagRecord[]
}

type Tab = 'overview' | 'models' | 'age' | 'failures'
type ModelSort = 'health' | 'units' | 'risk'

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

function ageBucket(installDate: string | null): string {
  if (!installDate) return 'Unknown'
  const years = (Date.now() - new Date(installDate).getTime()) / (365.25 * 24 * 3600 * 1000)
  if (years < 3)  return '0–3 yrs'
  if (years < 6)  return '3–6 yrs'
  if (years < 10) return '6–10 yrs'
  return '10+ yrs'
}

const AGE_ORDER = ['0–3 yrs', '3–6 yrs', '6–10 yrs', '10+ yrs']

// Stable color per manufacturer (simple hash → hue)
function mfgColor(name: string): string {
  let h = 0
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360
  return `hsl(${h}, 65%, 50%)`
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function ManufacturerExplorer({ equipment, diagnostics }: ManufacturerExplorerProps) {
  const [tab, setTab] = useState<Tab>('overview')
  const [mfgFilter, setMfgFilter] = useState('all')
  const [modelSort, setModelSort] = useState<ModelSort>('health')
  const [modelSortDir, setModelSortDir] = useState<'asc' | 'desc'>('asc')

  const allMfg = useMemo(() =>
    [...new Set(equipment.map(e => e.manufacturer))].sort(),
    [equipment])

  const filtered = useMemo(() =>
    mfgFilter === 'all' ? equipment : equipment.filter(e => e.manufacturer === mfgFilter),
    [equipment, mfgFilter])

  // ── Manufacturer summary stats ────────────────────────────────────────────
  const mfgStats = useMemo(() => {
    const map: Record<string, { count: number; sumScore: number; scored: number; atRisk: number; failed: number }> = {}
    for (const e of equipment) {
      if (!map[e.manufacturer]) map[e.manufacturer] = { count: 0, sumScore: 0, scored: 0, atRisk: 0, failed: 0 }
      map[e.manufacturer].count++
      if (e.health_score != null) {
        map[e.manufacturer].sumScore += e.health_score
        map[e.manufacturer].scored++
        if (e.health_score < 50) map[e.manufacturer].atRisk++
      }
      if (e.status !== 'active') map[e.manufacturer].failed++
    }
    return Object.entries(map)
      .map(([m, v]) => ({
        manufacturer: m,
        count: v.count,
        avg_health: v.scored > 0 ? Math.round(v.sumScore / v.scored) : null,
        at_risk: v.atRisk,
        failed: v.failed,
        failure_rate: v.count > 0 ? Math.round(v.failed / v.count * 100) : 0,
      }))
      .sort((a, b) => (a.avg_health ?? 999) - (b.avg_health ?? 999))
  }, [equipment])

  // ── Model-level stats ─────────────────────────────────────────────────────
  const modelStats = useMemo(() => {
    const map: Record<string, { manufacturer: string; model: string; count: number; sumScore: number; scored: number; atRisk: number }> = {}
    for (const e of filtered) {
      const model = e.model_number ?? '(unlisted)'
      const key = `${e.manufacturer}||${model}`
      if (!map[key]) map[key] = { manufacturer: e.manufacturer, model, count: 0, sumScore: 0, scored: 0, atRisk: 0 }
      map[key].count++
      if (e.health_score != null) {
        map[key].sumScore += e.health_score
        map[key].scored++
        if (e.health_score < 50) map[key].atRisk++
      }
    }
    const rows = Object.values(map).map(m => ({
      ...m,
      avg_health: m.scored > 0 ? Math.round(m.sumScore / m.scored) : null,
    }))

    const dir = modelSortDir === 'asc' ? 1 : -1
    return rows.sort((a, b) => {
      if (modelSort === 'health') return ((a.avg_health ?? 999) - (b.avg_health ?? 999)) * dir
      if (modelSort === 'units')  return (b.count - a.count) * dir
      if (modelSort === 'risk')   return (b.atRisk - a.atRisk) * dir
      return 0
    })
  }, [filtered, modelSort, modelSortDir])

  // ── Age vs health (by manufacturer × age bucket) ─────────────────────────
  const ageData = useMemo(() => {
    // For each age bucket, compute avg health per manufacturer
    const map: Record<string, Record<string, { sum: number; count: number }>> = {}
    for (const e of equipment) {
      if (e.health_score == null) continue
      const bucket = ageBucket(e.install_date)
      const mfg = e.manufacturer
      if (!map[bucket]) map[bucket] = {}
      if (!map[bucket][mfg]) map[bucket][mfg] = { sum: 0, count: 0 }
      map[bucket][mfg].sum += e.health_score
      map[bucket][mfg].count++
    }
    return AGE_ORDER.map(bucket => {
      const row: Record<string, number | string> = { bucket }
      for (const mfg of allMfg) {
        const v = map[bucket]?.[mfg]
        if (v && v.count > 0) row[mfg] = Math.round(v.sum / v.count)
      }
      return row
    })
  }, [equipment, allMfg])

  // ── Common failure patterns ───────────────────────────────────────────────
  const failurePatterns = useMemo(() => {
    // Group by manufacturer + normalized title (first 60 chars)
    const map: Record<string, { manufacturer: string; title: string; count: number; criticalCount: number }> = {}
    const eqFilter = mfgFilter === 'all' ? diagnostics : diagnostics.filter(d => d.manufacturer === mfgFilter)
    for (const d of eqFilter) {
      const title = d.title.slice(0, 70)
      const key = `${d.manufacturer}||${title}`
      if (!map[key]) map[key] = { manufacturer: d.manufacturer, title, count: 0, criticalCount: 0 }
      map[key].count++
      if (d.severity === 'critical') map[key].criticalCount++
    }
    return Object.values(map)
      .sort((a, b) => b.criticalCount - a.criticalCount || b.count - a.count)
      .slice(0, 30)
  }, [diagnostics, mfgFilter])

  // Group failure patterns by manufacturer
  const patternsByMfg = useMemo(() => {
    const grouped: Record<string, typeof failurePatterns> = {}
    for (const p of failurePatterns) {
      if (!grouped[p.manufacturer]) grouped[p.manufacturer] = []
      grouped[p.manufacturer].push(p)
    }
    return grouped
  }, [failurePatterns])

  function toggleModelSort(col: ModelSort) {
    if (modelSort === col) setModelSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setModelSort(col); setModelSortDir('asc') }
  }

  const TABS: { key: Tab; label: string }[] = [
    { key: 'overview',  label: 'Brand Overview' },
    { key: 'models',    label: 'Model Reliability' },
    { key: 'age',       label: 'Age vs Health' },
    { key: 'failures',  label: 'Failure Patterns' },
  ]

  // Build fleet brief input from already-computed stats
  const fleetBriefData = useMemo(() => ({
    totalUnits: equipment.length,
    manufacturers: mfgStats,
    topFailures: failurePatterns.slice(0, 15),
    ageData,
    allMfg,
  }), [equipment.length, mfgStats, failurePatterns, ageData, allMfg])

  return (
    <div className="space-y-4">
      {/* Fleet Intelligence Brief */}
      <FleetBrief data={fleetBriefData} />

      {/* Controls */}
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
          value={mfgFilter}
          onChange={e => setMfgFilter(e.target.value)}
          className="h-8 rounded-lg border border-border text-sm px-2 bg-background"
        >
          <option value="all">All Manufacturers</option>
          {allMfg.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
        <span className="text-xs text-muted-foreground ml-auto">{filtered.length} units</span>
      </div>

      {/* ── BRAND OVERVIEW ──────────────────────────────────────────────── */}
      {tab === 'overview' && (
        <div className="space-y-6">
          {/* Health comparison chart */}
          <div className="border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Average Health Score by Manufacturer</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Sorted worst → best across all tenants. Lower scores indicate higher field failure rates.
            </p>
            <ResponsiveContainer width="100%" height={Math.max(160, mfgStats.length * 48)}>
              <BarChart data={mfgStats} layout="vertical" barCategoryGap="20%">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <YAxis type="category" dataKey="manufacturer" tick={{ fontSize: 12 }} width={80} />
                <Tooltip
                  formatter={(v, _, p) => [
                    `${v} avg · ${p.payload.count} units · ${p.payload.at_risk} at risk`
                  ]}
                />
                <Bar dataKey="avg_health" radius={[0, 3, 3, 0]}>
                  {mfgStats.map((m, i) => (
                    <Cell key={i} fill={healthColor(m.avg_health)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary table */}
          <div className="border border-border rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  {['Manufacturer', 'Total Units', 'Avg Health', 'At Risk (<50)', 'Retired/Decomm', 'Failure Rate', ''].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {mfgStats.map(m => {
                  const mfgModels = modelStats.filter(ms => ms.manufacturer === m.manufacturer)
                  const mfgAgeHealth = ageData.map(d => ({
                    bucket: d.bucket as string,
                    avg_health: (d[m.manufacturer] as number | undefined) ?? null,
                  }))
                  const mfgFailures = failurePatterns.filter(p => p.manufacturer === m.manufacturer)

                  const profileData = {
                    manufacturer: m.manufacturer,
                    count: m.count,
                    avg_health: m.avg_health,
                    at_risk: m.at_risk,
                    failure_rate: m.failure_rate,
                    models: mfgModels.map(ms => ({ model: ms.model, count: ms.count, avg_health: ms.avg_health ?? null })),
                    ageHealth: mfgAgeHealth,
                    topFailures: mfgFailures,
                  }

                  return (
                    <tr key={m.manufacturer} className="hover:bg-muted/20">
                      <td className="px-4 py-2.5 font-semibold">{m.manufacturer}</td>
                      <td className="px-4 py-2.5">{m.count}</td>
                      <td className="px-4 py-2.5">
                        <span className="font-semibold" style={{ color: healthColor(m.avg_health) }}>
                          {m.avg_health ?? '—'}
                        </span>
                        {m.avg_health != null && (
                          <span className="text-xs text-muted-foreground ml-1.5">{healthLabel(m.avg_health)}</span>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        {m.at_risk > 0
                          ? <span className="text-orange-600 font-medium">{m.at_risk}</span>
                          : <span className="text-muted-foreground">0</span>}
                      </td>
                      <td className="px-4 py-2.5 text-muted-foreground">{m.failed}</td>
                      <td className="px-4 py-2.5">
                        <span className={m.failure_rate > 20 ? 'text-red-600 font-medium' : 'text-muted-foreground'}>
                          {m.failure_rate}%
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <RiskProfileSheet data={profileData} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── MODEL RELIABILITY ────────────────────────────────────────────── */}
      {tab === 'models' && (
        <div className="border border-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-border bg-muted/30">
            <p className="text-xs text-muted-foreground">
              Model-level health across all tenants. Sorted worst → best by default. Models with low health across multiple tenants point to a design or manufacturing quality issue.
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Manufacturer</th>
                  <th className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground">Model</th>
                  {([
                    ['units',  'Units'],
                    ['health', 'Avg Health'],
                    ['risk',   'At Risk'],
                  ] as [ModelSort, string][]).map(([key, label]) => (
                    <th
                      key={key}
                      className="text-left px-4 py-2.5 text-xs font-semibold text-muted-foreground cursor-pointer hover:text-foreground select-none whitespace-nowrap"
                      onClick={() => toggleModelSort(key)}
                    >
                      <span className="flex items-center gap-1">
                        {label}
                        {modelSort === key
                          ? modelSortDir === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />
                          : null}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {modelStats.map((m, i) => (
                  <tr key={i} className="hover:bg-muted/20">
                    <td className="px-4 py-2.5 text-muted-foreground text-xs">{m.manufacturer}</td>
                    <td className="px-4 py-2.5 font-medium font-mono text-xs">{m.model}</td>
                    <td className="px-4 py-2.5">{m.count}</td>
                    <td className="px-4 py-2.5">
                      {m.avg_health != null ? (
                        <>
                          <span className="font-semibold" style={{ color: healthColor(m.avg_health) }}>
                            {m.avg_health}
                          </span>
                          <span className="text-xs text-muted-foreground ml-1.5">{healthLabel(m.avg_health)}</span>
                        </>
                      ) : '—'}
                    </td>
                    <td className="px-4 py-2.5">
                      {m.atRisk > 0
                        ? <span className="text-orange-600 font-medium">{m.atRisk}</span>
                        : <span className="text-muted-foreground">0</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── AGE VS HEALTH ────────────────────────────────────────────────── */}
      {tab === 'age' && (
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-4">
            <h3 className="font-semibold text-sm mb-1">Health Score by Unit Age</h3>
            <p className="text-xs text-muted-foreground mb-4">
              How each manufacturer's equipment health degrades over time. Steeper drops indicate faster wear — useful for warranty and replacement planning conversations.
            </p>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="bucket" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                {allMfg.map(mfg => (
                  <Line
                    key={mfg}
                    type="monotone"
                    dataKey={mfg}
                    stroke={mfgColor(mfg)}
                    strokeWidth={2}
                    dot={{ r: 4 }}
                    connectNulls
                  />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="border border-border rounded-xl p-4 bg-muted/20">
            <h3 className="text-sm font-semibold mb-2">How to read this</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              A manufacturer with a steep downward slope (health dropping sharply between age brackets) indicates
              faster-than-normal degradation — possibly from design limitations, parts quality, or the types of
              environments where those units are installed. A flat or gradual slope suggests more durable design.
              Use this to benchmark replacement recommendation timelines by brand.
            </p>
          </div>
        </div>
      )}

      {/* ── FAILURE PATTERNS ─────────────────────────────────────────────── */}
      {tab === 'failures' && (
        <div className="space-y-4">
          {Object.keys(patternsByMfg).length === 0 ? (
            <div className="border border-border rounded-xl p-10 text-center text-muted-foreground">
              <p>No diagnostic data available for the current filter.</p>
            </div>
          ) : (
            Object.entries(patternsByMfg).map(([mfg, patterns]) => (
              <div key={mfg} className="border border-border rounded-xl overflow-hidden">
                <div className="px-4 py-3 bg-muted/30 border-b border-border flex items-center justify-between">
                  <h3 className="font-semibold text-sm">{mfg}</h3>
                  <span className="text-xs text-muted-foreground">{patterns.length} issue pattern{patterns.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="divide-y divide-border">
                  {patterns.slice(0, 8).map((p, i) => (
                    <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {p.criticalCount > 0 && (
                          <span className="flex items-center gap-1 text-xs text-red-600 font-medium">
                            <AlertTriangle className="h-3 w-3" />
                            {p.criticalCount} critical
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground bg-muted rounded px-1.5 py-0.5">
                          {p.count} occurrence{p.count !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}
