import { resend, FROM_ADDRESS } from './resend'

const EMAIL_HEADER = `
  <div style="background:#000;padding:24px;text-align:center;">
    <span style="color:#FFD100;font-size:22px;font-weight:bold;letter-spacing:1px;">FIELDPIECE DIGITAL</span>
  </div>
`
const EMAIL_FOOTER = `
  <div style="padding:16px;text-align:center;color:#999;font-size:12px;">
    Fieldpiece Digital — HVAC Intelligence Platform
  </div>
`

/** Sent when a technician is assigned to a job */
export async function sendJobAssignedEmail({
  to,
  customerName,
  jobNumber,
  technicianName,
  scheduledAt,
  notes,
}: {
  to: string
  customerName: string
  jobNumber: string
  technicianName: string
  scheduledAt: string | null
  notes: string | null
}) {
  const arrivalLine = scheduledAt
    ? `<p><strong>Scheduled arrival:</strong> ${new Date(scheduledAt).toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        hour: 'numeric', minute: '2-digit', timeZoneName: 'short',
      })}</p>`
    : `<p>Your technician will contact you to confirm an arrival time.</p>`

  const notesSection = notes
    ? `<div style="background:#f5f5f5;border-left:4px solid #FFD100;padding:16px;margin:16px 0;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-size:13px;color:#666;">Notes from your technician:</p>
        <p style="margin:8px 0 0;color:#111;">${notes}</p>
       </div>`
    : ''

  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your technician has been assigned — Job #${jobNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${EMAIL_HEADER}
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Your technician is on the way</h2>
          <p>Hi ${customerName},</p>
          <p>Good news — a technician has been assigned to your service request and will be arriving soon.</p>
          <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 8px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.5px;">Job #${jobNumber}</p>
            <p style="margin:0 0 12px;font-size:18px;font-weight:bold;color:#111;">Technician: ${technicianName}</p>
            ${arrivalLine}
          </div>
          ${notesSection}
          <p style="color:#666;font-size:14px;">If you need to reschedule or have questions, please reply to this email.</p>
        </div>
        ${EMAIL_FOOTER}
      </div>
    `,
  })
}

/** Sent when a job is marked completed */
export async function sendJobCompletedEmail({
  to,
  customerName,
  jobNumber,
  technicianName,
  resolutionSummary,
}: {
  to: string
  customerName: string
  jobNumber: string
  technicianName: string
  resolutionSummary: string | null
}) {
  const summarySection = resolutionSummary
    ? `<div style="background:#f5f5f5;border-left:4px solid #FFD100;padding:16px;margin:16px 0;border-radius:0 4px 4px 0;">
        <p style="margin:0;font-size:13px;color:#666;">Work performed:</p>
        <p style="margin:8px 0 0;color:#111;">${resolutionSummary}</p>
       </div>`
    : ''

  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `Your repair is complete — Job #${jobNumber}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${EMAIL_HEADER}
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Your repair is complete</h2>
          <p>Hi ${customerName},</p>
          <p>Your service appointment has been completed by <strong>${technicianName}</strong>. We hope everything is working great!</p>
          <div style="background:#f9f9f9;border:1px solid #e5e5e5;border-radius:6px;padding:20px;margin:24px 0;">
            <p style="margin:0 0 4px;font-size:13px;color:#666;text-transform:uppercase;letter-spacing:.5px;">Job #${jobNumber}</p>
            <p style="margin:0;font-size:15px;font-weight:bold;color:#111;">Status: <span style="color:#00c853;">Complete ✓</span></p>
          </div>
          ${summarySection}
          <p style="color:#666;font-size:14px;">If you have any concerns about the work performed or need follow-up service, please don't hesitate to reach out by replying to this email.</p>
          <p style="color:#666;font-size:14px;">Thank you for choosing us for your HVAC service needs.</p>
        </div>
        ${EMAIL_FOOTER}
      </div>
    `,
  })
}
