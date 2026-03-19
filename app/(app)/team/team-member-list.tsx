'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserMinus, Clock, Mail, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { getRoleLabel } from '@/types/user'
import { updateMemberRole, deactivateMember, resendInvite, revokeInvite } from '@/lib/actions/team-actions'
import type { TenantRole } from '@/lib/actions/team-actions'

const ROLE_OPTIONS: { value: TenantRole; label: string }[] = [
  { value: 'technician',    label: 'Technician' },
  { value: 'dispatcher',    label: 'Dispatcher' },
  { value: 'company_admin', label: 'Company Admin' },
]

const ROLE_LABELS: Record<string, string> = {
  technician:    'Technician',
  dispatcher:    'Dispatcher',
  company_admin: 'Company Admin',
}

interface Member {
  id: string
  user_id: string
  role: string
  is_active: boolean
  accepted_at: string | null
  profiles: { first_name: string | null; last_name: string | null; email: string } | null
}

interface PendingInvite {
  id: string
  email: string
  role: string
  expires_at: string
}

interface TeamMemberListProps {
  members: Member[]
  pendingInvites: PendingInvite[]
  currentUserId: string
  isAdmin: boolean
  tenantId: string
}

function daysLeft(expiresAt: string) {
  const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
  if (days <= 0) return 'Expired'
  if (days === 1) return 'Expires today'
  return `Expires in ${days}d`
}

export function TeamMemberList({ members, pendingInvites, currentUserId, isAdmin, tenantId }: TeamMemberListProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  function handleRoleChange(membershipId: string, role: string) {
    startTransition(async () => {
      const result = await updateMemberRole(membershipId, tenantId, role as TenantRole)
      if ('error' in result) toast.error(result.error)
      else { toast.success('Role updated'); router.refresh() }
    })
  }

  function handleRemove(membershipId: string, name: string) {
    if (!confirm(`Remove ${name} from your team? They will lose access immediately.`)) return
    startTransition(async () => {
      const result = await deactivateMember(membershipId, tenantId)
      if ('error' in result) toast.error(result.error)
      else { toast.success(`${name} removed`); router.refresh() }
    })
  }

  function handleResend(inviteId: string, email: string) {
    startTransition(async () => {
      const result = await resendInvite(inviteId, tenantId)
      if ('error' in result) toast.error(result.error)
      else { toast.success(`Invitation resent to ${email}`); router.refresh() }
    })
  }

  function handleRevoke(inviteId: string, email: string) {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    startTransition(async () => {
      const result = await revokeInvite(inviteId, tenantId)
      if ('error' in result) toast.error(result.error)
      else { toast.success('Invitation revoked'); router.refresh() }
    })
  }

  const showDivider = members.length > 0 && pendingInvites.length > 0

  return (
    <div className="divide-y divide-border">
      {/* ── Active members ────────────────────────────────────────────── */}
      {members.map((m) => {
        const profile = m.profiles
        const name = profile
          ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
          : '—'
        const isSelf = m.user_id === currentUserId

        return (
          <div key={m.id} className="flex items-center gap-4 p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black text-primary font-bold text-sm shrink-0">
              {name.charAt(0).toUpperCase()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold leading-tight">{name}</p>
                {isSelf && <span className="text-xs text-muted-foreground">(you)</span>}
              </div>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {isAdmin && !isSelf ? (
                <Select value={m.role} onValueChange={(v) => { if (v) handleRoleChange(m.id, v) }} disabled={pending}>
                  <SelectTrigger className="h-8 w-[148px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map(r => (
                      <SelectItem key={r.value} value={r.value} className="text-xs">{r.label}</SelectItem>
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
                  variant="ghost" size="icon-sm"
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

      {/* ── Divider ───────────────────────────────────────────────────── */}
      {showDivider && (
        <div className="px-4 py-2 bg-muted/30 flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Pending Invitations ({pendingInvites.length})
          </span>
        </div>
      )}

      {/* ── Pending invites ───────────────────────────────────────────── */}
      {pendingInvites.map((inv) => {
        const expired = new Date(inv.expires_at) < new Date()
        return (
          <div key={inv.id} className="flex items-center gap-4 p-4 bg-muted/10">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted border border-border shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-muted-foreground">{inv.email}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`text-xs ${expired ? 'text-red-500' : 'text-amber-600'}`}>
                  {daysLeft(inv.expires_at)}
                </span>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs text-muted-foreground">{ROLE_LABELS[inv.role] ?? inv.role}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded px-2 py-0.5 font-medium">
                Invite pending
              </span>

              {isAdmin && (
                <>
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs"
                    onClick={() => handleResend(inv.id, inv.email)}
                    disabled={pending}
                    title="Resend invitation email"
                  >
                    <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                    Resend
                  </Button>
                  <Button
                    variant="ghost" size="icon-sm"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => handleRevoke(inv.id, inv.email)}
                    disabled={pending}
                    title="Revoke invitation"
                  >
                    <UserMinus className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
