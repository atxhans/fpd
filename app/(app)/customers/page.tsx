import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone } from 'lucide-react'
import { CustomerCreateButton } from './customer-create-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Customers' }

export default async function CustomersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: customers } = await supabase
    .from('customers')
    .select('id, name, email, phone, customer_type, sites(count)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('name')
    .limit(100)

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Customers"
        subtitle="Customer accounts and service sites"
        actions={
          ['company_admin', 'dispatcher'].includes(membership?.role ?? '') ? (
            <CustomerCreateButton tenantId={tenantId} />
          ) : undefined
        }
      />
      <Card>
        <CardContent className="p-0">
          {!customers?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No customers yet</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {customers.map((c: Record<string, unknown>) => (
                <Link key={c.id as string} href={`/customers/${c.id}`}>
                  <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold">{c.name as string}</p>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        {c.phone != null && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{c.phone as string}</span>}
                        {c.email != null && <span>{c.email as string}</span>}
                      </div>
                    </div>
                    <Badge variant="outline" className="capitalize">{c.customer_type as string}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
