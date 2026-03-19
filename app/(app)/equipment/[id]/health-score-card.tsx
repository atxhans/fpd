import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { HealthScoreBreakdown, HealthColor } from '@/types/health'

const COLOR_MAP: Record<HealthColor, { stroke: string; text: string; bg: string }> = {
  green:  { stroke: '#22c55e', text: 'text-green-600',  bg: 'bg-green-50'  },
  lime:   { stroke: '#84cc16', text: 'text-lime-600',   bg: 'bg-lime-50'   },
  yellow: { stroke: '#eab308', text: 'text-yellow-600', bg: 'bg-yellow-50' },
  orange: { stroke: '#f97316', text: 'text-orange-600', bg: 'bg-orange-50' },
  red:    { stroke: '#ef4444', text: 'text-red-600',    bg: 'bg-red-50'    },
}

const COMPONENT_LABELS: Record<keyof HealthScoreBreakdown['components'], string> = {
  trendPenalty:       'Reading trends',
  flaggedReadings:    'Flagged readings',
  diagnosticSeverity: 'Diagnostic alerts',
  daysSinceService:   'Time since service',
  rechargeFrequency:  'Refrigerant events',
}

export function HealthScoreCard({ breakdown }: { breakdown: HealthScoreBreakdown }) {
  const { total, label, color, components } = breakdown
  const c = COLOR_MAP[color]

  // SVG gauge: arc from -210° to +30° (240° sweep)
  const R = 40
  const cx = 56
  const cy = 56
  const sweep = 240
  const startAngle = -210 // degrees (bottom-left)
  const circumference = 2 * Math.PI * R
  const arcLength = (sweep / 360) * circumference
  const filled = (total / 100) * arcLength

  function polarToXY(angleDeg: number) {
    const rad = (angleDeg * Math.PI) / 180
    return { x: cx + R * Math.cos(rad), y: cy + R * Math.sin(rad) }
  }

  function describeArc(startDeg: number, endDeg: number) {
    const s = polarToXY(startDeg)
    const e = polarToXY(endDeg)
    const largeArc = endDeg - startDeg > 180 ? 1 : 0
    return `M ${s.x} ${s.y} A ${R} ${R} 0 ${largeArc} 1 ${e.x} ${e.y}`
  }

  const endAngle = startAngle + sweep
  const filledEndAngle = startAngle + (total / 100) * sweep
  const trackPath = describeArc(startAngle, endAngle)
  const fillPath = total > 0 ? describeArc(startAngle, filledEndAngle) : ''

  const totalPenalty = Object.values(components).reduce((s, v) => s + v, 0)

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm">Health Score</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gauge */}
        <div className="flex flex-col items-center">
          <svg viewBox="0 0 112 80" className="w-36 h-24">
            {/* Track */}
            <path d={trackPath} fill="none" stroke="var(--border)" strokeWidth="8" strokeLinecap="round" />
            {/* Fill */}
            {fillPath && (
              <path d={fillPath} fill="none" stroke={c.stroke} strokeWidth="8" strokeLinecap="round" />
            )}
            {/* Score text */}
            <text x={cx} y={cy + 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="currentColor">
              {total}
            </text>
          </svg>
          <span className={`text-sm font-semibold -mt-2 ${c.text}`}>{label}</span>
        </div>

        {/* Penalty breakdown */}
        {totalPenalty > 0 && (
          <div className="space-y-1.5">
            {(Object.entries(components) as [keyof typeof components, number][])
              .filter(([, v]) => v > 0)
              .sort(([, a], [, b]) => b - a)
              .map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{COMPONENT_LABELS[k]}</span>
                  <span className={`font-medium ${c.text}`}>−{v}</span>
                </div>
              ))}
          </div>
        )}

        {totalPenalty === 0 && (
          <p className="text-xs text-center text-muted-foreground">No issues detected</p>
        )}
      </CardContent>
    </Card>
  )
}
