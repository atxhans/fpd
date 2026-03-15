import { Resend } from 'resend'

// Fall back to a placeholder so the build succeeds when the env var isn't set locally.
// Actual sends will fail at runtime without a real key — set RESEND_API_KEY in .env.local.
export const resend = new Resend(process.env.RESEND_API_KEY ?? 'build_placeholder')

export const FROM_ADDRESS = 'Fieldpiece Digital <noreply@fieldpiecedigital.com>'

export async function sendInvitationEmail({
  to,
  inviterName,
  companyName,
  inviteUrl,
  role,
}: {
  to: string
  inviterName: string
  companyName: string
  inviteUrl: string
  role: string
}) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `You've been invited to ${companyName} on Fieldpiece Digital`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <span style="color: #FFD100; font-size: 24px; font-weight: bold;">FIELDPIECE DIGITAL</span>
        </div>
        <div style="padding: 32px; background: #fff;">
          <h2 style="color: #111; margin-top: 0;">You've been invited</h2>
          <p><strong>${inviterName}</strong> has invited you to join <strong>${companyName}</strong> on Fieldpiece Digital as a <strong>${role}</strong>.</p>
          <p>Click below to accept your invitation and set up your account:</p>
          <a href="${inviteUrl}" style="display: inline-block; background: #FFD100; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 16px 0;">
            Accept Invitation
          </a>
          <p style="color: #666; font-size: 14px;">This invitation expires in 7 days. If you weren't expecting this, you can safely ignore it.</p>
        </div>
        <div style="padding: 16px; text-align: center; color: #999; font-size: 12px;">
          Fieldpiece Digital — HVAC Intelligence Platform
        </div>
      </div>
    `,
  })
}

export async function sendPasswordResetEmail({
  to,
  resetUrl,
}: {
  to: string
  resetUrl: string
}) {
  return resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: 'Reset your Fieldpiece Digital password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #000; padding: 24px; text-align: center;">
          <span style="color: #FFD100; font-size: 24px; font-weight: bold;">FIELDPIECE DIGITAL</span>
        </div>
        <div style="padding: 32px; background: #fff;">
          <h2 style="color: #111; margin-top: 0;">Reset your password</h2>
          <p>We received a request to reset your Fieldpiece Digital password.</p>
          <a href="${resetUrl}" style="display: inline-block; background: #FFD100; color: #000; padding: 12px 24px; text-decoration: none; font-weight: bold; border-radius: 4px; margin: 16px 0;">
            Reset Password
          </a>
          <p style="color: #666; font-size: 14px;">This link expires in 1 hour. If you didn't request this, you can safely ignore it.</p>
        </div>
      </div>
    `,
  })
}
