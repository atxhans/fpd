'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'

// ─── Types passed from the client (already-computed aggregations) ─────────────

export interface FleetBriefInput {
  totalUnits: number
  manufacturers: {
    manufacturer: string
    count: number
    avg_health: number | null
    at_risk: number
    failure_rate: number
  }[]
  topFailures: {
    manufacturer: string
    title: string
    count: number
    criticalCount: number
  }[]
  ageData: Record<string, string | number>[]
  allMfg: string[]
}

export interface ManufacturerProfileInput {
  manufacturer: string
  count: number
  avg_health: number | null
  at_risk: number
  failure_rate: number
  models: { model: string; count: number; avg_health: number | null }[]
  ageHealth: { bucket: string; avg_health: number | null }[]
  topFailures: { title: string; count: number; criticalCount: number }[]
}

export interface ManufacturerProfile {
  condition: string
  failure_signatures: string
  recommendation: string
}

// ─── Auth helper ──────────────────────────────────────────────────────────────

async function requirePlatformUser() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()
  return !!profile?.is_platform_user
}

// ─── Fleet Intelligence Brief ─────────────────────────────────────────────────

export async function generateFleetBrief(
  data: FleetBriefInput,
): Promise<{ brief: string } | { error: string }> {
  if (!await requirePlatformUser()) return { error: 'Unauthorized' }

  const mfgTable = data.manufacturers
    .map(m => `  ${m.manufacturer}: ${m.count} units, avg health ${m.avg_health ?? '—'}/100, ${m.at_risk} at risk, ${m.failure_rate}% retired/decommissioned`)
    .join('\n')

  const failureLines = data.topFailures
    .slice(0, 15)
    .map(f => `  [${f.manufacturer}] ${f.title} — ${f.count} occurrence${f.count !== 1 ? 's' : ''}${f.criticalCount > 0 ? ` (${f.criticalCount} critical)` : ''}`)
    .join('\n')

  const ageLines = data.allMfg.map(mfg => {
    const row = data.ageData.map(d => {
      const val = d[mfg]
      return `${d.bucket}: ${val != null ? val : '—'}`
    }).join(' | ')
    return `  ${mfg}: ${row}`
  }).join('\n')

  const prompt = `You are a senior HVAC fleet analyst. Analyze this equipment performance data across all service companies and write an executive intelligence brief.

FLEET OVERVIEW — ${data.totalUnits} total units, ${data.manufacturers.length} manufacturers:
${mfgTable}

TOP FAILURE PATTERNS (by manufacturer, ranked by critical count):
${failureLines}

HEALTH BY AGE BRACKET (avg health score):
${ageLines}

Write a 4-paragraph executive intelligence brief:

Paragraph 1 — Overall fleet health: Assess the state of the fleet with specific numbers. Which manufacturers stand out positively or negatively?

Paragraph 2 — Key performance differences: What is driving the health differences between manufacturers? Reference failure patterns and age data.

Paragraph 3 — Risk concentration: Where is risk clustering? Which manufacturers, models, or age groups are approaching critical thresholds?

Paragraph 4 — Actionable recommendations: Specific guidance on procurement priorities, maintenance schedule adjustments, and replacement planning.

Write for a service operations director or company owner. Be specific with numbers. Use plain text paragraphs only — no bullet points, no headers, no markdown.`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 900,
      system: 'You are a senior HVAC fleet analyst. Write concise, data-driven executive analysis. Plain text only.',
      messages: [{ role: 'user', content: prompt }],
    })
    const brief = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    if (!brief) return { error: 'Empty response from AI' }
    return { brief }
  } catch (err) {
    console.error('[fleet-brief]', err)
    return { error: 'Failed to generate analysis' }
  }
}

// ─── Manufacturer Risk Profile ────────────────────────────────────────────────

export async function generateManufacturerProfile(
  data: ManufacturerProfileInput,
): Promise<{ profile: ManufacturerProfile } | { error: string }> {
  if (!await requirePlatformUser()) return { error: 'Unauthorized' }

  const modelLines = data.models
    .slice(0, 8)
    .map(m => `  ${m.model}: ${m.count} units, avg health ${m.avg_health ?? '—'}/100`)
    .join('\n')

  const ageLines = data.ageHealth
    .map(a => `  ${a.bucket}: ${a.avg_health ?? '—'}/100`)
    .join('\n')

  const failureLines = data.topFailures
    .slice(0, 8)
    .map(f => `  "${f.title}" — ${f.count} occurrence${f.count !== 1 ? 's' : ''}${f.criticalCount > 0 ? ` (${f.criticalCount} critical)` : ''}`)
    .join('\n')

  const prompt = `You are a senior HVAC fleet analyst. Generate a risk profile for ${data.manufacturer} based on field performance data.

SUMMARY:
  Units in fleet: ${data.count}
  Average health score: ${data.avg_health ?? '—'}/100
  At-risk units (health < 50): ${data.at_risk} (${data.count > 0 ? Math.round(data.at_risk / data.count * 100) : 0}%)
  Retired/decommissioned: ${data.failure_rate}%

TOP MODELS:
${modelLines || '  No model data'}

HEALTH BY AGE:
${ageLines}

TOP FAILURE PATTERNS:
${failureLines || '  No diagnostic data'}

Return ONLY valid JSON with exactly these three fields (plain prose, no bullet points or markdown):
{
  "condition": "<2-3 sentences: current fleet health for this manufacturer, with specific numbers>",
  "failure_signatures": "<2-3 sentences: are failures systematic/design-related, environmental, age-related, or maintenance-driven? Reference the actual patterns.>",
  "recommendation": "<2-3 sentences: specific guidance on procurement decisions, maintenance intervals, and replacement planning>"
}`

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      system: 'You are an HVAC fleet analyst. Respond only with valid JSON, no other text.',
      messages: [{ role: 'user', content: prompt }],
    })
    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { error: 'Could not parse AI response' }
    const profile = JSON.parse(match[0]) as ManufacturerProfile
    return { profile }
  } catch (err) {
    console.error('[mfg-profile]', err)
    return { error: 'Failed to generate profile' }
  }
}
