'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { Mail, Globe, Inbox, Users, CheckCircle, Ban, ArrowRightLeft, Search } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import {
  assignServiceRequest,
  dismissServiceRequest,
  reassignCustomer,
} from '@/lib/actions/assignment-actions'

interface Tenant { id: string; name: string; slug: string }
interface ServiceRequest {
  id: string
  contact_name: string | null
  contact_email: string
  contact_phone: string | null
  description: string | null
  source: string
  status: string
  created_at: string
}
interface Customer {
  id: string
  name: string
  email: string | null
  phone: string | null
  customer_type: string
  tenant_id: string
  tenants: { name: string } | null
}

interface QueueClientProps {
  serviceRequests: ServiceRequest[]
  customers: Customer[]
  tenants: Tenant[]
}

function SourceIcon({ source }: { source: string }) {
  if (source === 'email') return <Mail className="h-3.5 w-3.5" />
  if (source === 'web_form') return <Globe className="h-3.5 w-3.5" />
  return <Inbox className="h-3.5 w-3.5" />
}

// ─── Service Request Row ────────────────────────────────────────────────────

function SRRow({ sr, tenants }: { sr: ServiceRequest; tenants: Tenant[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedTenant, setSelectedTenant] = useState('')
  const [techLabel, setTechLabel] = useState('')

  function handleAssign() {
    if (!selectedTenant) { toast.error('Select an HVAC contractor first'); return }
    startTransition(async () => {
      const result = await assignServiceRequest(sr.id, selectedTenant)
      if (result.error) { toast.error(result.error); return }
      toast.success(result.customerMatched ? 'Assigned and matched to existing customer' : 'Assigned to HVAC contractor')
      router.refresh()
    })
  }

  function handleDismiss(status: 'spam' | 'closed') {
    startTransition(async () => {
      const result = await dismissServiceRequest(sr.id, status)
      if (result.error) { toast.error(result.error); return }
      toast.success(status === 'spam' ? 'Marked as spam' : 'Closed')
      router.refresh()
    })
  }

  return (
    <div className="p-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0 mt-0.5 text-muted-foreground">
          <SourceIcon source={sr.source} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-medium text-sm">{sr.contact_name ?? sr.contact_email}</span>
            {sr.contact_name && <span className="text-xs text-muted-foreground">{sr.contact_email}</span>}
            <Badge variant="outline" className="text-xs capitalize">{sr.source.replace('_', ' ')}</Badge>
            <span className="text-xs text-muted-foreground ml-auto">{formatRelativeTime(sr.created_at)}</span>
          </div>
          {sr.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{sr.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pl-11 flex-wrap">
        <Select
          onValueChange={(v) => {
            const val = String(v ?? '')
            const t = tenants.find(t => t.id === val)
            setTechLabel(t?.name ?? '')
            setSelectedTenant(val)
          }}
        >
          <SelectTrigger className="w-52">
            {techLabel
              ? <span className="flex flex-1 text-left text-sm truncate">{techLabel}</span>
              : <SelectValue placeholder="Assign to HVAC contractor…" />}
          </SelectTrigger>
          <SelectContent>
            {tenants.map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleAssign} disabled={pending || !selectedTenant}
          className="bg-black text-primary hover:bg-black/90">
          <CheckCircle className="h-3.5 w-3.5 mr-1" /> Assign
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDismiss('closed')} disabled={pending}>
          Close
        </Button>
        <Button size="sm" variant="outline" onClick={() => handleDismiss('spam')} disabled={pending}
          className="text-destructive hover:text-destructive">
          <Ban className="h-3.5 w-3.5 mr-1" /> Spam
        </Button>
      </div>
    </div>
  )
}

// ─── Customer Row ────────────────────────────────────────────────────────────

function CustomerRow({ customer, tenants }: { customer: Customer; tenants: Tenant[] }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [selectedTenant, setSelectedTenant] = useState('')
  const [tenantLabel, setTenantLabel] = useState('')
  const [confirming, setConfirming] = useState(false)

  function handleReassign() {
    if (!selectedTenant) { toast.error('Select a target HVAC contractor'); return }
    if (!confirming) { setConfirming(true); return }
    startTransition(async () => {
      const result = await reassignCustomer(customer.id, selectedTenant)
      if (result.error) { toast.error(result.error); setConfirming(false); return }
      toast.success('Customer reassigned')
      setConfirming(false)
      setSelectedTenant('')
      setTenantLabel('')
      router.refresh()
    })
  }

  return (
    <div className="p-4 border-b border-border last:border-0">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted shrink-0 mt-0.5 text-muted-foreground">
          <Users className="h-3.5 w-3.5" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span className="font-medium text-sm">{customer.name}</span>
            {customer.email && <span className="text-xs text-muted-foreground">{customer.email}</span>}
            <Badge variant="outline" className="text-xs capitalize">{customer.customer_type}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            HVAC contractor: <span className="font-medium">{customer.tenants?.name ?? 'Unknown'}</span>
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2 mt-3 pl-11 flex-wrap">
        <Select
          onValueChange={(v) => {
            const val = String(v ?? '')
            const t = tenants.find(t => t.id === val)
            setTenantLabel(t?.name ?? '')
            setSelectedTenant(val)
            setConfirming(false)
          }}
        >
          <SelectTrigger className="w-52">
            {tenantLabel
              ? <span className="flex flex-1 text-left text-sm truncate">{tenantLabel}</span>
              : <SelectValue placeholder="Move to HVAC contractor…" />}
          </SelectTrigger>
          <SelectContent>
            {tenants.filter(t => t.id !== customer.tenant_id).map(t => (
              <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {confirming ? (
          <>
            <span className="text-xs text-destructive font-medium">Move customer + sites + equipment + open jobs?</span>
            <Button size="sm" onClick={handleReassign} disabled={pending}
              className="bg-destructive text-white hover:bg-destructive/90">
              Confirm Move
            </Button>
            <Button size="sm" variant="outline" onClick={() => setConfirming(false)} disabled={pending}>
              Cancel
            </Button>
          </>
        ) : (
          <Button size="sm" variant="outline" onClick={handleReassign} disabled={pending || !selectedTenant}>
            <ArrowRightLeft className="h-3.5 w-3.5 mr-1" /> Move
          </Button>
        )}
      </div>
    </div>
  )
}

// ─── Main component ──────────────────────────────────────────────────────────

export function QueueClient({ serviceRequests, customers, tenants }: QueueClientProps) {
  const [tab, setTab] = useState<'requests' | 'customers'>('requests')
  const [search, setSearch] = useState('')

  const filteredCustomers = customers.filter(c => {
    if (!search.trim()) return true
    const q = search.toLowerCase()
    return c.name.toLowerCase().includes(q) || (c.email ?? '').toLowerCase().includes(q)
  })

  return (
    <div className="space-y-4">
      {/* Tab bar */}
      <div className="flex border-b border-border">
        <button
          onClick={() => setTab('requests')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'requests'
            ? 'border-black text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Unmatched Service Requests
          {serviceRequests.length > 0 && (
            <span className="ml-2 inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] text-white font-bold">
              {serviceRequests.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('customers')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${tab === 'customers'
            ? 'border-black text-foreground'
            : 'border-transparent text-muted-foreground hover:text-foreground'}`}
        >
          Customer Reassignment
        </button>
      </div>

      {/* Service requests */}
      {tab === 'requests' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              {serviceRequests.length === 0 ? 'No unmatched requests' : `${serviceRequests.length} unmatched service request${serviceRequests.length !== 1 ? 's' : ''}`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {serviceRequests.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Inbox className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">All service requests are assigned to an HVAC contractor.</p>
              </div>
            ) : (
              <div>
                {serviceRequests.map(sr => (
                  <SRRow key={sr.id} sr={sr} tenants={tenants} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Customer reassignment */}
      {tab === 'customers' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Customer Reassignment</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or email…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {filteredCustomers.length === 0 ? (
              <p className="p-6 text-sm text-muted-foreground text-center">
                {search ? 'No customers match your search.' : 'No customers found.'}
              </p>
            ) : (
              <div>
                {filteredCustomers.map(c => (
                  <CustomerRow key={c.id} customer={c} tenants={tenants} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
