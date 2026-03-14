import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeReadings, type RawReading } from '@/lib/ingestion/normalizer'

/**
 * POST /api/ingestion/v1/readings
 *
 * Future device ingestion endpoint.
 * Currently accepts manual API submissions with API key auth.
 * Designed to support Fieldpiece tool/device webhooks in future phases.
 *
 * Headers:
 *   X-API-Key: <tenant API key>
 *   X-Tenant-Id: <tenant UUID>
 */
export async function POST(request: NextRequest) {
  // API key auth (placeholder — implement proper key management later)
  const apiKey = request.headers.get('X-API-Key')
  const tenantId = request.headers.get('X-Tenant-Id')

  if (!apiKey || !tenantId) {
    return NextResponse.json(
      { error: 'Missing X-API-Key or X-Tenant-Id headers' },
      { status: 401 }
    )
  }

  let body: { job_id: string; equipment_id?: string; technician_id: string; readings: RawReading[] }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { job_id, equipment_id, technician_id, readings: rawReadings } = body

  if (!job_id || !technician_id || !Array.isArray(rawReadings)) {
    return NextResponse.json({ error: 'Missing required fields: job_id, technician_id, readings' }, { status: 400 })
  }

  // Normalize readings
  const normalized = normalizeReadings(rawReadings)
  const validReadings = normalized.filter((r) => r.isValid)
  const invalidReadings = normalized.filter((r) => !r.isValid)

  const supabase = await createClient()

  // Verify job belongs to tenant
  const { data: job } = await supabase
    .from('jobs').select('id, tenant_id').eq('id', job_id).eq('tenant_id', tenantId).single()

  if (!job) {
    return NextResponse.json({ error: 'Job not found or tenant mismatch' }, { status: 404 })
  }

  // Get reading type IDs
  const keys = validReadings.map((r) => r.key)
  const { data: readingTypes } = await supabase
    .from('reading_types').select('id, key').in('key', keys)

  const rtMap = new Map(readingTypes?.map((rt) => [rt.key, rt.id]) ?? [])

  const insertRows = validReadings
    .filter((r) => rtMap.has(r.key))
    .map((r) => ({
      tenant_id: tenantId,
      job_id,
      equipment_id: equipment_id ?? null,
      technician_id,
      reading_type_id: rtMap.get(r.key)!,
      value: r.value,
      bool_value: r.boolValue,
      text_value: r.textValue,
      unit: r.unit,
      raw_value: r.rawValue as import('@/types/database').Json | undefined,
      source: 'api' as const,
    }))

  const { error: insertError } = await supabase.from('readings').insert(insertRows)

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  return NextResponse.json({
    inserted: insertRows.length,
    rejected: invalidReadings.length,
    rejections: invalidReadings.map((r) => ({ key: r.key, reason: r.validationError })),
  })
}
