'use client'

import { useState, useTransition } from 'react'
import { Sparkles, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { generateFleetBrief } from '@/lib/actions/manufacturer-analysis-action'
import type { FleetBriefInput } from '@/lib/actions/manufacturer-analysis-action'

interface FleetBriefProps {
  data: FleetBriefInput
}

export function FleetBrief({ data }: FleetBriefProps) {
  const [brief, setBrief] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(true)
  const [isPending, startTransition] = useTransition()

  function generate() {
    startTransition(async () => {
      const result = await generateFleetBrief(data)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        setBrief(result.brief)
        setExpanded(true)
      }
    })
  }

  // Split into paragraphs for rendering
  const paragraphs = brief?.split(/\n\n+/).filter(Boolean) ?? []

  if (!brief && !isPending) {
    return (
      <div className="border border-border border-dashed rounded-xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="font-semibold text-sm">Fleet Intelligence Brief</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            AI-generated executive analysis synthesising all manufacturer performance data
          </p>
        </div>
        <Button size="sm" onClick={generate}>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Analysis
        </Button>
      </div>
    )
  }

  if (isPending) {
    return (
      <div className="border border-border rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <RefreshCw className="h-4 w-4 animate-spin" />
          Analysing fleet data…
        </div>
        <div className="space-y-2 animate-pulse">
          <div className="h-3.5 bg-muted rounded w-full" />
          <div className="h-3.5 bg-muted rounded w-5/6" />
          <div className="h-3.5 bg-muted rounded w-4/5" />
        </div>
      </div>
    )
  }

  return (
    <div className="border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">Fleet Intelligence Brief</span>
          <span className="text-xs text-muted-foreground">· AI-generated</span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={generate} disabled={isPending} className="h-7 text-xs">
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Regenerate
          </Button>
          <Button variant="ghost" size="icon-sm" onClick={() => setExpanded(e => !e)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Body */}
      {expanded && (
        <div className="px-5 py-4 space-y-3">
          {paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-foreground">
              {p}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
