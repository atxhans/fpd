import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Users } from 'lucide-react'
import { getRoleLabel } from '@/types/user'
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

  // Only company admins and dispatchers can see team
  if (!['company_admin', 'dispatcher'].includes(membership.role)) redirect('/dashboard')

  const { data: members } = await supabase
    .from('memberships')
    .select('id, role, is_active, accepted_at, profiles(first_name, last_name, email, avatar_url)')
    .eq('tenant_id', tenantId)
    .order('created_at')

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Team" subtitle="Manage your team members and roles" />
      <Card>
        <CardContent className="p-0">
          {!members?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No team members</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {members.map((m: Record<string, unknown>) => {
                const profile = m.profiles as { first_name: string | null; last_name: string | null; email: string } | null
                const name = profile ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email : '—'
                return (
                  <div key={m.id as string} className="flex items-center gap-4 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary font-bold text-sm shrink-0">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{name}</p>
                      <p className="text-sm text-muted-foreground">{profile?.email}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={m.is_active ? 'default' : 'secondary'} className={m.is_active ? 'bg-black text-primary' : ''}>
                        {getRoleLabel(m.role as never)}
                      </Badge>
                      {!m.accepted_at && <Badge variant="outline" className="text-xs">Invited</Badge>}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
