import { redirect, notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { InvoiceBuilder } from './invoice-builder'
import { InvoiceStatusActions } from './invoice-status-actions'
import { PrintButton } from './print-button'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Invoice' }

interface LineItem {
  description: string
  qty: number
  unit_price: number
  total: number
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id, role')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  const tenantId = membership?.tenant_id
  if (!tenantId) redirect('/login')

  const [jobResult, invoiceResult] = await Promise.all([
    supabase
      .from('jobs')
      .select('id, job_number, service_category, customers(id, name, email, phone), sites(name, address_line1, city, state, zip)')
      .eq('id', id)
      .eq('tenant_id', tenantId)
      .is('deleted_at', null)
      .single(),
    supabase
      .from('invoices')
      .select('*')
      .eq('job_id', id)
      .maybeSingle(),
  ])

  if (!jobResult.data) notFound()

  const job = jobResult.data
  const invoice = invoiceResult.data
  const customer = job.customers as unknown as { id: string; name: string; email: string | null; phone: string | null } | null
  const site = job.sites as unknown as { name: string; address_line1: string; city: string; state: string; zip: string } | null
  const role = membership.role

  const lineItems = invoice ? (invoice.line_items as unknown as LineItem[]) : []

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <Link href={`/jobs/${id}`} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Job
        </Link>
        <PageHeader
          title={invoice ? `Invoice ${invoice.invoice_number}` : 'Invoice'}
          subtitle={`Job ${job.job_number} · ${customer?.name ?? ''}`}
          actions={
            invoice ? (
              <div className="flex items-center gap-2">
                <InvoiceStatusActions invoiceId={invoice.id} currentStatus={invoice.status} role={role} />
                <PrintButton />
              </div>
            ) : undefined
          }
        />
      </div>

      {!invoice && role === 'company_admin' ? (
        <InvoiceBuilder jobId={id} />
      ) : !invoice ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <p className="font-medium">No invoice yet</p>
            <p className="text-sm mt-1">A company admin can create an invoice for this job.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6 print:space-y-4" id="invoice-print">
          {/* Invoice header */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-between gap-6 flex-wrap">
                <div>
                  <p className="text-xl font-bold">Your Company</p>
                  <p className="text-sm text-muted-foreground mt-1">123 Business Ave</p>
                  <p className="text-sm text-muted-foreground">City, State 00000</p>
                  <p className="text-sm text-muted-foreground">billing@yourcompany.com</p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold">{invoice.invoice_number}</p>
                  <div className="mt-1">
                    <StatusBadge status={invoice.status} />
                  </div>
                  {invoice.due_date && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Due: {formatDate(invoice.due_date)}
                    </p>
                  )}
                  {invoice.paid_at && (
                    <p className="text-sm text-muted-foreground">
                      Paid: {formatDate(invoice.paid_at)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bill to */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Bill To</p>
                  <p className="font-semibold">{customer?.name}</p>
                  {customer?.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                  {customer?.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Service Location</p>
                  <p className="font-semibold">{site?.name}</p>
                  <p className="text-sm text-muted-foreground">{site?.address_line1}</p>
                  <p className="text-sm text-muted-foreground">{site?.city}, {site?.state} {site?.zip}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Line items */}
          <Card>
            <CardHeader>
              <CardTitle>Line Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <table className="w-full text-sm">
                <thead className="border-b border-border">
                  <tr className="text-muted-foreground">
                    <th className="text-left px-6 py-3 font-medium">Description</th>
                    <th className="text-right px-4 py-3 font-medium">Qty</th>
                    <th className="text-right px-4 py-3 font-medium">Unit Price</th>
                    <th className="text-right px-6 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {lineItems.map((item, i) => (
                    <tr key={i}>
                      <td className="px-6 py-3">{item.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums">{item.qty}</td>
                      <td className="px-4 py-3 text-right tabular-nums">${Number(item.unit_price).toFixed(2)}</td>
                      <td className="px-6 py-3 text-right tabular-nums font-medium">${Number(item.total).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-end">
                <div className="space-y-2 w-64">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="tabular-nums">${Number(invoice.subtotal).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Tax ({(Number(invoice.tax_rate) * 100).toFixed(2)}%)</span>
                    <span className="tabular-nums">${Number(invoice.tax_amount).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-base border-t border-border pt-2">
                    <span>Total</span>
                    <span className="tabular-nums">${Number(invoice.total).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {invoice.notes && (
            <Card>
              <CardHeader><CardTitle>Notes</CardTitle></CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{invoice.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  )
}

