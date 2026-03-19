'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { AiSummary } from '@/types/health'
import type { WeatherSnapshot } from '@/lib/openweather'
import { generateEquipmentResearch, type EquipmentResearch } from './equipment-research-action'

function buildResearchSection(research: EquipmentResearch | null): string {
  if (!research) return '  Not available'
  const lines: string[] = [
    `- Product Line: ${research.product_line}`,
    `- Expected Efficiency: ${research.efficiency}`,
    `- Estimated Lifespan: ${research.lifespan}`,
  ]
  if (research.key_specs?.length > 0) {
    lines.push('Expected Specifications:')
    for (const s of research.key_specs) lines.push(`  ${s.label}: ${s.value}`)
  }
  if (research.common_issues?.length > 0) {
    lines.push('Known Common Issues for This Model:')
    for (const i of research.common_issues) {
      lines.push(`  [${i.severity.toUpperCase()}] ${i.title}: ${i.description.slice(0, 120)}`)
    }
  }
  if (research.recall_info) {
    lines.push(`Recall / Safety Notice: ${research.recall_info}`)
  }
  return lines.join('\n')
}

function buildPrompt(data: {
  equipment: Record<string, unknown>
  customer: Record<string, unknown>
  site: Record<string, unknown>
  jobs: { scheduled_at: string | null; service_category: string; resolution_summary: string | null; weather_snapshot: WeatherSnapshot | null }[]
  readingsByVisit: { date: string; jobNumber: string; values: { label: string; key: string; value: number; unit: string; is_flagged: boolean; normal_min: number | null; normal_max: number | null }[] }[]
  diagnostics: { severity: string; title: string; description: string; created_at: string }[]
  trends: { label: string; unit: string; direction: string; slope: number; daysToMin: number | null; daysToMax: number | null }[]
  research: EquipmentResearch | null
}): string {
  const { equipment: eq, site, jobs, readingsByVisit, diagnostics, trends, research } = data

  const jobLines = jobs.map(j => {
    const d = j.scheduled_at ? j.scheduled_at.substring(0, 10) : 'Unknown date'
    const summary = j.resolution_summary ? j.resolution_summary.slice(0, 120) : 'No summary'
    return `  ${d}: ${j.service_category} — ${summary}`
  }).join('\n')

  const readingLines = readingsByVisit.map(visit => {
    const valueLines = visit.values.map(v => {
      const range = v.normal_min != null && v.normal_max != null ? ` [Normal: ${v.normal_min}–${v.normal_max}]` : ''
      const flag = v.is_flagged ? ' ⚠ FLAGGED' : ''
      return `    ${v.label}: ${v.value} ${v.unit}${range}${flag}`
    }).join('\n')
    return `  ${visit.date} (${visit.jobNumber}):\n${valueLines}`
  }).join('\n')

  const diagLines = diagnostics.length > 0
    ? diagnostics.map(d => `  - [${d.severity.toUpperCase()}] ${d.title}: ${d.description.slice(0, 100)}`).join('\n')
    : '  None in last 6 months'

  const trendLines = trends.length > 0
    ? trends.map(t => {
        const dir = t.direction === 'stable' ? 'stable' : `trending ${t.direction} at ${Math.abs(t.slope).toFixed(3)} ${t.unit}/day`
        const alert = t.daysToMin != null ? ` — ALERT: est. to breach min in ${t.daysToMin} days`
                    : t.daysToMax != null ? ` — ALERT: est. to breach max in ${t.daysToMax} days`
                    : ''
        return `  - ${t.label}: ${dir}${alert}`
      }).join('\n')
    : '  Insufficient data for trend analysis'

  const lastJob = jobs[jobs.length - 1]
  const weatherLine = lastJob?.weather_snapshot
    ? `${lastJob.weather_snapshot.temp_f}°F, ${lastJob.weather_snapshot.humidity}% humidity, ${lastJob.weather_snapshot.description}`
    : 'Not available'

  return `EQUIPMENT:
- Unit: ${eq.unit_type} | ${eq.manufacturer} ${eq.model_number ?? ''}
- Serial: ${eq.serial_number ?? 'Unknown'} | Refrigerant: ${eq.refrigerant_type ?? 'Unknown'}
- Tonnage: ${eq.tonnage ?? 'Unknown'} tons | Install Date: ${eq.install_date ?? 'Unknown'}
- Location: ${(site.city as string) ?? ''}, ${(site.state as string) ?? ''}
- Status: ${eq.status}

SERVICE HISTORY (${jobs.length} jobs, most recent first):
${jobLines}

ALL READINGS (oldest to newest):
${readingLines}

ACTIVE DIAGNOSTIC ALERTS (last 6 months):
${diagLines}

READING TRENDS:
${trendLines}

MOST RECENT WEATHER:
${weatherLine}

MODEL REFERENCE (manufacturer specs, known issues, expected lifespan):
${buildResearchSection(research)}

Provide your analysis now. Where relevant, compare observed readings and issues against the model reference data above.`
}

