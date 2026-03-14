'use client'

import { Shield, User } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'
import { getDisplayName, getRoleLabel, type Profile } from '@/types/user'

interface AdminTopNavProps {
  profile: Profile | null
}

export function AdminTopNav({ profile }: AdminTopNavProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 border-b border-border bg-white flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Shield className="h-4 w-4 text-accent" />
        <span>Fieldpiece Internal — Platform Operations</span>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2" />}>
          <User className="h-4 w-4" />
          <span>{getDisplayName(profile)}</span>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <div className="px-2 py-1.5">
            <p className="text-sm font-medium">{getDisplayName(profile)}</p>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
            {profile?.platform_role && (
              <p className="text-xs font-medium text-accent mt-0.5">
                {getRoleLabel(profile.platform_role)}
              </p>
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleSignOut}>Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
