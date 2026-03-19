import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Wrench } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { HealthBadge } from '@/components/shared/health-badge'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Equipment' }

export default async function EquipmentPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const { data: equipment } = await supabase
    .from('equipment')
    .select('id, manufacturer, model_number, serial_number, unit_type, refrigerant_type, tonnage, install_date, status, health_score, customers(name), sites(name, city, state)')
    .eq('tenant_id', tenantId)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(100)

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Equipment" subtitle="All HVAC units and equipment records" />

      <Card>
        <CardContent className="p-0">
          {!equipment?.length ? (
            <div className="p-12 text-center text-muted-foreground">
              <Wrench className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="font-medium">No equipment on file</p>
              <p className="text-sm mt-1">Equipment is added when creating customers and sites</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {equipment.map((eq: Record<string, unknown>) => {
                const customer = eq.customers as { name: string } | null
                const site = eq.sites as { name: string; city: string; state: string } | null
                return (
                  <Link key={eq.id as string} href={`/equipment/${eq.id}`}>
                    <div className="flex items-center gap-4 p-4 hover:bg-muted/40 transition-colors">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black shrink-0">
                        <Wrench className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">{eq.manufacturer as string} {eq.model_number as string}</p>
                        <p className="text-sm text-muted-foreground">
                          {customer?.name} · {site ? `${site.city}, ${site.state}` : ''}
                          {eq.serial_number ? ` · S/N: ${eq.serial_number}` : ''}
                        </p>
                      </div>
                      <div className="text-right shrink-0 space-y-1">
                        <div><HealthBadge score={eq.health_score as number | null} /></div>
                        <Badge variant="outline">{String(eq.unit_type).replace(/_/g, ' ')}</Badge>
                        {eq.refrigerant_type != null && <p className="text-xs text-muted-foreground">{eq.refrigerant_type as string}</p>}
                        {eq.install_date != null && <p className="text-xs text-muted-foreground">Installed {formatDate(eq.install_date as string)}</p>}
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
