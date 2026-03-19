'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

export interface EquipmentResearch {
  summary: string
  manufacturer_info: string
  product_line: string
  typical_applications: string[]
  key_specs: { label: string; value: string }[]
  efficiency: string
  common_issues: { title: string; description: string; severity: 'low' | 'medium' | 'high' }[]
  maintenance: { task: string; interval: string }[]
  resources: { label: string; url: string; type: 'manual' | 'spec' | 'guide' | 'other' }[]
  recall_info: string | null
  lifespan: string
  product_page_url: string | null
  image_url: string | null
  generated_at: string
}

/** Attempt to pull the og:image from a manufacturer product page. */
async function scrapeOgImage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; HVAC-Research/1.0)' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    })
    if (!res.ok) return null
    const html = await res.text()

    const match =
      html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/i) ??
      html.match(/<meta[^>]+content="([^"]+)"[^>]+property="og:image"/i)
    if (!match) return null

    const src = match[1]
    if (src.startsWith('//')) return `https:${src}`
    if (src.startsWith('/')) {
      const base = new URL(url)
      return `${base.origin}${src}`
    }
    return src
  } catch {
    return null
  }
}

export async function generateEquipmentResearch(equipmentId: string) {
  const supabase = await createClient()

  const { data: eq } = await supabase
    .from('equipment')
    .select('manufacturer, model_number, unit_type, refrigerant_type, tonnage')
    .eq('id', equipmentId)
    .single()

  if (!eq) return { error: 'Equipment not found' }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  const prompt = `You are an HVAC equipment specialist. Research the following unit and return a comprehensive JSON reference document.

Equipment: ${eq.manufacturer} ${eq.model_number ?? 'Unknown model'}
Type: ${String(eq.unit_type).replace(/_/g, ' ')}
Refrigerant: ${eq.refrigerant_type ?? 'Unknown'}
Tonnage: ${eq.tonnage ?? 'Unknown'}

Return ONLY valid JSON matching this exact schema (no markdown, no commentary):
{
  "summary": "2–3 sentence overview of this specific model and its market position",
  "manufacturer_info": "Background on the manufacturer and product line",
  "product_line": "Product line name (e.g. Infinity, Performance, XR, SL18XC1)",
  "typical_applications": ["residential", "light commercial"],
  "key_specs": [
    { "label": "Cooling Capacity", "value": "X tons / X BTU" },
    { "label": "SEER / SEER2", "value": "XX" },
    { "label": "EER", "value": "XX" },
    { "label": "Compressor Type", "value": "Scroll / Two-stage / Variable-speed" },
    { "label": "Sound Level", "value": "XX dB" }
  ],
  "efficiency": "Summary of SEER2/EER ratings and ENERGY STAR status",
  "common_issues": [
    {
      "title": "Short descriptive name",
      "description": "Cause and recommended repair or workaround",
      "severity": "low | medium | high"
    }
  ],
  "maintenance": [
    { "task": "Task description", "interval": "Frequency (e.g. Every 3 months)" }
  ],
  "resources": [
    {
      "label": "Installation & Setup Manual",
      "url": "https://...",
      "type": "manual | spec | guide | other"
    }
  ],
  "recall_info": null,
  "lifespan": "Expected lifespan range (e.g. 15–20 years)",
  "product_page_url": "https://manufacturer.com/product/... or null"
}`

  const resp = await anthropic.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2500,
    system: 'You are an HVAC equipment expert. Respond only with valid JSON, no other text.',
    messages: [{ role: 'user', content: prompt }],
  })

  const text = resp.content[0].type === 'text' ? resp.content[0].text : ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) return { error: 'Could not parse research data' }

  let research: EquipmentResearch
  try {
    research = JSON.parse(jsonMatch[0]) as EquipmentResearch
  } catch {
    return { error: 'Invalid JSON from AI' }
  }

  research.generated_at = new Date().toISOString()

  // Try to fetch a reference image from the product page Claude identified
  research.image_url = research.product_page_url
    ? await scrapeOgImage(research.product_page_url)
    : null

  await supabase
    .from('equipment')
    .update({
      research_data: research as unknown as Json,
      research_at: new Date().toISOString(),
    })
    .eq('id', equipmentId)

  return { research }
}
