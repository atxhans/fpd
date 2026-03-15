import { resend, FROM_ADDRESS } from './resend'
import { renderTemplate } from './template-renderer'

/** Sent to a matched customer confirming their request was received */
export async function sendServiceRequestConfirmation({
  to,
  tenantId,
  customerName,
  requestId,
  description,
}: {
  to: string
  tenantId: string | null
  customerName: string
  requestId: string
  description: string
}) {
  // If no tenant is matched yet, fall back to the default template without DB lookup
  const { subject, html } = tenantId
    ? await renderTemplate(tenantId, 'service_request_confirmation', { customerName, requestId, description })
    : {
        subject: 'Your service request has been received',
        html: `<p>Hi ${customerName}, we received your service request and will be in touch shortly.</p>`,
      }

  return resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
}

/** Sent to an unrecognized email address with a link to fill out their info */
export async function sendUnmatchedInboundReply({
  to,
  tenantId,
  signupUrl,
  description,
}: {
  to: string
  tenantId: string | null
  signupUrl: string
  description: string
}) {
  const { subject, html } = tenantId
    ? await renderTemplate(tenantId, 'service_request_unmatched', { signupUrl, description })
    : {
        subject: 'Complete your service request',
        html: `<p>We received your message. <a href="${signupUrl}">Click here</a> to complete your service request.</p>`,
      }

  return resend.emails.send({ from: FROM_ADDRESS, to, subject, html })
}
