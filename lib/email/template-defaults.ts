export type TemplateKey =
  | 'job_assigned'
  | 'job_completed'
  | 'service_request_confirmation'
  | 'service_request_unmatched'

export interface TemplateDefinition {
  key: TemplateKey
  label: string
  description: string
  variables: { name: string; description: string }[]
  defaultSubject: string
  defaultHtml: string
}

const HEADER = `<div style="background:#000;padding:24px;text-align:center;">
  <span style="color:#FFD100;font-size:22px;font-weight:bold;letter-spacing:1px;">FIELDPIECE DIGITAL</span>
</div>`

const FOOTER = `<div style="padding:16px;text-align:center;color:#999;font-size:12px;">
  Fieldpiece Digital — HVAC Intelligence Platform
</div>`

function wrap(body: string) {
  return `<div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#fff;">${HEADER}<div style="padding:32px;">${body}</div>${FOOTER}</div>`
}

export const TEMPLATE_DEFINITIONS: TemplateDefinition[] = [
  {
    key: 'job_assigned',
    label: 'Job Assigned',
    description: 'Sent to the customer when a technician is assigned to their job.',
    variables: [
      { name: 'customerName',   description: 'Customer full name' },
      { name: 'jobNumber',      description: 'Job reference number' },
      { name: 'technicianName', description: 'Assigned technician name' },
      { name: 'scheduledAt',    description: 'Scheduled arrival date/time' },
      { name: 'notes',          description: 'Job notes (if any)' },
    ],
    defaultSubject: 'Your technician has been assigned — Job #{{jobNumber}}',
    defaultHtml: wrap(`
      <h2 style="color:#111;margin-top:0;">Your technician is on the way</h2>
      <p>Hi {{customerName}},</p>
      <p>Great news — a technician has been assigned to your job <strong>#{{jobNumber}}</strong>.</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0;">
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;width:40%;">Technician</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">{{technicianName}}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #eee;color:#666;">Scheduled</td><td style="padding:8px;border-bottom:1px solid #eee;font-weight:bold;">{{scheduledAt}}</td></tr>
      </table>
      <p style="color:#555;">{{notes}}</p>
      <p style="color:#666;font-size:14px;">Questions? Reply to this email and we'll get back to you.</p>
    `),
  },
  {
    key: 'job_completed',
    label: 'Job Completed',
    description: 'Sent to the customer when their job is marked complete.',
    variables: [
      { name: 'customerName',      description: 'Customer full name' },
      { name: 'jobNumber',         description: 'Job reference number' },
      { name: 'technicianName',    description: 'Technician name' },
      { name: 'resolutionSummary', description: 'Summary of work performed' },
    ],
    defaultSubject: 'Your service is complete — Job #{{jobNumber}}',
    defaultHtml: wrap(`
      <h2 style="color:#111;margin-top:0;">Your service is complete</h2>
      <p>Hi {{customerName}},</p>
      <p>Your job <strong>#{{jobNumber}}</strong> has been completed by <strong>{{technicianName}}</strong>.</p>
      <h3 style="color:#333;margin-bottom:8px;">Work Summary</h3>
      <div style="background:#f9f9f9;border-left:4px solid #FFD100;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#333;">{{resolutionSummary}}</p>
      </div>
      <p style="color:#666;font-size:14px;">Thank you for choosing us. If you have any concerns, please don't hesitate to reach out.</p>
    `),
  },
  {
    key: 'service_request_confirmation',
    label: 'Service Request Confirmation',
    description: 'Sent to a known customer when their service request is received.',
    variables: [
      { name: 'customerName', description: 'Customer full name' },
      { name: 'requestId',    description: 'Service request ID' },
      { name: 'description',  description: 'Description of the issue' },
    ],
    defaultSubject: 'We received your service request',
    defaultHtml: wrap(`
      <h2 style="color:#111;margin-top:0;">We've got your request</h2>
      <p>Hi {{customerName}},</p>
      <p>We've received your service request and will be in touch shortly to schedule an appointment.</p>
      <h3 style="color:#333;margin-bottom:8px;">What you submitted</h3>
      <div style="background:#f9f9f9;border-left:4px solid #FFD100;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#333;">{{description}}</p>
      </div>
      <p style="color:#666;font-size:14px;">Reference: {{requestId}}</p>
    `),
  },
  {
    key: 'service_request_unmatched',
    label: 'New Customer Signup Invite',
    description: 'Sent to an unrecognized email address after they contact you. Includes a link to complete their profile.',
    variables: [
      { name: 'signupUrl',   description: 'Link to the service request form' },
      { name: 'description', description: 'The original message they sent' },
    ],
    defaultSubject: 'Complete your service request',
    defaultHtml: wrap(`
      <h2 style="color:#111;margin-top:0;">Thanks for reaching out</h2>
      <p>We received your message and would love to help. To get started, please complete your contact information so we can schedule your service.</p>
      <div style="background:#f9f9f9;border-left:4px solid #FFD100;padding:12px 16px;margin:16px 0;">
        <p style="margin:0;color:#555;font-size:14px;">{{description}}</p>
      </div>
      <p style="text-align:center;margin:24px 0;">
        <a href="{{signupUrl}}" style="background:#FFD100;color:#000;padding:12px 28px;text-decoration:none;font-weight:bold;border-radius:4px;display:inline-block;">
          Complete My Request
        </a>
      </p>
      <p style="color:#999;font-size:12px;text-align:center;">Or copy this link: {{signupUrl}}</p>
    `),
  },
]

export function getTemplateDefinition(key: string): TemplateDefinition | undefined {
  return TEMPLATE_DEFINITIONS.find(t => t.key === key)
}
