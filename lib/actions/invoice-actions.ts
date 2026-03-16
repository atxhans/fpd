'use server'

import { createClient } from '@/lib/supabase/server'

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
    .select('id, tenant_id, customer_id')
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
    .select('id, tenant_id')
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
  return { ok: true }
}
