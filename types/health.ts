// ─── Health Score ────────────────────────────────────────────────────────────

export type HealthLabel = 'Excellent' | 'Good' | 'Fair' | 'Poor' | 'Critical'
export type HealthColor = 'green' | 'lime' | 'yellow' | 'orange' | 'red'

export type HealthScoreBreakdown = {
  total: number // 0–100
  components: {
    trendPenalty: number        // 0–25 deducted
    flaggedReadings: number     // 0–30 deducted
    diagnosticSeverity: number  // 0–20 deducted
    daysSinceService: number    // 0–15 deducted
    rechargeFrequency: number   // 0–10 deducted
  }
  label: HealthLabel
  color: HealthColor
}

// ─── Trend Analysis ──────────────────────────────────────────────────────────

export type TrendDirection = 'rising' | 'falling' | 'stable'

export type TrendResult = {
  key: string
  label: string
  unit: string
  slope: number              // units per day (positive = rising)
  direction: TrendDirection
  daysToMin: number | null   // null if not approaching min or no normal_min
  daysToMax: number | null   // null if not approaching max or no normal_max
  rSquared: number
  currentValue: number       // most recent actual value
  normalMin: number | null
  normalMax: number | null
}

// ─── AI Summary ──────────────────────────────────────────────────────────────

export type AiCondition = 'good' | 'watch' | 'action_required' | 'critical'

export type AiSummary = {
  overallAssessment: string
  condition: AiCondition
  keyFindings: string[]
  trendAnalysis: string
  recommendedActions: {
    priority: 'high' | 'medium' | 'low'
    action: string
  }[]
  generatedAt: string
  modelUsed: string
}
