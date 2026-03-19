'use server'

import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface FollowUpSuggestion {
  timeframe_days: number
  service_category: string
  description: string
  reason: string
}

export async function generateFollowUpSuggestion(
  jobId: string,
): Promise<{ suggestion: FollowUpSuggestion } | { error: string }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Unauthenticated' }

    const [jobResult, diagResult] = await Promise.all([
      supabase
        .from('jobs')
        .select('job_number, service_category, problem_description, resolution_summary, status, customers(name), sites(city, state)')
        .eq('id', jobId)
        .single(),
      supabase
        .from('diagnostic_results')
        .select('severity, title')
        .eq('job_id', jobId)
        .order('created_at', { ascending: false })
        .limit(5),
    ])

    const job = jobResult.data
    if (!job) return { error: 'Job not found' }

    // Get equipment via job_equipment
    const { data: jobEquipment } = await supabase
      .from('job_equipment')
      .select('equipment(manufacturer, model_number, unit_type, health_score)')
      .eq('job_id', jobId)
      .limit(1)
      .single()

    const eq = (jobEquipment?.equipment as unknown as {
      manufacturer: string; model_number: string | null
      unit_type: string; health_score: number | null
    } | null)

    const customer = job.customers as unknown as { name: string } | null
    const site = job.sites as unknown as { city: string; state: string } | null
    const diags = diagResult.data ?? []

    const prompt = `You are an HVAC service manager reviewing a completed service call. Recommend a specific follow-up visit.

Service call:
- Job: ${job.job_number} — ${job.service_category?.replace(/_/g, ' ')} (${job.status})
- Customer: ${customer?.name ?? 'Unknown'} · ${site?.city ?? ''}, ${site?.state ?? ''}
${eq ? `- Equipment: ${eq.manufacturer} ${eq.model_number ?? ''} (${eq.unit_type?.replace(/_/g, ' ')})` : ''}
${eq?.health_score != null ? `- Health Score: ${eq.health_score}/100` : ''}
- Problem: ${job.problem_description ?? 'Not specified'}
- Resolution: ${job.resolution_summary ?? 'Not specified'}
${diags.length ? `- Diagnostics: ${diags.map(d => `[${d.severity}] ${d.title}`).join('; ')}` : ''}

Return ONLY valid JSON:
{
  "timeframe_days": <integer, days from today until follow-up>,
  "service_category": "<maintenance|repair|inspection>",
  "description": "<specific 1-2 sentence description of what to do at the follow-up>",
  "reason": "<1-2 sentence explanation of why this follow-up is needed>"
}`

    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: 'You are an HVAC service expert. Respond only with valid JSON, no other text.',
      messages: [{ role: 'user', content: prompt }],
    })

    const text = response.content[0].type === 'text' ? response.content[0].text : ''
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return { error: 'Could not parse suggestion' }

    const suggestion = JSON.parse(match[0]) as FollowUpSuggestion
    return { suggestion }
  } catch (err) {
    console.error('[follow-up] suggestion failed', err)
    return { error: 'Failed to generate suggestion' }
  }
}

export async function createFollowUpJob(params: {
  originalJobId: string
  scheduledDate: string
  service_category: string
  description: string
}): Promise<{ jobId: string; jobNumber: string } | { error: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: original } = await supabase
    .from('jobs')
    .select('tenant_id, customer_id, site_id, job_number')
    .eq('id', params.originalJobId)
    .single()
  if (!original) return { error: 'Original job not found' }

  // Generate job number based on count
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', original.tenant_id)

  const jobNumber = `JOB-${String((count ?? 0) + 1).padStart(4, '0')}`

  const scheduledAt = params.scheduledDate
    ? `${params.scheduledDate}T09:00:00`
    : null

  const { data: newJob, error } = await supabase
    .from('jobs')
    .insert({
      tenant_id: original.tenant_id,
      customer_id: original.customer_id,
      site_id: original.site_id,
      job_number: jobNumber,
      service_category: params.service_category,
      problem_description: params.description,
      status: 'unassigned',
      priority: 'normal',
      scheduled_at: scheduledAt,
      created_by: user.id,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }

  // Copy equipment links from the original job
  const { data: jobEquipment } = await supabase
    .from('job_equipment')
    .select('equipment_id')
    .eq('job_id', params.originalJobId)

  if (jobEquipment?.length) {
    await supabase.from('job_equipment').insert(
      jobEquipment.map(je => ({
        job_id: newJob.id,
        equipment_id: je.equipment_id,
        tenant_id: original.tenant_id,
      }))
    )
  }

  revalidatePath('/jobs')
  revalidatePath('/schedule')
  return { jobId: newJob.id, jobNumber }
}
