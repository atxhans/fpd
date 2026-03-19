'use client'

import { useState, useMemo } from 'react'
import {
  ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, BarChart, Bar, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { formatDateTime } from '@/lib/utils'
import { weatherEmoji, type WeatherSnapshot } from '@/lib/openweather'
import { ReadingsGrid } from '@/components/shared/readings-grid'
import { computeTrends } from '@/lib/health/trend'
import type { TrendResult } from '@/types/health'

// ─── Types ─────────────────────────────────────────────────────────────────

export type ReadingRow = {
  id: string
  value: number | null
  bool_value: boolean | null
  text_value: string | null
  captured_at: string
  job_id: string
  is_flagged: boolean
  reading_type_id: string
  reading_types: {
    key: string
    label: string
    unit: string
    category: string | null
    normal_min: number | null
    normal_max: number | null
  } | null
  jobs: {
    job_number: string
    scheduled_at: string | null
    weather_snapshot: WeatherSnapshot | null
  } | null
}

export type ReadingTypeStats = {
  key: string
  label: string
  unit: string
  thisUnit: { avg: number; min: number; max: number; count: number } | null
  sameModel: { avg: number; min: number; max: number; p25: number; p75: number; count: number } | null
  sameType: { avg: number; min: number; max: number; p25: number; p75: number; count: number } | null
  healthy: { avg: number; min: number; max: number; p25: number; p75: number; count: number } | null
  preFailure: { avg: number; min: number; max: number; p25: number; p75: number; count: number } | null
}

export type EquipmentTabsProps = {
  readings: ReadingRow[]
  stats: ReadingTypeStats[]
  hasModelComparison: boolean
}

// ─── Chart colours ─────────────────────────────────────────────────────────

const COLOURS = [
  '#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#a855f7',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
]

const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: 'var(--card)',
    border: '1px solid var(--border)',
    borderRadius: '0.5rem',
    fontSize: '0.75rem',
  },
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, unit: string) {
  if (n == null) return '—'
  return `${n.toFixed(1)} ${unit}`
}

function cellColor(value: number | null, normalMin: number | null, normalMax: number | null) {
  if (value == null) return ''
  if (normalMin != null && value < normalMin) return 'text-blue-600 font-semibold'
  if (normalMax != null && value > normalMax) return 'text-red-600 font-semibold'
  return 'text-green-700'
}

// ─── Overview Tab ───────────────────────────────────────────────────────────

function OverviewTab({ readings }: { readings: ReadingRow[] }) {
  // Latest value per reading type
  const latest: Record<string, ReadingRow> = {}
  for (const r of readings) {
    const key = r.reading_types?.key
    if (!key) continue
    if (!latest[key] || r.captured_at > latest[key].captured_at) latest[key] = r
  }

  const gridItems = Object.values(latest).map(r => ({
    id: r.id,
    label: r.reading_types!.label,
    unit: r.reading_types!.unit,
    value: r.value,
    bool_value: r.bool_value,
    is_flagged: r.is_flagged,
    normal_min: r.reading_types!.normal_min,
    normal_max: r.reading_types!.normal_max,
    captured_at: r.captured_at,
  }))

  return <ReadingsGrid readings={gridItems} />
}

// ─── History Tab ─────────────────────────────────────────────────────────────

