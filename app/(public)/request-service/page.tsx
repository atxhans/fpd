import { createAdminClient } from '@/lib/supabase/server'
import { RequestServiceForm } from './request-service-form'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Request Service — Fieldpiece Digital' }

export default async function RequestServicePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string }>
}) {
  const { ref } = await searchParams

  // Pre-fill email if we have a service_request ref
  let prefillEmail: string | null = null
  let requestId: string | null = null

  if (ref) {
    const supabase = await createAdminClient()
    const { data: sr } = await supabase
      .from('service_requests')
      .select('id, contact_email')
      .eq('id', ref)
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
        <h1 className="text-2xl font-bold">Request HVAC Service</h1>
        <p className="text-muted-foreground mt-1">
          Fill out the form below and we'll be in touch to schedule your appointment.
        </p>
      </div>

      <RequestServiceForm requestId={requestId} prefillEmail={prefillEmail} />
    </div>
  )
}
