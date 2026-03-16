import { redirect, notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatusBadge } from '@/components/shared/status-badge'
import { formatDate, formatDateTime } from '@/lib/utils'
import Link from 'next/link'
import { EquipmentEditForm } from './equipment-edit-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Equipment Detail' }

export default async function EquipmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const [eqResult, jobEquipmentResult, readingsResult] = await Promise.all([
    supabase.from('equipment')
      .select('*, customers(name, email, phone), sites(name, address_line1, city, state, zip)')
      .eq('id', id).eq('tenant_id', tenantId).is('deleted_at', null).single(),
    supabase.from('job_equipment')
      .select('jobs(id, job_number, status, scheduled_at, service_category)')
      .eq('equipment_id', id)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase.from('readings')
      .select('*, reading_types(label, unit)')
      .eq('equipment_id', id)
      .order('captured_at', { ascending: false })
      .limit(20),
  ])

  if (!eqResult.data) notFound()

  const eq = eqResult.data
  const jobs = (jobEquipmentResult.data ?? [])
    .map((je) => je.jobs as unknown as { id: string; job_number: string; status: string; scheduled_at: string | null; service_category: string } | null)
    .filter((j): j is { id: string; job_number: string; status: string; scheduled_at: string | null; service_category: string } => j !== null)
  const readings = readingsResult.data ?? []
  const customer = eq.customers as unknown as Record<string, unknown>
  const site = eq.sites as unknown as Record<string, unknown>
  const canEdit = ['company_admin', 'dispatcher'].includes(membership?.role ?? '')

  const details = [
    { label: 'Manufacturer', value: eq.manufacturer },
    { label: 'Model Number', value: eq.model_number ?? '—' },
    { label: 'Serial Number', value: eq.serial_number ?? '—' },
    { label: 'Unit Type', value: String(eq.unit_type).replace(/_/g, ' ') },
    { label: 'Refrigerant', value: eq.refrigerant_type ?? '—' },
    { label: 'Tonnage', value: eq.tonnage ? `${eq.tonnage} tons` : '—' },
    { label: 'Install Date', value: formatDate(eq.install_date) },
    { label: 'Warranty Expiry', value: formatDate(eq.warranty_expiry) },
    { label: 'Location', value: eq.location ?? '—' },
    { label: 'Status', value: eq.status },
  ]

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`${eq.manufacturer} ${eq.model_number ?? ''}`}
        subtitle={`${customer?.name ?? ''} · ${site?.city as string}, ${site?.state as string}`}
        actions={canEdit ? (
          <EquipmentEditForm
            equipmentId={id}
            defaultValues={{
              manufacturer: eq.manufacturer,
              model_number: eq.model_number ?? null,
              serial_number: eq.serial_number ?? null,
              unit_type: eq.unit_type,
              location: eq.location ?? null,
              refrigerant_type: eq.refrigerant_type ?? null,
              tonnage: eq.tonnage ?? null,
              install_date: eq.install_date ?? null,
              warranty_expiry: eq.warranty_expiry ?? null,
              status: eq.status,
              notes: eq.notes ?? null,
            }}
          />
        ) : undefined}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Equipment Details */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle>Equipment Details</CardTitle></CardHeader>
            <CardContent>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                {details.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-xs text-muted-foreground">{label}</dt>
                    <dd className="font-medium text-sm mt-0.5">
                      {label === 'Status' ? <StatusBadge status={String(value)} /> : String(value)}
                    </dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>

          {/* Recent Readings */}
          {readings.length > 0 && (
            <Card>
              <CardHeader><CardTitle>Recent Readings</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {readings.slice(0, 9).map((r: Record<string, unknown>) => {
                    const rt = r.reading_types as { label: string; unit: string } | null
                    return (
                      <div key={r.id as string} className="p-3 border border-border rounded-lg">
                        <p className="text-xs text-muted-foreground">{rt?.label}</p>
                        <p className="text-xl font-bold">
                          {r.value != null ? r.value as number : '—'}
                          <span className="text-sm font-normal text-muted-foreground ml-1">{rt?.unit}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">{formatDateTime(r.captured_at as string)}</p>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Service History */}
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>Customer</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{customer?.name as string}</p>
              <p className="text-sm text-muted-foreground">{customer?.phone as string}</p>
              <p className="text-sm text-muted-foreground">{customer?.email as string}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Site</CardTitle></CardHeader>
            <CardContent className="space-y-1">
              <p className="font-semibold">{site?.name as string}</p>
              <p className="text-sm text-muted-foreground">{site?.address_line1 as string}</p>
              <p className="text-sm text-muted-foreground">{site?.city as string}, {site?.state as string} {site?.zip as string}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Service History</CardTitle></CardHeader>
            <CardContent>
              {jobs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No service history</p>
              ) : (
                <div className="space-y-2">
                  {jobs.map((job) => (
                    <Link key={job.id} href={`/jobs/${job.id}`}>
                      <div className="p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-mono text-muted-foreground">{job.job_number}</span>
                          <StatusBadge status={job.status} />
                        </div>
                        <p className="text-sm font-medium capitalize">{job.service_category.replace(/_/g, ' ')}</p>
                        {job.scheduled_at && (
                          <p className="text-xs text-muted-foreground">{formatDateTime(job.scheduled_at)}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
