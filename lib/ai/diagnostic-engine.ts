// =====================================================
// AI Diagnostic Engine Abstraction Layer
// Designed for future LLM integration (Claude).
// For MVP, delegates to the rules engine.
// =====================================================

import { runDiagnostics, type ReadingSnapshot, type DiagnosticAlert } from '@/lib/diagnostics/rules-engine'

export interface DiagnosticContext {
  equipmentType: string
  manufacturer: string | null
  modelNumber: string | null
  refrigerantType: string | null
  installDate: string | null
  readings: ReadingSnapshot[]
  technicianNotes: string | null
}

export interface DiagnosticResponse {
  alerts: DiagnosticAlert[]
  source: 'rules' | 'ai'
  model?: string
  processingMs?: number
}

/**
 * Main entry point for diagnostic analysis.
 * Currently uses rules engine. When AI_DIAGNOSTICS feature flag is enabled
 * and ANTHROPIC_API_KEY is configured, will use Claude for enrichment.
 */
export async function analyzeDiagnostics(
  ctx: DiagnosticContext,
  useAI = false
): Promise<DiagnosticResponse> {
  const start = Date.now()

  // Rules-based analysis (always runs)
  const alerts = runDiagnostics(ctx.readings)

  if (useAI && process.env.ANTHROPIC_API_KEY) {
    try {
      const aiAlerts = await runAIDiagnostics(ctx, alerts)
      return {
        alerts: aiAlerts,
        source: 'ai',
        model: 'claude-sonnet-4-6',
        processingMs: Date.now() - start,
      }
    } catch (err) {
      console.error('[AI Diagnostics] Failed, falling back to rules:', err)
    }
  }

  return {
    alerts,
    source: 'rules',
    processingMs: Date.now() - start,
  }
}

/**
 * AI enrichment using Claude.
 * Takes rules-based alerts + context and asks Claude to validate/enhance.
 */
async function runAIDiagnostics(
  ctx: DiagnosticContext,
  rulesAlerts: DiagnosticAlert[]
): Promise<DiagnosticAlert[]> {
  const Anthropic = (await import('@anthropic-ai/sdk')).default
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const readingsSummary = ctx.readings
    .map((r) => `${r.key}: ${r.value} ${r.unit}`)
    .join('\n')

  const prompt = `You are an expert HVAC diagnostic assistant. Analyze these readings and provide diagnostic insights.

Equipment: ${ctx.equipmentType} | ${ctx.manufacturer ?? 'Unknown'} ${ctx.modelNumber ?? ''}
Refrigerant: ${ctx.refrigerantType ?? 'Unknown'}
Technician notes: ${ctx.technicianNotes ?? 'None'}

Readings:
${readingsSummary}

Rules-based alerts already identified:
${rulesAlerts.map((a) => `- [${a.severity.toUpperCase()}] ${a.title}`).join('\n')}

Provide any additional insights or corrections in JSON format:
{
  "alerts": [
    {
      "ruleKey": "string",
      "severity": "info|warning|critical",
      "title": "string",
      "description": "string",
      "recommendation": "string",
      "confidence": 0.0-1.0
    }
  ]
}`

  const response = await client.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })

  const content = response.content[0]
  if (content.type !== 'text') return rulesAlerts

  // Parse JSON response
  const jsonMatch = content.text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return rulesAlerts

  const parsed = JSON.parse(jsonMatch[0]) as { alerts: DiagnosticAlert[] }

  // Merge AI alerts with rules alerts, deduplicating by ruleKey
  const merged = [...rulesAlerts]
  for (const aiAlert of parsed.alerts ?? []) {
    if (!merged.some((a) => a.ruleKey === aiAlert.ruleKey)) {
      merged.push({ ...aiAlert, confidence: aiAlert.confidence ?? 0.8 })
    }
  }

  return merged.sort((a, b) => {
    const order = { critical: 0, warning: 1, info: 2 }
    return order[a.severity] - order[b.severity]
  })
}
