'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { generateAiSummary } from '@/lib/actions/ai-summary-action'
import type { AiSummary, AiCondition } from '@/types/health'

const CONDITION_STYLES: Record<AiCondition, { label: string; className: string }> = {
  good:            { label: 'Good',            className: 'bg-green-100 text-green-800 border-green-200' },
  watch:           { label: 'Watch',           className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  action_required: { label: 'Action Required', className: 'bg-orange-100 text-orange-800 border-orange-200' },
  critical:        { label: 'Critical',        className: 'bg-red-100 text-red-800 border-red-200' },
}

const PRIORITY_STYLES = {
  high:   'bg-red-100 text-red-700',
  medium: 'bg-yellow-100 text-yellow-700',
  low:    'bg-gray-100 text-gray-600',
}

function formatGeneratedAt(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' })
}

export function AiSummaryCard({
  initialSummary,
  equipmentId,
  hasExistingResearch,
}: {
  initialSummary: AiSummary | null
  equipmentId: string
  hasExistingResearch: boolean
}) {
  const [summary, setSummary] = useState<AiSummary | null>(initialSummary)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function generate() {
    setError(null)
    startTransition(async () => {
      const result = await generateAiSummary(equipmentId)
      if ('error' in result) {
        setError(result.error)
      } else {
        setSummary(result.summary)
      }
    })
  }

  const condition = summary ? CONDITION_STYLES[summary.condition] : null

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CardTitle className="text-sm">AI Health Summary</CardTitle>
            {condition && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${condition.className}`}>
                {condition.label}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {summary && (
              <span className="text-xs text-muted-foreground hidden sm:block">
                {formatGeneratedAt(summary.generatedAt)}
              </span>
            )}
            <button
              onClick={generate}
              disabled={isPending}
              className="text-xs px-3 py-1.5 rounded-md border border-border hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending
                ? 'Generating…'
                : summary
                  ? 'Regenerate'
                  : 'Generate AI Summary'}
            </button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {error && (
          <p className="text-sm text-red-600">{error}</p>
        )}

        {isPending && !summary && (
          <div className="space-y-3">
            {!hasExistingResearch && (
              <p className="text-xs text-muted-foreground">
                Step 1 of 2: Generating model research…
              </p>
            )}
            <div className="space-y-3 animate-pulse">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-4/5" />
              <div className="h-4 bg-muted rounded w-3/4" />
            </div>
          </div>
        )}

        {!summary && !isPending && !error && (
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">
              Generate an AI-powered summary based on this unit&apos;s readings, service history, and trends.
            </p>
            {!hasExistingResearch && (
              <p className="text-xs text-muted-foreground">
                Model research will be generated first to improve accuracy.
              </p>
            )}
          </div>
        )}

        {summary && !isPending && (
          <div className="space-y-4">
            {/* Overall assessment */}
            <p className="text-sm">{summary.overallAssessment}</p>

            {/* Key findings */}
            {summary.keyFindings.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Key Findings</p>
                <ul className="space-y-1">
                  {summary.keyFindings.map((f, i) => (
                    <li key={i} className="text-sm flex gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Trend analysis */}
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Trend Analysis</p>
              <p className="text-sm text-muted-foreground">{summary.trendAnalysis}</p>
            </div>

            {/* Recommended actions */}
            {summary.recommendedActions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">Recommended Actions</p>
                <div className="space-y-1.5">
                  {summary.recommendedActions
                    .sort((a, b) => ['high', 'medium', 'low'].indexOf(a.priority) - ['high', 'medium', 'low'].indexOf(b.priority))
                    .map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 shrink-0 ${PRIORITY_STYLES[a.priority]}`}>
                          {a.priority}
                        </span>
                        <span>{a.action}</span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
