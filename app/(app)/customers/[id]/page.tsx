import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Phone, Mail, FileText, Briefcase } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import { CustomerEditForm } from './customer-edit-form'
import { SiteForm } from './site-form'

export const metadata: Metadata = { title: 'Customer' }

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const [customerResult, sitesResult, jobsResult] = await Promise.all([
    supabase.from('customers')
      .select('id, name, email, phone, customer_type, notes, created_at')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),
    supabase.from('sites')
      .select('id, name, address_line1, address_line2, city, state, zip, site_type, notes')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('name'),
    supabase.from('jobs')
      .select('id, job_number, status, scheduled_at, service_category')
      .eq('customer_id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .order('scheduled_at', { ascending: false })
      .limit(10),
  ])

  if (!customerResult.data) notFound()
  const c = customerResult.data
  const sites = sitesResult.data ?? []
  const jobs = jobsResult.data ?? []

  const canEdit = membership.role === 'company_admin' || membership.role === 'dispatcher'

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title={c.name}
          subtitle={`${c.customer_type.charAt(0).toUpperCase() + c.customer_type.slice(1)} customer since ${formatDate(c.created_at)}`}
        />
        {canEdit && (
          <CustomerEditForm
            customerId={c.id}
            defaultValues={{
              name:          c.name,
              email:         c.email ?? '',
              phone:         c.phone ?? '',
              customer_type: c.customer_type,
              notes:         c.notes ?? '',
            }}
          />
        )}
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader><CardTitle className="text-base">Contact Information</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {c.email && (
            <div className="flex items-center gap-2 text-sm">
              <Mail className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${c.email}`} className="hover:underline">{c.email}</a>
            </div>
          )}
          {c.phone && (
            <div className="flex items-center gap-2 text-sm">
              <Phone className="h-4 w-4 text-muted-foreground shrink-0" />
              <a href={`tel:${c.phone}`} className="hover:underline">{c.phone}</a>
            </div>
          )}
          {!c.email && !c.phone && (
            <p className="text-sm text-muted-foreground">No contact info on file.</p>
          )}
          {c.notes && (
            <div className="flex items-start gap-2 text-sm pt-1">
              <FileText className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-muted-foreground whitespace-pre-line">{c.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sites */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Service Sites ({sites.length})</CardTitle>
          {canEdit && (
            <SiteForm mode="create" customerId={c.id} tenantId={tenantId} />
          )}
        </CardHeader>
        <CardContent className="p-0">
          {sites.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No sites on file.</p>
          ) : (
            <div className="divide-y divide-border">
              {sites.map(s => (
                <div key={s.id} className="flex items-start gap-3 p-4">
                  <MapPin className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.address_line1}{s.address_line2 ? `, ${s.address_line2}` : ''}, {s.city}, {s.state} {s.zip}
                    </p>
                    {s.notes && <p className="text-xs text-muted-foreground mt-1 italic">{s.notes}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline" className="capitalize">{s.site_type}</Badge>
                    {canEdit && (
                      <SiteForm
                        mode="edit"
                        siteId={s.id}
                        defaultValues={{
                          name:          s.name,
                          address_line1: s.address_line1,
                          address_line2: s.address_line2 ?? '',
                          city:          s.city,
                          state:         s.state,
                          zip:           s.zip,
                          site_type:     s.site_type,
                          notes:         s.notes ?? '',
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent jobs */}
      <Card>
        <CardHeader><CardTitle className="text-base">Recent Jobs</CardTitle></CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">No jobs yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {jobs.map(j => (
                <Link key={j.id} href={`/jobs/${j.id}`}>
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
                    <Briefcase className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{j.job_number}</p>
                      <p className="text-xs text-muted-foreground capitalize">{j.service_category?.replace(/_/g, ' ') ?? '—'}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <StatusBadge status={j.status} />
                      {j.scheduled_at && (
                        <p className="text-xs text-muted-foreground mt-1">{formatDate(j.scheduled_at)}</p>
                      )}
                    </div>
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
