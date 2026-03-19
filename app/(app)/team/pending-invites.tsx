'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import { revokeInvite } from '@/lib/actions/team-actions'

interface PendingInvite {
  id: string
  email: string
  role: string
  expires_at: string
}

const ROLE_LABELS: Record<string, string> = {
  technician:    'Technician',
  dispatcher:    'Dispatcher',
  company_admin: 'Company Admin',
}

interface PendingInvitesProps {
  invites: PendingInvite[]
  tenantId: string
  isAdmin: boolean
}

export function PendingInvites({ invites, tenantId, isAdmin }: PendingInvitesProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  if (invites.length === 0) return null

  function handleRevoke(inviteId: string, email: string) {
    if (!confirm(`Revoke invitation for ${email}?`)) return
    startTransition(async () => {
      const result = await revokeInvite(inviteId, tenantId)
      if ('error' in result) {
        toast.error(result.error)
      } else {
        toast.success('Invitation revoked')
        router.refresh()
      }
    })
  }

  function daysLeft(expiresAt: string) {
    const days = Math.ceil((new Date(expiresAt).getTime() - Date.now()) / 86400000)
    return days <= 1 ? 'Expires today' : `Expires in ${days} days`
  }

  return (
    <div className="mt-4 border border-border rounded-xl overflow-hidden">
      <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center gap-2">
        <Mail className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-semibold">Pending Invitations</span>
        <Badge variant="outline" className="text-xs ml-auto">{invites.length}</Badge>
      </div>
      <div className="divide-y divide-border">
        {invites.map(inv => (
          <div key={inv.id} className="flex items-center gap-4 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted shrink-0">
              <Mail className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium">{inv.email}</p>
              <p className="text-xs text-muted-foreground">{daysLeft(inv.expires_at)}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Badge variant="outline" className="text-xs">{ROLE_LABELS[inv.role] ?? inv.role}</Badge>
              {isAdmin && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleRevoke(inv.id, inv.email)}
                  disabled={pending}
                  title="Revoke invitation"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
