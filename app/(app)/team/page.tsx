import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Users } from 'lucide-react'
import { InviteDialog } from './invite-dialog'
import { TeamMemberList } from './team-member-list'
import { PendingInvites } from './pending-invites'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Team' }

export default async function TeamPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  if (!['company_admin', 'dispatcher'].includes(membership.role)) redirect('/dashboard')

  const isAdmin = membership.role === 'company_admin'

  const [membersResult, invitesResult] = await Promise.all([
    supabase
      .from('memberships')
      .select('id, user_id, role, is_active, accepted_at, profiles(first_name, last_name, email)')
      .eq('tenant_id', tenantId)
      .eq('is_active', true)
      .order('created_at'),
    supabase
      .from('invitations')
      .select('id, email, role, expires_at')
      .eq('tenant_id', tenantId)
      .is('accepted_at', null)
      .is('revoked_at', null)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false }),
  ])

  const members = membersResult.data ?? []
  const pendingInvites = invitesResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Team"
        subtitle="Manage your team members and their roles"
        actions={isAdmin ? <InviteDialog tenantId={tenantId} /> : undefined}
      />

      <Card>
        <CardContent className="p-0">
          {members.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No team members yet</p>
              {isAdmin && (
                <p className="text-sm mt-1">Use the Invite Member button to add your team.</p>
              )}
            </div>
          ) : (
            <TeamMemberList
              members={members as Parameters<typeof TeamMemberList>[0]['members']}
              currentUserId={user.id}
              isAdmin={isAdmin}
              tenantId={tenantId}
            />
          )}
        </CardContent>
      </Card>

      <PendingInvites
        invites={pendingInvites}
        tenantId={tenantId}
        isAdmin={isAdmin}
      />
    </div>
  )
}
