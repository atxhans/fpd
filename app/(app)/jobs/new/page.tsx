import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { NewJobForm } from './new-job-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'New Job' }

export default async function NewJobPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const allowedRoles = ['company_admin', 'dispatcher']
  if (!membership || !allowedRoles.includes(membership.role)) {
    redirect('/jobs')
  }

  const [customersResult, teamResult] = await Promise.all([
    supabase
      .from('customers')
      .select('id, name, sites(id, name, address_line1, city, state, zip)')
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name'),
    supabase
      .from('memberships')
      .select('user_id, profiles(id, first_name, last_name)')
      .eq('tenant_id', tenantId)
      .in('role', ['technician', 'company_admin', 'dispatcher'])
      .eq('is_active', true),
  ])

  const customers = (customersResult.data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    sites: (c.sites as unknown as Array<{
      id: string
      name: string
      address_line1: string
      city: string
      state: string
      zip: string
    }>) ?? [],
  }))

  const technicians = (teamResult.data ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as { id: string; first_name: string | null; last_name: string | null } | null
      if (!profile) return null
      return {
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown',
      }
    })
    .filter((t): t is { id: string; name: string } => t !== null)

  return (
    <div className="p-6">
      <NewJobForm tenantId={tenantId} customers={customers} technicians={technicians} />
    </div>
  )
}