export async function generateAiSummary(
  equipmentId: string,
): Promise<{ summary: AiSummary } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const { data: membership } = await supabase
      .from('memberships')
      .select('tenant_id, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()
    if (!membership) return { error: 'Unauthorized' }

    // Fetch all needed data in parallel
    const [eqResult, readingsResult, diagnosticsResult, jobsResult] = await Promise.all([
      supabase.from('equipment')
        .select('*, customers(name), sites(name, city, state, address_line1)')
        .eq('id', equipmentId)
        .eq('tenant_id', membership.tenant_id)
        .is('deleted_at', null)
        .single(),
      supabase.from('readings')
        .select('value, is_flagged, captured_at, job_id, reading_types(key, label, unit, normal_min, normal_max), jobs(job_number, scheduled_at, weather_snapshot)')
        .eq('equipment_id', equipmentId)
        .not('value', 'is', null)
        .order('captured_at', { ascending: true })
        .limit(500),
      supabase.from('diagnostic_results')
        .select('severity, title, description, created_at')
        .eq('equipment_id', equipmentId)
        .gte('created_at', new Date(Date.now() - 180 * 86400000).toISOString())
        .order('created_at', { ascending: false }),
      supabase.from('job_equipment')
        .select('jobs(scheduled_at, service_category, resolution_summary, weather_snapshot)')
        .eq('equipment_id', equipmentId)
        .order('created_at', { ascending: false })
        .limit(30),
    ])

    if (!eqResult.data) return { error: 'Equipment not found' }

    let eq = eqResult.data

    // Ensure model research exists — generate it first if missing
    let research = (eq.research_data ?? null) as EquipmentResearch | null
    if (!research) {
      const researchResult = await generateEquipmentResearch(equipmentId)
      if ('research' in researchResult && researchResult.research) {
        research = researchResult.research as EquipmentResearch
      }
    }
    const rawReadings = readingsResult.data ?? []
    const diagnostics = (diagnosticsResult.data ?? []) as unknown as { severity: string; title: string; description: string; created_at: string }[]
    const jobs = ((jobsResult.data ?? [])
      .map(je => je.jobs)
      .filter(Boolean) as { scheduled_at: string | null; service_category: string; resolution_summary: string | null; weather_snapshot: WeatherSnapshot | null }[])
      .reverse() // oldest first

    type VisitValue = { label: string; key: string; value: number; unit: string; is_flagged: boolean; normal_min: number | null; normal_max: number | null }
    type VisitEntry = { date: string; jobNumber: string; values: VisitValue[] }

    // Group readings by job visit
    const byJob: Record<string, VisitEntry> = {}
    for (const r of rawReadings) {
      const rt = r.reading_types as unknown as { key: string; label: string; unit: string; normal_min: number | null; normal_max: number | null } | null
      if (!rt || r.value == null) continue
      const jid = r.job_id as string
      const jobInfo = r.jobs as unknown as { job_number: string; scheduled_at: string | null } | null
      if (!byJob[jid]) byJob[jid] = {
        date: (r.captured_at as string).substring(0, 10),
        jobNumber: jobInfo?.job_number ?? jid.slice(0, 8),
        values: [],
      }
      byJob[jid].values.push({
        label: rt.label, key: rt.key, value: r.value as number,
        unit: rt.unit, is_flagged: r.is_flagged as boolean,
        normal_min: rt.normal_min, normal_max: rt.normal_max,
      })
    }
    const readingsByVisit = Object.values(byJob).sort((a, b) => a.date < b.date ? -1 : 1)

    // Compute simple trends for the prompt
    const byKey: Record<string, { date: number; value: number }[]> = {}
    for (const r of rawReadings) {
      const rt = r.reading_types as unknown as { key: string; label: string; unit: string } | null
      if (!rt || r.value == null) continue
      if (!byKey[rt.key]) byKey[rt.key] = []
      byKey[rt.key].push({ date: new Date(r.captured_at as string).getTime(), value: r.value as number })
    }

    type TrendSummary = { label: string; unit: string; direction: string; slope: number; daysToMin: number | null; daysToMax: number | null }
    const trends: TrendSummary[] = []
    const rtMeta: Record<string, { label: string; unit: string; normal_min: number | null; normal_max: number | null }> = {}
    for (const r of rawReadings) {
      const rt = r.reading_types as unknown as { key: string; label: string; unit: string; normal_min: number | null; normal_max: number | null } | null
      if (rt && !rtMeta[rt.key]) rtMeta[rt.key] = { label: rt.label, unit: rt.unit, normal_min: rt.normal_min, normal_max: rt.normal_max }
    }

    for (const [key, pts] of Object.entries(byKey)) {
      const meta = rtMeta[key]
      if (!meta || pts.length < 4) continue
      pts.sort((a, b) => a.date - b.date)
      const t0 = pts[0].date
      const xs = pts.map(p => (p.date - t0) / 86400000)
      const ys = pts.map(p => p.value)
      const n = pts.length
      const sumX = xs.reduce((a, b) => a + b, 0)
      const sumY = ys.reduce((a, b) => a + b, 0)
      const sumXY = xs.reduce((s, x, i) => s + x * ys[i], 0)
      const sumX2 = xs.reduce((s, x) => s + x * x, 0)
      const denom = n * sumX2 - sumX * sumX
      if (denom === 0) continue
      const slope = (n * sumXY - sumX * sumY) / denom
      const yMean = sumY / n
      const ssTot = pts.reduce((s, p) => s + (p.value - yMean) ** 2, 0)
      const intercept = (sumY - slope * sumX) / n
      const ssRes = pts.reduce((s, p, i) => s + (p.value - (slope * xs[i] + intercept)) ** 2, 0)
      const r2 = ssTot === 0 ? 0 : 1 - ssRes / ssTot
      if (r2 < 0.35) continue

      const lastX = xs[xs.length - 1]
      const currentVal = slope * lastX + intercept
      const direction = Math.abs(slope) < 0.05 ? 'stable' : slope > 0 ? 'rising' : 'falling'

      function daysTo(threshold: number) {
        if (slope === 0) return null
        const d = Math.round((threshold - currentVal) / slope)
        return d > 0 && d < 730 ? d : null
      }

      trends.push({
        label: meta.label,
        unit: meta.unit,
        direction,
        slope,
        daysToMin: direction === 'falling' && meta.normal_min != null ? daysTo(meta.normal_min) : null,
        daysToMax: direction === 'rising' && meta.normal_max != null ? daysTo(meta.normal_max) : null,
      })
    }

    const site = (eq.sites ?? {}) as unknown as Record<string, unknown>
    const prompt = buildPrompt({
      equipment: eq as unknown as Record<string, unknown>,
      customer: ((eq.customers ?? {}) as unknown as Record<string, unknown>),
      site,
      jobs,
      readingsByVisit,
      diagnostics,
      trends,
      research,
    })

    const Anthropic = (await import('@anthropic-ai/sdk')).default
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1400,
      system: `You are an expert HVAC field service analyst. Analyze structured equipment data and return a JSON assessment.
Your audience is experienced HVAC technicians and service managers.
Ground all findings in the actual data. Never invent readings or issues not present.
Respond ONLY with valid JSON matching this schema exactly — no markdown, no extra text:
{
  "overallAssessment": "string (1-2 sentences)",
  "condition": "good|watch|action_required|critical",
  "keyFindings": ["string", ...],
  "trendAnalysis": "string (1 paragraph)",
  "recommendedActions": [{"priority": "high|medium|low", "action": "string"}, ...]
}`,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = response.content[0]
    if (content.type !== 'text') return { error: 'Unexpected AI response format' }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return { error: 'Could not parse AI response' }

    const parsed = JSON.parse(jsonMatch[0]) as Omit<AiSummary, 'generatedAt' | 'modelUsed'>
    const summary: AiSummary = {
      ...parsed,
      generatedAt: new Date().toISOString(),
      modelUsed: 'claude-haiku-4-5-20251001',
    }

    // Persist to DB (fire-and-forget errors)
    const admin = await createAdminClient()
    await admin.from('equipment').update({
      ai_summary: summary as unknown as import('@/types/database').Json,
      ai_summary_generated_at: summary.generatedAt,
    }).eq('id', equipmentId)

    return { summary }
  } catch (err) {
    console.error('[ai-summary] failed', err)
    return { error: 'Failed to generate summary. Check API key and try again.' }
  }
}
