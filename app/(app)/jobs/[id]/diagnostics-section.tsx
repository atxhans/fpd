import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DiagnosticResult {
  id: string
  severity: string
  rule_key: string
  message: string
  detail: string | null
  source: string
}

interface DiagnosticsSectionProps {
  diagnostics: DiagnosticResult[]
  jobId: string
  tenantId: string
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertTriangle, classes: 'border-red-300 bg-red-50', titleClass: 'text-red-800', iconClass: 'text-red-600' },
  warning:  { icon: AlertCircle,  classes: 'border-yellow-300 bg-yellow-50', titleClass: 'text-yellow-800', iconClass: 'text-yellow-600' },
  info:     { icon: Info,         classes: 'border-blue-300 bg-blue-50', titleClass: 'text-blue-800', iconClass: 'text-blue-600' },
}

export function DiagnosticsSection({ diagnostics }: DiagnosticsSectionProps) {
  if (diagnostics.length === 0) return null

  return (
    <Card>
      <CardHeader><CardTitle>Diagnostic Alerts ({diagnostics.length})</CardTitle></CardHeader>
      <CardContent className="space-y-3">
        {diagnostics.map((d) => {
          const config = SEVERITY_CONFIG[d.severity as keyof typeof SEVERITY_CONFIG] ?? SEVERITY_CONFIG.info
          const Icon = config.icon
          return (
            <div key={d.id} className={cn('border rounded-lg p-4', config.classes)}>
              <div className="flex items-start gap-3">
                <Icon className={cn('h-5 w-5 mt-0.5 shrink-0', config.iconClass)} />
                <div className="flex-1 min-w-0">
                  <p className={cn('font-semibold text-sm', config.titleClass)}>{d.rule_key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  <p className="text-sm mt-1">{d.message}</p>
                  {d.detail && <p className="text-xs text-muted-foreground mt-1">{d.detail}</p>}
                  <p className="text-xs text-muted-foreground mt-1 uppercase tracking-wide">{d.source.replace('_', ' ')}</p>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
