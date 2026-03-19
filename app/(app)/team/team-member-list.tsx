'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserMinus, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { getRoleLabel } from '@/types/user'
import { updateMemberRole, deactivateMember } from '@/lib/actions/team-actions'
import type { TenantRole } from '@/lib/actions/team-actions'

const ROLE_OPTIONS: { value: TenantRole; label: string }[] = [
  { value: 'technician',    label: 'Technician' },
  { value: 'dispatcher',    label: 'Dispatcher' },
  { value: 'company_admin', label: 'Company Admin' },
]

interface Member {
  id: string
  user_id: string
  role: string
  is_active: boolean
  accepted_at: string | null
  profiles: { first_name: string | null; last_name: string | null; email: string } | null
}

interface TeamMemberListProps {
  members: Member[]
  currentUserId: string
  isAdmin: boolean
  tenantId: string
}

export function TeamMemberList({ members, currentUserId, isAdmin, tenantId }: TeamMemberListProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRoleChange(membershipId: string, role: string) {
    startTransition(async () => {
      const result = await updateMemberRole(membershipId, tenantId, role as TenantRole)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Role updated')
        router.refresh()
      }
    })
  }

  function handleRemove(membershipId: string, name: string) {
    if (!confirm(`Remove ${name} from your team? They will lose access immediately.`)) return
    startTransition(async () => {
      const result = await deactivateMember(membershipId, tenantId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success(`${name} removed from team`)
        router.refresh()
      }
    })
  }

  return (
    <div className="divide-y divide-border">
      {members.map((m) => {
        const profile = m.profiles
        const name = profile
          ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
          : '—'
        const isSelf = m.user_id === currentUserId
        const isPending = !m.accepted_at

        return (
          <div key={m.id} className="flex items-center gap-4 p-4">
            {/* Avatar */}
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary font-bold text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>

            {/* Name + email */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold leading-tight">{name}</p>
                {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
                {isPending && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                    <Clock className="h-3 w-3" />
                    Invite pending
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>

            {/* Role — editable for admin on other members */}
            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && !isSelf ? (
                <Select
                  value={m.role}
                  onValueChange={(v) => { if (v) handleRoleChange(m.id, v) }}
                  disabled={pending}
                >
                  <SelectTrigger className="h-8 w-[148px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Badge variant="default" className="bg-black text-primary">
                  {getRoleLabel(m.role as never)}
                </Badge>
              )}

              {isAdmin && !isSelf && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(m.id, name)}
                  disabled={pending}
                  title="Remove from team"
                >
                  <UserMinus className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