function HistoryTab({ readings }: { readings: ReadingRow[] }) {
  // Determine all reading types with numeric values
  const rtMap: Record<string, { key: string; label: string; unit: string; normal_min: number | null; normal_max: number | null }> = {}
  for (const r of readings) {
    if (!r.reading_types || r.value == null) continue
    const rt = r.reading_types
    if (rt.unit === 'bool') continue
    if (!rtMap[rt.key]) rtMap[rt.key] = { key: rt.key, label: rt.label, unit: rt.unit, normal_min: rt.normal_min, normal_max: rt.normal_max }
  }
  const allTypes = Object.values(rtMap)

  const [activeKeys, setActiveKeys] = useState<Set<string>>(() => {
    // Default: pressure + temp types visible
    const defaults = new Set<string>()
    for (const rt of allTypes) {
      if (['suction_pressure', 'discharge_pressure', 'superheat', 'subcooling', 'delta_t'].includes(rt.key)) {
        defaults.add(rt.key)
      }
    }
    return defaults.size > 0 ? defaults : new Set(allTypes.slice(0, 5).map(rt => rt.key))
  })

  const toggleKey = (key: string) => {
    setActiveKeys(prev => {
      const next = new Set(prev)
      if (next.has(key)) { next.delete(key) } else { next.add(key) }
      return next
    })
  }

  // Build chart data: group by job visit, one point per visit
  const chartData = useMemo(() => {
    const byJob: Record<string, {
      date: string
      jobNumber: string
      weather: WeatherSnapshot | null
      [key: string]: string | number | null | WeatherSnapshot
    }> = {}
    for (const r of readings) {
      if (r.value == null || !r.reading_types || r.reading_types.unit === 'bool') continue
      const jobId = r.job_id
      if (!byJob[jobId]) {
        byJob[jobId] = {
          date: r.captured_at.substring(0, 10),
          jobNumber: r.jobs?.job_number ?? jobId.slice(0, 8),
          weather: r.jobs?.weather_snapshot ?? null,
        }
      }
      byJob[jobId][r.reading_types.key] = r.value
      // Add weather temp as a chart-able value
      if (r.jobs?.weather_snapshot) {
        byJob[jobId]['_weather_temp'] = r.jobs.weather_snapshot.temp_f
      }
    }
    return Object.values(byJob).sort((a, b) => a.date < b.date ? -1 : 1)
  }, [readings])

  const hasWeather = chartData.some(d => d.weather != null)

  // Trend analysis
  const trends = useMemo<TrendResult[]>(() => computeTrends(chartData, allTypes), [chartData, allTypes])
  const urgentTrends = useMemo(
    () => trends.filter(t => (t.daysToMin != null && t.daysToMin < 60) || (t.daysToMax != null && t.daysToMax < 60)),
    [trends],
  )

  // Determine Y axes: pressure (psi/in_wg) vs temperature (F) vs other
  const pressureKeys = new Set(allTypes.filter(rt => ['psi', 'in_wg'].includes(rt.unit)).map(rt => rt.key))
  const activeList = allTypes.filter(rt => activeKeys.has(rt.key))
  const hasPressure = activeList.some(rt => pressureKeys.has(rt.key))
  const hasOther = activeList.some(rt => !pressureKeys.has(rt.key))

  if (chartData.length === 0) {
    return <p className="text-sm text-muted-foreground">No historical readings available.</p>
  }

  return (
    <div className="space-y-6">
      {/* Toggle buttons */}
      <div className="flex flex-wrap gap-2">
        {allTypes.map((rt, i) => (
          <button
            key={rt.key}
            onClick={() => toggleKey(rt.key)}
            className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
              activeKeys.has(rt.key)
                ? 'border-transparent text-white'
                : 'border-border text-muted-foreground bg-background hover:bg-muted'
            }`}
            style={activeKeys.has(rt.key) ? { backgroundColor: COLOURS[i % COLOURS.length] } : {}}
          >
            {rt.label}
          </button>
        ))}
      </div>

      {/* Trend alerts */}
      {urgentTrends.length > 0 && (
        <div className="rounded-md border border-orange-200 bg-orange-50/60 px-3 py-2 space-y-1">
          <p className="text-xs font-semibold text-orange-800">Trend Alerts</p>
          {urgentTrends.map(t => {
            const days = t.daysToMin ?? t.daysToMax
            const bound = t.daysToMin != null ? 'minimum' : 'maximum'
            return (
              <p key={t.key} className="text-xs text-orange-700">
                <span className="font-medium">{t.label}</span> trending {t.direction} — estimated to breach {bound} in ~{days} days
              </p>
            )
          })}
        </div>
      )}

      {/* Chart */}
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
              tickFormatter={(v) => v.slice(5)} // MM-DD
            />
            {hasPressure && (
              <YAxis
                yAxisId="pressure"
                orientation="left"
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                label={{ value: 'PSI / in WG', angle: -90, position: 'insideLeft', style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
              />
            )}
            {hasOther && (
              <YAxis
                yAxisId="other"
                orientation={hasPressure ? 'right' : 'left'}
                tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                label={{ value: '°F / A / V', angle: -90, position: hasPressure ? 'insideRight' : 'insideLeft', style: { fontSize: 10, fill: 'var(--muted-foreground)' } }}
              />
            )}
            <Tooltip
              {...TOOLTIP_STYLE}
              labelFormatter={(label, payload) => {
                const point = payload?.[0]?.payload
                const jobNum = point?.jobNumber ?? ''
                const w = point?.weather as WeatherSnapshot | null
                const weatherStr = w ? ` · ${weatherEmoji(w.icon)} ${w.temp_f}°F ${w.description}` : ''
                return `${label}${jobNum ? ` · ${jobNum}` : ''}${weatherStr}`
              }}
            />
            {activeList.map((rt, i) => {
              const yAxisId = pressureKeys.has(rt.key) ? 'pressure' : 'other'
              const color = COLOURS[allTypes.findIndex(t => t.key === rt.key) % COLOURS.length]
              return (
                <Line
                  key={rt.key}
                  yAxisId={yAxisId}
                  type="monotone"
                  dataKey={rt.key}
                  name={rt.label}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ r: 3, fill: color }}
                  connectNulls
                />
              )
            })}
            {/* Outdoor temp overlay from weather data */}
            {hasWeather && (
              <Line
                yAxisId={hasPressure && !hasOther ? 'pressure' : 'other'}
                type="monotone"
                dataKey="_weather_temp"
                name="Outdoor Temp"
                stroke="#94a3b8"
                strokeWidth={1.5}
                strokeDasharray="5 3"
                dot={{ r: 2, fill: '#94a3b8' }}
                connectNulls
              />
            )}

            {/* Normal range reference lines for single selected type */}
            {activeList.length === 1 && activeList[0].normal_min != null && (
              <ReferenceLine
                yAxisId={pressureKeys.has(activeList[0].key) ? 'pressure' : 'other'}
                y={activeList[0].normal_min}
                stroke={COLOURS[allTypes.findIndex(t => t.key === activeList[0].key) % COLOURS.length]}
                strokeDasharray="6 3"
                opacity={0.5}
                label={{ value: 'Min', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
            )}
            {activeList.length === 1 && activeList[0].normal_max != null && (
              <ReferenceLine
                yAxisId={pressureKeys.has(activeList[0].key) ? 'pressure' : 'other'}
                y={activeList[0].normal_max}
                stroke={COLOURS[allTypes.findIndex(t => t.key === activeList[0].key) % COLOURS.length]}
                strokeDasharray="6 3"
                opacity={0.5}
                label={{ value: 'Max', fontSize: 10, fill: 'var(--muted-foreground)' }}
              />
            )}
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Historical table */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Date</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Job</th>
              {allTypes.map(rt => (
                <th key={rt.key} className="text-right px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">
                  {rt.label} ({rt.unit})
                </th>
              ))}
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">Weather</th>
              <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Flag</th>
            </tr>
          </thead>
          <tbody>
            {(() => {
              // Group readings by job visit
              const byJob: Record<string, { date: string; jobNum: string; flagged: boolean; weather: WeatherSnapshot | null; values: Record<string, { value: number | null; rtKey: string }> }> = {}
              for (const r of readings) {
                if (!r.reading_types || r.reading_types.unit === 'bool') continue
                const jid = r.job_id
                if (!byJob[jid]) byJob[jid] = {
                  date: r.captured_at.substring(0, 10),
                  jobNum: r.jobs?.job_number ?? jid.slice(0, 8),
                  flagged: false,
                  weather: r.jobs?.weather_snapshot ?? null,
                  values: {},
                }
                byJob[jid].values[r.reading_types.key] = { value: r.value, rtKey: r.reading_types.key }
                if (r.is_flagged) byJob[jid].flagged = true
              }
              return Object.values(byJob)
                .sort((a, b) => b.date < a.date ? -1 : 1)
                .map((visit, i) => (
                  <tr key={i} className={`border-b border-border last:border-0 ${visit.flagged ? 'bg-red-50/30' : 'hover:bg-muted/20'}`}>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">{visit.date}</td>
                    <td className="px-3 py-2 text-xs font-mono text-muted-foreground whitespace-nowrap">{visit.jobNum}</td>
                    {allTypes.map(rt => {
                      const cell = visit.values[rt.key]
                      const cls = cell ? cellColor(cell.value, rt.normal_min, rt.normal_max) : ''
                      return (
                        <td key={rt.key} className={`px-3 py-2 text-right text-xs ${cls}`}>
                          {cell?.value != null ? cell.value : '—'}
                        </td>
                      )
                    })}
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {visit.weather
                        ? `${weatherEmoji(visit.weather.icon)} ${visit.weather.temp_f}°F · ${visit.weather.humidity}% hum`
                        : '—'}
                    </td>
                    <td className="px-3 py-2">
                      {visit.flagged && <Badge variant="destructive" className="text-xs">Flagged</Badge>}
                    </td>
                  </tr>
                ))
            })()}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ─── Compare Tab ─────────────────────────────────────────────────────────────

type CompareGroup = 'sameModel' | 'sameType' | 'healthy' | 'preFailure'
const GROUP_LABELS: Record<CompareGroup, string> = {
  sameModel: 'Same Model',
  sameType: 'Same Unit Type',
  healthy: 'Healthy Baseline',
  preFailure: 'Pre-Failure Pattern',
}

function CompareTab({ stats, hasModelComparison }: { stats: ReadingTypeStats[]; hasModelComparison: boolean }) {
  const [activeGroup, setActiveGroup] = useState<CompareGroup>(hasModelComparison ? 'sameModel' : 'sameType')

  const groups: CompareGroup[] = hasModelComparison
    ? ['sameModel', 'sameType', 'healthy', 'preFailure']
    : ['sameType', 'healthy', 'preFailure']

  // Filter stats with data for this group and this unit
  const visibleStats = stats.filter(s => s.thisUnit && s[activeGroup])

  // Bar chart data: top 8 reading types by avg difference from this unit
  const barData = visibleStats.slice(0, 8).map(s => {
    const fleet = s[activeGroup]!
    return {
      name: s.label.length > 12 ? s.label.slice(0, 12) + '…' : s.label,
      thisUnit: s.thisUnit!.avg,
      fleet: fleet.avg,
      unit: s.unit,
    }
  })

  return (
    <div className="space-y-6">
      {/* Group selector */}
      <div className="flex gap-2 flex-wrap">
        {groups.map(g => (
          <button
            key={g}
            onClick={() => setActiveGroup(g)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors ${
              activeGroup === g
                ? 'bg-primary text-primary-foreground border-primary'
                : 'border-border text-muted-foreground hover:bg-muted'
            }`}
          >
            {GROUP_LABELS[g]}
          </button>
        ))}
      </div>

      {visibleStats.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comparison data available for this group.</p>
      ) : (
        <>
          {/* Bar chart */}
          {barData.length > 0 && (
            <div className="h-60">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 5, right: 20, bottom: 30, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--muted-foreground)' }} angle={-30} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} />
                  <Tooltip {...TOOLTIP_STYLE} formatter={(val, name) => [`${(val as number).toFixed(1)}`, name === 'thisUnit' ? 'This Unit' : GROUP_LABELS[activeGroup]]} />
                  <Legend formatter={(v) => v === 'thisUnit' ? 'This Unit' : GROUP_LABELS[activeGroup]} />
                  <Bar dataKey="thisUnit" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fleet" fill="#94a3b8" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Stats table */}
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Reading</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">This Unit Avg</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">{GROUP_LABELS[activeGroup]} Avg</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Fleet Min</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Fleet Max</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">P25–P75</th>
                  <th className="text-right px-3 py-2 text-xs font-medium text-muted-foreground">Fleet n</th>
                </tr>
              </thead>
              <tbody>
                {visibleStats.map(s => {
                  const fleet = s[activeGroup]!
                  const thisAvg = s.thisUnit!.avg
                  const diff = thisAvg - fleet.avg
                  const pct = fleet.avg !== 0 ? (diff / fleet.avg) * 100 : 0
                  const diffClass = Math.abs(pct) < 5 ? 'text-green-700' : pct > 0 ? 'text-red-600' : 'text-blue-600'
                  return (
                    <tr key={s.key} className="border-b border-border last:border-0 hover:bg-muted/20">
                      <td className="px-3 py-2 text-xs font-medium">{s.label}</td>
                      <td className="px-3 py-2 text-right text-xs">
                        <span className={diffClass}>{fmt(thisAvg, s.unit)}</span>
                        {Math.abs(pct) >= 5 && (
                          <span className={`ml-1 text-xs ${diffClass}`}>({pct > 0 ? '+' : ''}{pct.toFixed(0)}%)</span>
                        )}
                      </td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmt(fleet.avg, s.unit)}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmt(fleet.min, s.unit)}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmt(fleet.max, s.unit)}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fmt(fleet.p25, s.unit)} – {fmt(fleet.p75, s.unit)}</td>
                      <td className="px-3 py-2 text-right text-xs text-muted-foreground">{fleet.count}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Main export ─────────────────────────────────────────────────────────────

export function EquipmentTabs({ readings, stats, hasModelComparison }: EquipmentTabsProps) {
  return (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="history">History</TabsTrigger>
        <TabsTrigger value="compare">Compare</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4">
        <OverviewTab readings={readings} />
      </TabsContent>

      <TabsContent value="history" className="mt-4">
        <HistoryTab readings={readings} />
      </TabsContent>

      <TabsContent value="compare" className="mt-4">
        <CompareTab stats={stats} hasModelComparison={hasModelComparison} />
      </TabsContent>
    </Tabs>
  )
}
