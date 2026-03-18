import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { RequestServiceForm } from '../request-service-form'
import type { Metadata } from 'next'

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const supabase = await createAdminClient()
  const { data: tenant } = await supabase.from('tenants').select('name').eq('slug', slug).single()
  return { title: tenant ? `Request Service — ${tenant.name}` : 'Request Service' }
}

export default async function RequestServiceSlugPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { slug } = await params
  const { ref } = await searchParams

  const supabase = await createAdminClient()

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id, name, slug')
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (!tenant) notFound()

  let prefillEmail: string | null = null
  let requestId: string | null = null

  if (ref) {
    const { data: sr } = await supabase
      .from('service_requests')
      .select('id, contact_email')
      .eq('id', ref)
      .eq('tenant_id', tenant.id)
      .eq('status', 'new')
      .single()

    if (sr) {
      requestId    = sr.id
      prefillEmail = sr.contact_email
    }
  }

  return (
    <div className="w-full max-w-lg">
      <div className="mb-8">
        <div className="h-1 w-12 bg-primary mb-4" />
        <h1 className="text-2xl font-bold">Request Service</h1>
        <p className="text-muted-foreground mt-1">
          {tenant.name} — fill out the form below and we'll be in touch to schedule your appointment.
        </p>
      </div>
      <RequestServiceForm requestId={requestId} prefillEmail={prefillEmail} tenantId={tenant.id} />
    </div>
  )
}
