import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { UsersClient } from './users-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'User Management' }

export default async function UsersPage() {
  const supabase = await createClient()

  const [usersResult, tenantsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, email, first_name, last_name, phone, is_platform_user, platform_role, is_active, created_at')
      .order('created_at', { ascending: false })
      .limit(200),
    supabase
      .from('tenants')
      .select('id, name')
      .eq('status', 'active')
      .order('name'),
  ])

  const users = usersResult.data ?? []
  const tenants = tenantsResult.data ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="User Management" subtitle={`${users.length} users`} />
      <UsersClient users={users} tenants={tenants} />
    </div>
  )
}
