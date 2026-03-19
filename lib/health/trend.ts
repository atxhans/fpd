import type { TrendResult, TrendDirection } from '@/types/health'

type DataPoint = {
  date: string // YYYY-MM-DD
  [key: string]: string | number | null | unknown
}

type ReadingTypeMeta = {
  key: string
  label: string
  unit: string
  normal_min: number | null
  normal_max: number | null
}

/**
 * Compute OLS linear regression trend for each active reading type.
 * Requires >= 4 data points and r² > 0.35 to emit a result.
 */
export function computeTrends(
  chartData: DataPoint[],
  readingTypes: ReadingTypeMeta[],
): TrendResult[] {
  const results: TrendResult[] = []
  const t0 = chartData[0]?.date ? new Date(chartData[0].date).getTime() : 0

  for (const rt of readingTypes) {
    if (rt.unit === 'bool') continue

    // Extract (x = days from first point, y = value) pairs
    const points: { x: number; y: number }[] = []
    for (const d of chartData) {
      const v = d[rt.key]
      if (typeof v !== 'number') continue
      const x = (new Date(d.date as string).getTime() - t0) / (1000 * 60 * 60 * 24)
      points.push({ x, y: v })
    }

    if (points.length < 4) continue

    // OLS: slope and intercept
    const n = points.length
    const sumX = points.reduce((s, p) => s + p.x, 0)
    const sumY = points.reduce((s, p) => s + p.y, 0)
    const sumXY = points.reduce((s, p) => s + p.x * p.y, 0)
    const sumX2 = points.reduce((s, p) => s + p.x * p.x, 0)

    const denom = n * sumX2 - sumX * sumX
    if (denom === 0) continue

    const slope = (n * sumXY - sumX * sumY) / denom
    const intercept = (sumY - slope * sumX) / n

    // R-squared
    const yMean = sumY / n
    const ssTot = points.reduce((s, p) => s + (p.y - yMean) ** 2, 0)
    const ssRes = points.reduce((s, p) => s + (p.y - (slope * p.x + intercept)) ** 2, 0)
    const rSquared = ssTot === 0 ? 0 : 1 - ssRes / ssTot

    if (rSquared < 0.35) continue

    const lastX = points[points.length - 1].x
    const currentValue = slope * lastX + intercept

    const direction: TrendDirection =
      Math.abs(slope) < 0.05 ? 'stable' : slope > 0 ? 'rising' : 'falling'

    // Days to threshold breach from the last data point
    function daysTo(threshold: number): number | null {
      if (slope === 0) return null
      const days = (threshold - currentValue) / slope
      if (days <= 0 || days > 730) return null
      return Math.round(days)
    }

    const approachingMin = direction === 'falling' && rt.normal_min != null
    const approachingMax = direction === 'rising' && rt.normal_max != null

    results.push({
      key: rt.key,
      label: rt.label,
      unit: rt.unit,
      slope,
      direction,
      daysToMin: approachingMin ? daysTo(rt.normal_min!) : null,
      daysToMax: approachingMax ? daysTo(rt.normal_max!) : null,
      rSquared,
      currentValue,
      normalMin: rt.normal_min,
      normalMax: rt.normal_max,
    })
  }

  return results
}
