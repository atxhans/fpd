import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { formatDate } from '@/lib/utils'
import { getRoleLabel } from '@/types/user'
import type { Metadata } from 'next'
import { UserSearchClient } from './user-search-client'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  const supabase = await createClient()

  const { data: users } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, is_platform_user, platform_role, is_active, created_at')
    .order('created_at', { ascending: false })
    .limit(50)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="User Management" subtitle={`${users?.length ?? 0} users (showing latest 50)`} />

      <UserSearchClient />

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-4 py-3 font-semibold">User</th>
                  <th className="text-left px-4 py-3 font-semibold">Role</th>
                  <th className="text-left px-4 py-3 font-semibold">Type</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {(users ?? []).map((u: Record<string, unknown>) => {
                  const name = [u.first_name, u.last_name].filter(Boolean).join(' ')
                  return (
                    <tr key={u.id as string} className="hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <p className="font-medium">{name || (u.email as string)}</p>
                        <p className="text-xs text-muted-foreground">{u.email as string}</p>
                      </td>
                      <td className="px-4 py-3">
                        {u.platform_role ? getRoleLabel(u.platform_role as never) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_platform_user ? 'default' : 'outline'} className={u.is_platform_user ? 'bg-black text-primary' : ''}>
                          {u.is_platform_user ? 'Fieldpiece' : 'Tenant'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={u.is_active ? 'outline' : 'secondary'} className={u.is_active ? 'text-green-700 border-green-300' : ''}>
                          {u.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{formatDate(u.created_at as string)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
