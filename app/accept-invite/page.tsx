import { createAdminClient } from '@/lib/supabase/server'
import { AcceptForm } from './accept-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Accept Invitation — Fieldpiece Digital' }

export default async function AcceptInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>
}) {
  const { token } = await searchParams

  if (!token) return <ErrorScreen message="No invitation token found. Check your email for the invitation link." />

  const admin = await createAdminClient()
  const { data: invitation } = await admin
    .from('invitations')
    .select('email, role, expires_at, tenants(name)')
    .eq('token', token)
    .is('accepted_at', null)
    .is('revoked_at', null)
    .single()

  if (!invitation) return <ErrorScreen message="This invitation link is invalid or has already been used." />
  if (new Date(invitation.expires_at) < new Date()) {
    return <ErrorScreen message="This invitation has expired. Ask your team admin to send a new one." />
  }

  const tenant = invitation.tenants as unknown as { name: string } | null

  return (
    <AcceptForm
      token={token}
      email={invitation.email}
      role={invitation.role}
      companyName={tenant?.name ?? ''}
    />
  )
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border p-8 max-w-md w-full text-center space-y-4">
        <div className="text-4xl">⚠️</div>
        <h1 className="text-xl font-bold">Invitation Not Found</h1>
        <p className="text-sm text-muted-foreground">{message}</p>
        <a href="/login" className="text-sm text-primary hover:underline">Go to login →</a>
      </div>
    </div>
  )
}
