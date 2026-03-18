'use server'

import { createClient } from '@/lib/supabase/server'
import { sendJobAssignedEmail, sendJobCompletedEmail } from '@/lib/email/jobs'
import { writeAudit } from '@/lib/audit'

type JobStatus = 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

export async function updateJobStatus(
  jobId: string,
  newStatus: JobStatus,
  options?: { technicianId?: string }
) {
  const supabase = await createClient()

  // Fetch current job state before updating (to detect assignment changes)
  const { data: currentJob } = await supabase
    .from('jobs')
    .select('id, job_number, status, assigned_technician_id, scheduled_at, resolution_summary, notes, customer_id, tenant_id')
    .eq('id', jobId)
    .single()

  if (!currentJob) return { error: 'Job not found' }

  // Verify the caller has a role that can update job status
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', currentJob.tenant_id)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher', 'technician']
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  // Build the update payload
  const updates: Record<string, unknown> = { status: newStatus }
  if (newStatus === 'in_progress' && !currentJob.assigned_technician_id) {
    updates.started_at = new Date().toISOString()
  }
  if (newStatus === 'completed') {
    updates.completed_at = new Date().toISOString()
  }
  if (options?.technicianId) {
    updates.assigned_technician_id = options.technicianId
  }

  const { error } = await supabase
    .from('jobs')
    .update(updates)
    .eq('id', jobId)

  if (error) return { error: error.message }

  const techChanged = options?.technicianId && options.technicianId !== currentJob.assigned_technician_id
  const auditAction = techChanged ? 'job.technician_assigned' : newStatus !== currentJob.status ? 'job.status_updated' : 'job.updated'
  void writeAudit({ action: auditAction, tenantId: currentJob.tenant_id, actorId: user.id, actorEmail: user.email, resourceType: 'job', resourceId: jobId, resourceLabel: currentJob.job_number, metadata: { from_status: currentJob.status, to_status: newStatus, technician_id: options?.technicianId ?? null } })

  // ---- Email side effects ----

  // Assigned email: fire when status moves to 'assigned' OR a technician is newly set
  const isAssignment =
    newStatus === 'assigned' ||
    (options?.technicianId && options.technicianId !== currentJob.assigned_technician_id)

  if (isAssignment) {
    await sendAssignmentEmail(supabase, currentJob, options?.technicianId ?? currentJob.assigned_technician_id)
  }

  // Completion email
  if (newStatus === 'completed') {
    await sendCompletionEmail(supabase, currentJob)
  }

  return { ok: true }
}

// ---------- helpers ----------

async function sendAssignmentEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  job: { id: string; job_number: string; scheduled_at: string | null; notes: string | null; customer_id: string; tenant_id: string },
  technicianId: string | null | undefined
) {
  if (!technicianId) return

  const [{ data: customer }, { data: tech }] = await Promise.all([
    supabase.from('customers').select('name, email').eq('id', job.customer_id).single(),
    supabase.from('profiles').select('first_name, last_name').eq('id', technicianId).single(),
  ])

  if (!customer?.email) return // no email on file — skip silently

  const techName = tech
    ? [tech.first_name, tech.last_name].filter(Boolean).join(' ')
    : 'Your technician'

  await sendJobAssignedEmail({
    to:            customer.email,
    tenantId:      job.tenant_id,
    customerName:  customer.name,
    jobNumber:     job.job_number,
    technicianName: techName,
    scheduledAt:   job.scheduled_at,
    notes:         job.notes,
  }).catch(err => console.error('Assignment email failed:', err))
}

export async function createJob(
  tenantId: string,
  data: {
    customer_id: string
    site_id: string
    assigned_technician_id?: string | null
    service_category: string
    priority: string
    scheduled_at?: string | null
    problem_description?: string | null
    notes?: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', tenantId)
    .eq('is_active', true)
    .single()

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) {
    return { error: 'Unauthorized' }
  }

  // Generate job_number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('jobs')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', tenantId)

  const jobNumber = `JOB-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const status = data.assigned_technician_id ? 'assigned' : 'unassigned'

  const { data: job, error } = await supabase
    .from('jobs')
    .insert({
      tenant_id: tenantId,
      job_number: jobNumber,
      customer_id: data.customer_id,
      site_id: data.site_id,
      assigned_technician_id: data.assigned_technician_id ?? null,
      created_by: user.id,
      service_category: data.service_category,
      priority: data.priority as 'low' | 'normal' | 'high' | 'emergency',
      scheduled_at: data.scheduled_at ?? null,
      problem_description: data.problem_description ?? null,
      notes: data.notes ?? null,
      status,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  void writeAudit({ action: 'job.created', tenantId, actorId: user.id, actorEmail: user.email, resourceType: 'job', resourceId: job.id, resourceLabel: jobNumber, metadata: { service_category: data.service_category, priority: data.priority, status } })
  return { ok: true, jobId: job.id }
}

async function sendCompletionEmail(
  supabase: Awaited<ReturnType<typeof createClient>>,
  job: { id: string; job_number: string; assigned_technician_id: string | null; resolution_summary: string | null; customer_id: string; tenant_id: string }
) {
  const [{ data: customer }, { data: tech }] = await Promise.all([
    supabase.from('customers').select('name, email').eq('id', job.customer_id).single(),
    job.assigned_technician_id
      ? supabase.from('profiles').select('first_name, last_name').eq('id', job.assigned_technician_id).single()
      : Promise.resolve({ data: null }),
  ])

  if (!customer?.email) return

  const techName = tech
    ? [tech.first_name, tech.last_name].filter(Boolean).join(' ')
    : 'Your technician'

  await sendJobCompletedEmail({
    to:                customer.email,
    tenantId:          job.tenant_id,
    customerName:      customer.name,
    jobNumber:         job.job_number,
    technicianName:    techName,
    resolutionSummary: job.resolution_summary,
  }).catch(err => console.error('Completion email failed:', err))
}
