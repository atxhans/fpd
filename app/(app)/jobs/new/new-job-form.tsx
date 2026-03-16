'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { PageHeader } from '@/components/shared/page-header'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { ArrowLeft } from 'lucide-react'
import { createJob } from '@/lib/actions/job-actions'

const schema = z.object({
  customer_id: z.string().min(1, 'Customer is required'),
  site_id: z.string().min(1, 'Site is required'),
  service_category: z.string().min(1, 'Service category is required'),
  priority: z.string().min(1, 'Priority is required'),
  scheduled_at: z.string().nullable().optional(),
  assigned_technician_id: z.string().nullable().optional(),
  problem_description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

interface Site {
  id: string
  name: string
  address_line1: string
  city: string
  state: string
  zip: string
}

interface Customer {
  id: string
  name: string
  sites: Site[]
}

interface Technician {
  id: string
  name: string
}

interface NewJobFormProps {
  tenantId: string
  customers: Customer[]
  technicians: Technician[]
}

export function NewJobForm({ tenantId, customers, technicians }: NewJobFormProps) {
  const router = useRouter()
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null)
  const [selectedSite, setSelectedSite] = useState<Site | null>(null)
  const [selectedTechName, setSelectedTechName] = useState<string>('')
  const selectedCustomerId = selectedCustomer?.id ?? ''

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      customer_id: '',
      site_id: '',
      service_category: 'maintenance',
      priority: 'normal',
      scheduled_at: null,
      assigned_technician_id: null,
      problem_description: null,
      notes: null,
    },
  })

  const availableSites = customers.find((c) => c.id === selectedCustomerId)?.sites ?? []

  async function onSubmit(data: FormData) {
    const result = await createJob(tenantId, {
      customer_id: data.customer_id,
      site_id: data.site_id,
      assigned_technician_id: data.assigned_technician_id || null,
      service_category: data.service_category,
      priority: data.priority,
      scheduled_at: data.scheduled_at || null,
      problem_description: data.problem_description || null,
      notes: data.notes || null,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Job created successfully')
    router.push(`/jobs/${result.jobId}`)
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <Link href="/jobs" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
        <PageHeader title="New Job" subtitle="Create a new service job or work order" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Customer */}
            <div className="space-y-2">
              <Label>Customer <span className="text-destructive">*</span></Label>
              <Select
                onValueChange={(v) => {
                  const val = String(v ?? '')
                  const customer = customers.find((c) => c.id === val) ?? null
                  setSelectedCustomer(customer)
                  setSelectedSite(null)
                  setValue('customer_id', val)
                  setValue('site_id', '')
                }}
              >
                <SelectTrigger className="w-full">
                  {selectedCustomer
                    ? <span className="flex flex-1 text-left text-sm truncate">{selectedCustomer.name}</span>
                    : <SelectValue placeholder="Select a customer" />}
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.customer_id && <p className="text-sm text-destructive">{errors.customer_id.message}</p>}
            </div>

            {/* Site */}
            <div className="space-y-2">
              <Label>Site <span className="text-destructive">*</span></Label>
              <Select
                onValueChange={(v) => {
                  const val = String(v ?? '')
                  const site = availableSites.find((s) => s.id === val) ?? null
                  setSelectedSite(site)
                  setValue('site_id', val)
                }}
                disabled={!selectedCustomerId}
              >
                <SelectTrigger className="w-full">
                  {selectedSite
                    ? <span className="flex flex-1 text-left text-sm truncate">{selectedSite.name} — {selectedSite.city}, {selectedSite.state}</span>
                    : <SelectValue placeholder={selectedCustomerId ? 'Select a site' : 'Select a customer first'} />}
                </SelectTrigger>
                <SelectContent>
                  {availableSites.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name} — {s.city}, {s.state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.site_id && <p className="text-sm text-destructive">{errors.site_id.message}</p>}
            </div>

            {/* Service Category */}
            <div className="space-y-2">
              <Label>Service Category <span className="text-destructive">*</span></Label>
              <Select
                defaultValue="maintenance"
                onValueChange={(v) => setValue('service_category', v ?? 'maintenance')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="repair">Repair</SelectItem>
                  <SelectItem value="installation">Installation</SelectItem>
                  <SelectItem value="inspection">Inspection</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                  <SelectItem value="warranty">Warranty</SelectItem>
                  <SelectItem value="estimate">Estimate</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority <span className="text-destructive">*</span></Label>
              <Select
                defaultValue="normal"
                onValueChange={(v) => setValue('priority', v ?? 'normal')}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="emergency">Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Scheduled At */}
            <div className="space-y-2">
              <Label htmlFor="scheduled_at">Scheduled At</Label>
              <Input
                id="scheduled_at"
                type="datetime-local"
                {...register('scheduled_at')}
              />
            </div>

            {/* Assign Technician */}
            <div className="space-y-2">
              <Label>Assign Technician</Label>
              <Select
                onValueChange={(v) => {
                  const val = String(v ?? '')
                  const tech = technicians.find((t) => t.id === val)
                  setSelectedTechName(tech?.name ?? '')
                  setValue('assigned_technician_id', val || null)
                }}
              >
                <SelectTrigger className="w-full">
                  {selectedTechName
                    ? <span className="flex flex-1 text-left text-sm truncate">{selectedTechName}</span>
                    : <SelectValue placeholder="Unassigned" />}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Unassigned</SelectItem>
                  {technicians.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Problem Description */}
            <div className="space-y-2">
              <Label htmlFor="problem_description">Problem Description</Label>
              <Textarea
                id="problem_description"
                rows={3}
                placeholder="Describe the issue or work required…"
                {...register('problem_description')}
              />
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Internal Notes</Label>
              <Textarea
                id="notes"
                rows={3}
                placeholder="Internal notes…"
                {...register('notes')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting ? 'Creating…' : 'Create Job'}
              </Button>
              <Link href="/jobs">
                <Button type="button" variant="outline">
                  Cancel
                </Button>
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
