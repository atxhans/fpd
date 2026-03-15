import { resend, FROM_ADDRESS } from './resend'
import { renderTemplate } from './template-renderer'

/** Sent when a technician is assigned to a job */
export async function sendJobAssignedEmail({
  to,
  tenantId,
  customerName,
  jobNumber,
  technicianName,
  scheduledAt,
  notes,
}: {
  to: string
  tenantId: string
  customerName: string
  jobNumber: string
  technicianName: string
  scheduledAt: string | null
  notes: string | null
}) {
  const scheduledAtFormatted = scheduledAt
    ? new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: 'numeric', minute: '2-digit',
      })
    : 'To be confirmed'

  const { subject, html } = await renderTemplate(tenantId, 'job_assigned', {
    customerName,
    jobNumber,
    technicianName,
    scheduledAt: scheduledAtFormatted,
    notes: notes ?? '',
  })

  return resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
}

/** Sent when a job is marked completed */
export async function sendJobCompletedEmail({
  to,
  tenantId,
  customerName,
  jobNumber,
  technicianName,
  resolutionSummary,
}: {
  to: string
  tenantId: string
  customerName: string
  jobNumber: string
  technicianName: string
  resolutionSummary: string | null
}) {
  const { subject, html } = await renderTemplate(tenantId, 'job_completed', {
    customerName,
    jobNumber,
    technicianName,
    resolutionSummary: resolutionSummary ?? 'No summary provided.',
  })

  return resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
}
