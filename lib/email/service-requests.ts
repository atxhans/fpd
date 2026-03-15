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

/** Sent to a matched customer confirming their request was received */
export async function sendServiceRequestConfirmation({
  to,
  customerName,
  requestId,
  description,
}: {
  to: string
  customerName: string
  requestId: string
  description: string
}) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Your service request has been received',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${EMAIL_HEADER}
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">Service request received</h2>
          <p>Hi ${customerName},</p>
          <p>Thank you for contacting us. We've received your service request and a member of our team will be in touch shortly to schedule your appointment.</p>
          <div style="background:#f5f5f5;border-left:4px solid #FFD100;padding:16px;margin:24px 0;border-radius:0 4px 4px 0;">
            <p style="margin:0;font-size:13px;color:#666;">Request #${requestId.slice(0, 8).toUpperCase()}</p>
            <p style="margin:8px 0 0;color:#111;">${description}</p>
          </div>
          <p style="color:#666;font-size:14px;">If you have any questions in the meantime, reply to this email or call us directly.</p>
        </div>
        ${EMAIL_FOOTER}
      </div>
    `,
  })
}

/** Sent to an unrecognized email address with a link to fill out their info */
export async function sendUnmatchedInboundReply({
  to,
  signupUrl,
  description,
}: {
  to: string
  signupUrl: string
  description: string
}) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Complete your service request — Fieldpiece Digital',
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        ${EMAIL_HEADER}
        <div style="padding:32px;background:#fff;">
          <h2 style="color:#111;margin-top:0;">One more step to complete your request</h2>
          <p>We received your service request — thank you for reaching out!</p>
          <p>We weren't able to find an existing account associated with your email address. Please take a moment to fill in your contact information so we can schedule your service appointment.</p>
          <div style="background:#f5f5f5;border-left:4px solid #FFD100;padding:16px;margin:24px 0;border-radius:0 4px 4px 0;">
            <p style="margin:0;font-size:13px;color:#666;">Your request:</p>
            <p style="margin:8px 0 0;color:#111;">${description}</p>
          </div>
          <a href="${signupUrl}" style="display:inline-block;background:#FFD100;color:#000;padding:14px 28px;text-decoration:none;font-weight:bold;border-radius:4px;margin:8px 0;">
            Complete My Request
          </a>
          <p style="color:#666;font-size:13px;margin-top:24px;">This link expires in 7 days. If you didn't send a service request, you can safely ignore this email.</p>
        </div>
        ${EMAIL_FOOTER}
      </div>
    `,
  })
}
