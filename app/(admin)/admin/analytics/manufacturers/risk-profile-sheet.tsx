'use client'

import { useState, useTransition } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Sparkles, RefreshCw, Activity, AlertTriangle, TrendingUp } from 'lucide-react'
import { toast } from 'sonner'
import { generateManufacturerProfile } from '@/lib/actions/manufacturer-analysis-action'
import type { ManufacturerProfileInput, ManufacturerProfile } from '@/lib/actions/manufacturer-analysis-action'

function healthColor(score: number | null) {
  if (score == null) return '#94a3b8'
  if (score >= 85) return '#22c55e'
  if (score >= 70) return '#84cc16'
  if (score >= 50) return '#eab308'
  if (score >= 30) return '#f97316'
  return '#ef4444'
}

function healthLabel(score: number | null) {
  if (score == null) return '—'
  if (score >= 85) return 'Excellent'
  if (score >= 70) return 'Good'
  if (score >= 50) return 'Fair'
  if (score >= 30) return 'Poor'
  return 'Critical'
}

interface RiskProfileSheetProps {
  data: ManufacturerProfileInput
}

export function RiskProfileSheet({ data }: RiskProfileSheetProps) {
  const [profile, setProfile] = useState<ManufacturerProfile | null>(null)
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function generate() {
    startTransition(async () => {
      const result = await generateManufacturerProfile(data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setProfile(result.profile)
      }
    })
  }

  function handleOpenChange(val: boolean) {
    setOpen(val)
    // Auto-generate on first open
    if (val && !profile && !isPending) generate()
  }

  const sections = profile ? [
    {
      icon: Activity,
      label: 'Current Condition',
      text: profile.condition,
      color: 'text-blue-600',
      bg: 'bg-blue-50 border-blue-200',
    },
    {
      icon: AlertTriangle,
      label: 'Failure Signatures',
      text: profile.failure_signatures,
      color: 'text-orange-600',
      bg: 'bg-orange-50 border-orange-200',
    },
    {
      icon: TrendingUp,
      label: 'Recommendation',
      text: profile.recommendation,
      color: 'text-green-600',
      bg: 'bg-green-50 border-green-200',
    },
  ] : []

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={<Button variant="ghost" size="xs" className="text-muted-foreground hover:text-primary" />}>
        <Sparkles className="h-3.5 w-3.5" />
        Profile
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="pb-4 border-b border-border">
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            {data.manufacturer} — Risk Profile
          </SheetTitle>
        </SheetHeader>

        {/* Key stats */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold tabular-nums" style={{ color: healthColor(data.avg_health) }}>
              {data.avg_health ?? '—'}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">Avg Health</p>
            <p className="text-xs font-medium" style={{ color: healthColor(data.avg_health) }}>
              {healthLabel(data.avg_health)}
            </p>
          </div>
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold tabular-nums text-orange-600">{data.at_risk}</p>
            <p className="text-xs text-muted-foreground mt-0.5">At Risk</p>
            <p className="text-xs font-medium text-muted-foreground">
              {data.count > 0 ? `${Math.round(data.at_risk / data.count * 100)}%` : '—'} of fleet
            </p>
          </div>
          <div className="border border-border rounded-lg p-3 text-center">
            <p className="text-2xl font-bold tabular-nums">{data.count}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Total Units</p>
            <p className="text-xs font-medium text-muted-foreground">{data.failure_rate}% failure rate</p>
          </div>
        </div>

        {/* AI Analysis */}
        <div className="mt-5 space-y-4">
          {isPending && !profile && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4 animate-spin" />
                Generating risk profile…
              </div>
              {[1, 2, 3].map(i => (
                <div key={i} className="rounded-xl border p-4 space-y-2 animate-pulse">
                  <div className="h-3 bg-muted rounded w-1/3" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-5/6" />
                </div>
              ))}
            </div>
          )}

          {profile && sections.map(({ icon: Icon, label, text, color, bg }) => (
            <div key={label} className={`rounded-xl border p-4 ${bg}`}>
              <div className={`flex items-center gap-2 mb-2 ${color}`}>
                <Icon className="h-4 w-4" />
                <p className="text-xs font-bold uppercase tracking-wide">{label}</p>
              </div>
              <p className="text-sm leading-relaxed">{text}</p>
            </div>
          ))}

          {profile && (
            <Button
              variant="outline"
              size="sm"
              onClick={generate}
              disabled={isPending}
              className="w-full"
            >
              <RefreshCw className={`h-3.5 w-3.5 mr-2 ${isPending ? 'animate-spin' : ''}`} />
              Regenerate Profile
            </Button>
          )}
        </div>

        {/* Supporting data */}
        {data.models.length > 0 && (
          <div className="mt-6 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Models</p>
            <div className="space-y-1">
              {data.models.slice(0, 6).map(m => (
                <div key={m.model} className="flex items-center justify-between text-xs">
                  <span className="font-mono text-muted-foreground truncate flex-1">{m.model}</span>
                  <span className="shrink-0 ml-2 font-semibold" style={{ color: healthColor(m.avg_health) }}>
                    {m.avg_health ?? '—'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {data.topFailures.length > 0 && (
          <div className="mt-4 border-t border-border pt-4">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Top Issues</p>
            <div className="space-y-1">
              {data.topFailures.slice(0, 5).map((f, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  {f.criticalCount > 0 && <AlertTriangle className="h-3 w-3 text-red-500 shrink-0 mt-0.5" />}
                  <span className="text-muted-foreground leading-relaxed">{f.title}</span>
                  <span className="shrink-0 text-muted-foreground">×{f.count}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
