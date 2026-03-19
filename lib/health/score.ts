import type { HealthScoreBreakdown, HealthLabel, HealthColor } from '@/types/health'

type ScoringReading = {
  value: number | null
  captured_at: string
  is_flagged: boolean
  reading_types: { key: string } | null
}

type ScoringDiagnostic = {
  severity: string
  created_at: string
  title: string
}

type ScoringJob = {
  completed_at: string | null
  service_category: string
}

function labelAndColor(score: number): { label: HealthLabel; color: HealthColor } {
  if (score >= 85) return { label: 'Excellent', color: 'green' }
  if (score >= 70) return { label: 'Good', color: 'lime' }
  if (score >= 50) return { label: 'Fair', color: 'yellow' }
  if (score >= 30) return { label: 'Poor', color: 'orange' }
  return { label: 'Critical', color: 'red' }
}

/**
 * Compute a 0–100 health score from available equipment data.
 * Pure function — no async, no side effects.
 */
export function computeHealthScore(
  readings: ScoringReading[],
  diagnosticResults: ScoringDiagnostic[],
  jobs: ScoringJob[],
): HealthScoreBreakdown {
  const now = Date.now()

  // ── A. Trend penalty (0–25) ─────────────────────────────────────────────
  // Group numeric readings by key, sorted by date
  const byKey: Record<string, { date: number; value: number }[]> = {}
  for (const r of readings) {
    if (r.value == null || !r.reading_types) continue
    const key = r.reading_types.key
    if (!byKey[key]) byKey[key] = []
    byKey[key].push({ date: new Date(r.captured_at).getTime(), value: r.value })
  }

  function computeSlope(key: string): number | null {
    const pts = (byKey[key] ?? []).sort((a, b) => a.date - b.date)
    if (pts.length < 4) return null
    const t0 = pts[0].date
    const xs = pts.map(p => (p.date - t0) / 86400000)
    const ys = pts.map(p => p.value)
    const n = pts.length
    const sumX = xs.reduce((a, b) => a + b, 0)
    const sumY = ys.reduce((a, b) => a + b, 0)
    const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
    const sumX2 = xs.reduce((s, x) => s + x * x, 0)
    const denom = n * sumX2 - sumX * sumX
    if (denom === 0) return null
    return (n * sumXY - sumX * sumY) / denom
  }

  let trendPenalty = 0
  const suctionSlope = computeSlope('suction_pressure')
  const dischargeSlope = computeSlope('discharge_pressure')
  const ampsSlope = computeSlope('compressor_amps')

  // Suction falling = bad; discharge or amps rising = bad
  if (suctionSlope != null && suctionSlope < -0.5) trendPenalty += suctionSlope < -2.0 ? 10 : 5
  if (dischargeSlope != null && dischargeSlope > 0.5) trendPenalty += dischargeSlope > 2.0 ? 8 : 4
  if (ampsSlope != null && ampsSlope > 0.05) trendPenalty += ampsSlope > 0.15 ? 7 : 3
  trendPenalty = Math.min(trendPenalty, 25)

  // ── B. Flagged reading penalty (0–30) ───────────────────────────────────
  const cutoff90 = now - 90 * 86400000
  let recentFlagged = 0
  let historicalFlagged = 0
  for (const r of readings) {
    if (!r.is_flagged) continue
    if (new Date(r.captured_at).getTime() > cutoff90) {
      recentFlagged++
    } else {
      historicalFlagged++
    }
  }
  const flaggedReadings = Math.min(recentFlagged * 5 + historicalFlagged, 30)

  // ── C. Diagnostic severity penalty (0–20) ───────────────────────────────
  const cutoff180 = now - 180 * 86400000
  let diagnosticSeverity = 0
  for (const d of diagnosticResults) {
    const isRecent = new Date(d.created_at).getTime() > cutoff180
    if (d.severity === 'critical') diagnosticSeverity += isRecent ? 8 : 2
    else if (d.severity === 'warning') diagnosticSeverity += isRecent ? 3 : 1
  }
  diagnosticSeverity = Math.min(diagnosticSeverity, 20)

  // ── D. Days since last service penalty (0–15) ────────────────────────────
  const lastJob = jobs
    .filter(j => j.completed_at)
    .sort((a, b) => new Date(b.completed_at!).getTime() - new Date(a.completed_at!).getTime())[0]

  let daysSinceService = 0
  if (!lastJob) {
    daysSinceService = 15
  } else {
    const daysSince = (now - new Date(lastJob.completed_at!).getTime()) / 86400000
    if (daysSince > 365) daysSinceService = 15
    else if (daysSince > 180) daysSinceService = 10
    else if (daysSince > 90) daysSinceService = 5
  }

  // ── E. Recharge frequency penalty (0–10) ────────────────────────────────
  // Proxy: count critical diagnostics related to suction/refrigerant issues
  const rechargeEvents = diagnosticResults.filter(
    d => d.severity === 'critical' && /suction|refrigerant|recharge|low.charge/i.test(d.title)
  ).length
  const rechargeFrequency = rechargeEvents >= 3 ? 10 : rechargeEvents === 2 ? 7 : rechargeEvents === 1 ? 3 : 0

  const total = Math.max(
    0,
    100 - trendPenalty - flaggedReadings - diagnosticSeverity - daysSinceService - rechargeFrequency,
  )

  return {
    total,
    components: { trendPenalty, flaggedReadings, diagnosticSeverity, daysSinceService, rechargeFrequency },
    ...labelAndColor(total),
  }
}
