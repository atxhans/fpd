'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { updateInvoiceStatus } from '@/lib/actions/invoice-actions'

interface InvoiceStatusActionsProps {
  invoiceId: string
  currentStatus: string
  role: string
}

export function InvoiceStatusActions({ invoiceId, currentStatus, role }: InvoiceStatusActionsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  if (role !== 'company_admin') return null

  async function handleUpdate(status: 'draft' | 'sent' | 'paid' | 'void') {
    setIsLoading(true)
    const result = await updateInvoiceStatus(invoiceId, status)
    setIsLoading(false)
    if (result.error) {
      toast.error(result.error)
      return
    }
    toast.success(`Invoice marked as ${status}`)
    router.refresh()
  }

  return (
    <div className="flex gap-2">
      {currentStatus === 'draft' && (
        <Button size="sm" variant="outline" onClick={() => handleUpdate('sent')} disabled={isLoading}>
          Mark Sent
        </Button>
      )}
      {(currentStatus === 'draft' || currentStatus === 'sent') && (
        <Button size="sm" onClick={() => handleUpdate('paid')} disabled={isLoading}>
          Mark Paid
        </Button>
      )}
      {currentStatus !== 'void' && currentStatus !== 'paid' && (
        <Button size="sm" variant="outline" onClick={() => handleUpdate('void')} disabled={isLoading}>
          Void
        </Button>
      )}
    </div>
  )
}
