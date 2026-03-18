import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { QueueClient } from './queue-client'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Assignment Queue' }

export default async function AssignmentQueuePage() {
  const supabase = await createClient()

  const [srResult, customersResult, tenantsResult] = await Promise.all([
    // Unmatched service requests — no tenant
    supabase
      .from('service_requests')
      .select('id, contact_name, contact_email, contact_phone, description, source, status, created_at')
      .is('tenant_id', null)
      .not('status', 'in', '("spam","closed","converted")')
      .order('created_at', { ascending: false })
      .limit(100),

    // All customers with their tenant name
    supabase
      .from('customers')
      .select('id, name, email, phone, customer_type, tenant_id, tenants(name)')
      .is('deleted_at', null)
      .order('name')
      .limit(500),

    // All active tenants for the assignment dropdowns
    supabase
      .from('tenants')
      .select('id, name, slug')
      .eq('status', 'active')
      .order('name'),
  ])

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Assignment Queue"
        subtitle="Assign unmatched service requests to tenants and move customers between companies"
      />
      <QueueClient
        serviceRequests={srResult.data ?? []}
        customers={(customersResult.data ?? []) as Parameters<typeof QueueClient>[0]['customers']}
        tenants={tenantsResult.data ?? []}
      />
    </div>
  )
}
