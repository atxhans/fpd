import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/server'
import { normalizeReadings, type RawReading } from '@/lib/ingestion/normalizer'

/**
 * POST /api/ingestion/v1/readings
 *
 * Device/external ingestion endpoint authenticated via API key.
 * Keys are stored as SHA-256 hashes in the api_keys table.
 *
 * Headers:
 *   X-API-Key: <tenant API key (plaintext)>
 *   X-Tenant-Id: <tenant UUID>
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('X-API-Key')
  const tenantIdHeader = request.headers.get('X-Tenant-Id')

  if (!apiKey || !tenantIdHeader) {
    return NextResponse.json(
      { error: 'Missing X-API-Key or X-Tenant-Id headers' },
      { status: 401 }
    )
  }

  const supabase = await createAdminClient()

  // Validate API key by comparing hash against stored records
  const keyHash = createHash('sha256').update(apiKey).digest('hex')
  const { data: keyRecord } = await supabase
    .from('api_keys')
    .select('id, tenant_id')
    .eq('key_hash', keyHash)
    .is('revoked_at', null)
    .single()

  if (!keyRecord || keyRecord.tenant_id !== tenantIdHeader) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
  }

  // Use tenant_id from the validated key record (never trust the header alone)
  const tenantId = keyRecord.tenant_id

  // Update last_used_at asynchronously
  supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id).then()

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
