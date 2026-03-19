'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  BookOpen, RefreshCw, AlertTriangle, Wrench, FileText,
  ExternalLink, ChevronDown, Package, Thermometer, Clock,
} from 'lucide-react'
import { toast } from 'sonner'
import { generateEquipmentResearch, type EquipmentResearch } from '@/lib/actions/equipment-research-action'

interface ResearchCardProps {
  equipmentId: string
  manufacturer: string
  modelNumber: string | null
  initialResearch: EquipmentResearch | null
}

const SEVERITY_CLASSES: Record<string, string> = {
  high:   'bg-red-50 border-red-200 text-red-700',
  medium: 'bg-orange-50 border-orange-200 text-orange-700',
  low:    'bg-blue-50 border-blue-200 text-blue-700',
}

function Section({
  icon: Icon,
  title,
  count,
  children,
}: {
  icon: React.FC<{ className?: string }>
  title: string
  count?: number
  children: React.ReactNode
}) {
  return (
    <details className="group border-t border-border">
      <summary className="cursor-pointer list-none flex items-center justify-between py-2.5 select-none">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
          {count != null && (
            <span className="text-xs font-normal text-muted-foreground">({count})</span>
          )}
        </div>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform group-open:rotate-180" />
      </summary>
      <div className="pb-3">{children}</div>
    </details>
  )
}

export function ResearchCard({ equipmentId, manufacturer, modelNumber, initialResearch }: ResearchCardProps) {
  const [research, setResearch] = useState<EquipmentResearch | null>(initialResearch)
  const [isPending, startTransition] = useTransition()
  const [imgError, setImgError] = useState(false)

  function handleGenerate() {
    startTransition(async () => {
      const result = await generateEquipmentResearch(equipmentId)
      if ('error' in result && result.error) {
        toast.error(result.error)
      } else if ('research' in result && result.research) {
        setResearch(result.research as EquipmentResearch)
        setImgError(false)
        toast.success('Research updated')
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            <CardTitle>Model Reference</CardTitle>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleGenerate}
            disabled={isPending}
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${isPending ? 'animate-spin' : ''}`} />
            {research ? 'Refresh' : 'Research'}
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        {!research && !isPending && (
          <div className="text-center py-10 text-muted-foreground space-y-2">
            <Package className="h-10 w-10 mx-auto opacity-25" />
            <p className="text-sm">
              Pull manufacturer specs, common repairs,<br />manuals, and recalls for this model.
            </p>
          </div>
        )}

        {isPending && (
          <div className="text-center py-10 text-muted-foreground space-y-2">
            <RefreshCw className="h-8 w-8 mx-auto animate-spin opacity-40" />
            <p className="text-sm">Researching {manufacturer} {modelNumber}…</p>
          </div>
        )}

        {research && !isPending && (
          <div className="space-y-1">
            {/* Reference image */}
            {research.image_url && !imgError ? (
              <div className="rounded-lg overflow-hidden border border-border bg-muted/10 mb-4">
                <img
                  src={research.image_url}
                  alt={`${manufacturer} ${modelNumber}`}
                  className="w-full h-44 object-contain p-3"
                  onError={() => setImgError(true)}
                />
              </div>
            ) : (
              <div className="rounded-lg bg-muted/10 border border-border border-dashed h-32 flex items-center justify-center mb-4">
                <div className="text-center text-muted-foreground">
                  <Package className="h-7 w-7 mx-auto mb-1 opacity-30" />
                  <p className="text-xs">{manufacturer} {modelNumber}</p>
                </div>
              </div>
            )}

            {/* Summary */}
            <p className="text-sm text-muted-foreground leading-relaxed pb-2">
              {research.summary}
            </p>

            {/* Key specs chips */}
            {research.key_specs?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pb-2">
                {research.key_specs.map((spec) => (
                  <span
                    key={spec.label}
                    className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5"
                  >
                    <span className="text-muted-foreground">{spec.label}:</span>
                    <span className="font-medium">{spec.value}</span>
                  </span>
                ))}
                {research.lifespan && (
                  <span className="inline-flex items-center gap-1 text-xs bg-muted rounded-md px-2 py-0.5">
                    <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                    <span className="font-medium">{research.lifespan}</span>
                  </span>
                )}
              </div>
            )}

            {/* Recall alert — always visible if present */}
            {research.recall_info && (
              <div className="flex gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 mb-1">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-xs uppercase tracking-wide mb-1">Recall / Safety Notice</p>
                  <p className="text-xs leading-relaxed">{research.recall_info}</p>
                </div>
              </div>
            )}

            {/* Common Issues */}
            {research.common_issues?.length > 0 && (
              <Section icon={Wrench} title="Common Issues" count={research.common_issues.length}>
                <div className="space-y-2 pt-1">
                  {research.common_issues.map((issue, i) => (
                    <div
                      key={i}
                      className={`rounded-lg border p-2.5 text-xs ${SEVERITY_CLASSES[issue.severity] ?? SEVERITY_CLASSES.low}`}
                    >
                      <p className="font-semibold mb-0.5">{issue.title}</p>
                      <p className="opacity-80 leading-relaxed">{issue.description}</p>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Maintenance Schedule */}
            {research.maintenance?.length > 0 && (
              <Section icon={Thermometer} title="Maintenance Schedule">
                <div className="space-y-0 pt-1">
                  {research.maintenance.map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between text-xs py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span>{item.task}</span>
                      <span className="text-muted-foreground shrink-0 ml-2 font-medium">{item.interval}</span>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Technical Resources */}
            {research.resources?.length > 0 && (
              <Section icon={FileText} title="Technical Resources" count={research.resources.length}>
                <div className="space-y-1.5 pt-1">
                  <p className="text-xs text-muted-foreground italic mb-2">Links are AI-suggested — verify before use.</p>
                  {research.resources.map((r, i) => (
                    <a
                      key={i}
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-primary hover:underline"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      {r.label}
                    </a>
                  ))}
                  {research.product_page_url && (
                    <a
                      href={research.product_page_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-muted-foreground hover:underline pt-1 border-t border-border/50"
                    >
                      <ExternalLink className="h-3 w-3 shrink-0" />
                      Manufacturer product page
                    </a>
                  )}
                </div>
              </Section>
            )}

            <p className="text-xs text-muted-foreground pt-2 border-t border-border">
              AI-generated · {new Date(research.generated_at).toLocaleDateString()}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
