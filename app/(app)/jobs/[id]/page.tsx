import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, Wrench, User, Clock, FileText } from 'lucide-react'
import { formatDateTime, formatDate } from '@/lib/utils'
import type { Metadata } from 'next'
import { ReadingsSection } from './readings-section'
import { DiagnosticsSection } from './diagnostics-section'
import { JobActions } from './job-actions'
import { TechnicianAssign } from './technician-assign'
import { HealthBadge } from '@/components/shared/health-badge'

export const metadata: Metadata = { title: 'Job Detail' }

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships').select('tenant_id, role').eq('user_id', user.id).eq('is_active', true).single()
  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const techniciansResult = await supabase
    .from('memberships')
    .select('user_id, profiles(id, first_name, last_name)')
    .eq('tenant_id', tenantId)
    .in('role', ['technician', 'company_admin', 'dispatcher'])
    .eq('is_active', true)

  const technicians = (techniciansResult.data ?? [])
    .map((m) => {
      const profile = m.profiles as unknown as { id: string; first_name: string | null; last_name: string | null } | null
      if (!profile) return null
      return {
        id: profile.id,
        name: [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Unknown',
      }
    })
    .filter((t): t is { id: string; name: string } => t !== null)

  const [jobResult, readingsResult, diagnosticsResult] = await Promise.all([
    supabase.from('jobs')
      .select('*, customers(*), sites(*), profiles!jobs_assigned_technician_id_fkey(first_name, last_name, email), job_equipment(equipment(*))')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),
    supabase.from('readings')
      .select('*, reading_types(key, label, unit, normal_min, normal_max)')
      .eq('job_id', id)
      .order('captured_at', { ascending: false }),
    supabase.from('diagnostic_results')
      .select('*')
      .eq('job_id', id)
      .order('created_at', { ascending: false }),
  ])

  if (!jobResult.data) notFound()

  const job = jobResult.data
  const readings = readingsResult.data ?? []
  const diagnostics = diagnosticsResult.data ?? []

  const customer = job.customers as unknown as Record<string, unknown>
  const site = job.sites as unknown as Record<string, unknown>
  const tech = job.profiles as unknown as Record<string, unknown> | null
  const equipment = (job.job_equipment as unknown as Array<{ equipment: Record<string, unknown> }>)
    ?.map(je => je.equipment) ?? []

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title={`Job ${job.job_number}`}
        subtitle={customer?.name as string ?? ''}
        actions={
          <div className="flex items-center gap-2">
            <Link href={`/jobs/${id}/invoice`}>
              <Button variant="outline" size="sm">
                <FileText className="h-4 w-4 mr-2" />
                Invoice
              </Button>
            </Link>
            <JobActions job={job} userId={user.id} role={membership.role} />
          </div>
        }
      />

      {/* Job Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <User className="h-4 w-4" /> Technician
            </div>
            {['company_admin', 'dispatcher'].includes(membership.role) ? (
              <TechnicianAssign
                jobId={id}
                currentTechId={job.assigned_technician_id ?? null}
                currentStatus={job.status}
                technicians={technicians}
              />
            ) : (
              <p className="font-medium">{tech ? [tech.first_name, tech.last_name].filter(Boolean).join(' ') : 'Unassigned'}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <MapPin className="h-4 w-4" /> Site
            </div>
            <p className="font-medium">{site?.name as string}</p>
            <p className="text-sm text-muted-foreground">{site?.address_line1 as string}, {site?.city as string}, {site?.state as string}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Clock className="h-4 w-4" /> Schedule
            </div>
            <p className="font-medium">{job.scheduled_at ? formatDateTime(job.scheduled_at) : 'Not scheduled'}</p>
            <StatusBadge status={job.status} />
          </CardContent>
        </Card>
      </div>

      {/* Problem Description */}
      {job.problem_description && (
        <Card>
          <CardHeader><CardTitle>Problem Description</CardTitle></CardHeader>
          <CardContent><p>{job.problem_description}</p></CardContent>
        </Card>
      )}

      {/* Equipment */}
      {equipment.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              <CardTitle>Equipment</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {equipment.map((eq: Record<string, unknown>) => (
                <Link key={eq.id as string} href={`/equipment/${eq.id}`}>
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/40 transition-colors">
                    <div>
                      <p className="font-medium">{eq.manufacturer as string} {eq.model_number as string}</p>
                      <p className="text-sm text-muted-foreground">
                        Serial: {eq.serial_number as string ?? '—'} · {eq.refrigerant_type as string ?? '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <HealthBadge score={eq.health_score as number | null} />
                      <Badge variant="outline">{String(eq.unit_type).replace(/_/g, ' ')}</Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diagnostics */}
      <DiagnosticsSection diagnostics={diagnostics} jobId={id} tenantId={tenantId} />

      {/* Readings */}
      <ReadingsSection readings={readings} jobId={id} tenantId={tenantId} equipmentList={equipment} />
    </div>
  )
}
