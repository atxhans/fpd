'use server'

import { createClient } from '@/lib/supabase/server'
import { writeAudit } from '@/lib/audit'

interface LineItem {
  description: string
  qty: number
  unit_price: number
  total: number
}

export async function createInvoice(
  jobId: string,
  data: {
    lineItems: LineItem[]
    taxRate: number
    notes?: string | null
    dueDate?: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  // Fetch the job to get tenant_id and customer_id
  const { data: job } = await supabase
    .from('jobs')
    .select('id, job_number, tenant_id, customer_id')
    .eq('id', jobId)
    .single()

  if (!job) return { error: 'Job not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', job.tenant_id)
    .eq('is_active', true)
    .single()

  if (!membership || membership.role !== 'company_admin') {
    return { error: 'Unauthorized — only company admins can create invoices' }
  }

  // Calculate totals
  const subtotal = data.lineItems.reduce((sum, item) => sum + item.total, 0)
  const taxRateDecimal = data.taxRate / 100
  const taxAmount = Math.round(subtotal * taxRateDecimal * 100) / 100
  const total = Math.round((subtotal + taxAmount) * 100) / 100

  // Generate invoice number
  const year = new Date().getFullYear()
  const { count } = await supabase
    .from('invoices')
    .select('id', { count: 'exact', head: true })
    .eq('tenant_id', job.tenant_id)

  const invoiceNumber = `INV-${year}-${String((count ?? 0) + 1).padStart(4, '0')}`

  const { data: invoice, error } = await supabase
    .from('invoices')
    .insert({
      tenant_id: job.tenant_id,
      job_id: jobId,
      customer_id: job.customer_id,
      invoice_number: invoiceNumber,
      status: 'draft',
      line_items: data.lineItems as unknown as import('@/types/database').Json,
      subtotal,
      tax_rate: taxRateDecimal,
      tax_amount: taxAmount,
      total,
      notes: data.notes ?? null,
      due_date: data.dueDate ?? null,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  void writeAudit({ action: 'invoice.created', tenantId: job.tenant_id, actorId: user.id, actorEmail: user.email, resourceType: 'invoice', resourceId: invoice.id, resourceLabel: invoiceNumber, metadata: { job_id: jobId, total, job_number: job.job_number } })
  return { ok: true, invoiceId: invoice.id }
}

export async function updateInvoiceStatus(
  invoiceId: string,
  status: 'draft' | 'sent' | 'paid' | 'void'
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, invoice_number, tenant_id, status')
    .eq('id', invoiceId)
    .single()

  if (!invoice) return { error: 'Invoice not found' }

  const { data: membership } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', user.id)
    .eq('tenant_id', invoice.tenant_id)
    .eq('is_active', true)
    .single()

  if (!membership || membership.role !== 'company_admin') {
    return { error: 'Unauthorized' }
  }

  const updates: Record<string, unknown> = { status }
  if (status === 'paid') {
    updates.paid_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('invoices')
    .update(updates)
    .eq('id', invoiceId)

  if (error) return { error: error.message }
  void writeAudit({ action: 'invoice.status_updated', tenantId: invoice.tenant_id, actorId: user.id, actorEmail: user.email, resourceType: 'invoice', resourceId: invoiceId, resourceLabel: invoice.invoice_number, metadata: { from_status: invoice.status, to_status: status } })
  return { ok: true }
}
