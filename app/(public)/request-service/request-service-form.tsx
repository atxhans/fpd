'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle } from 'lucide-react'

const schema = z.object({
  name:        z.string().min(2, 'Full name is required'),
  email:       z.string().email('Enter a valid email address'),
  phone:       z.string().min(7, 'Phone number is required'),
  address:     z.string().min(5, 'Service address is required'),
  description: z.string().min(10, 'Please describe the issue (at least 10 characters)'),
  // Honeypot — must stay empty
  website:     z.string().max(0, 'Leave this blank').optional(),
})
type FormData = z.infer<typeof schema>

interface RequestServiceFormProps {
  requestId: string | null
  prefillEmail: string | null
}

export function RequestServiceForm({ requestId, prefillEmail }: RequestServiceFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: prefillEmail ?? '' },
  })

  async function onSubmit(data: FormData) {
    // Honeypot check (belt-and-suspenders, also checked server-side)
    if (data.website) return

    setServerError(null)
    const res = await fetch('/api/service-requests/public', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...data, requestId }),
    })

    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      setServerError(json.error ?? 'Something went wrong. Please try again.')
      return
    }

    setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-8">
        <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
        <h2 className="text-xl font-bold">Request submitted!</h2>
        <p className="text-muted-foreground max-w-sm mx-auto">
          Thank you — we've received your service request and will be in touch shortly to confirm your appointment.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Honeypot — hidden from real users */}
      <div style={{ display: 'none' }} aria-hidden="true">
        <input tabIndex={-1} autoComplete="off" {...register('website')} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="name">Full name *</Label>
          <Input id="name" placeholder="Jane Smith" {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone number *</Label>
          <Input id="phone" type="tel" placeholder="(512) 555-0100" {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email address *</Label>
        <Input id="email" type="email" placeholder="you@example.com" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="address">Service address *</Label>
        <Input id="address" placeholder="123 Main St, Austin, TX 78701" {...register('address')} />
        {errors.address && <p className="text-sm text-destructive">{errors.address.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Describe the issue *</Label>
        <Textarea
          id="description"
          rows={4}
          placeholder="e.g. AC unit stopped cooling yesterday, making a rattling noise..."
          {...register('description')}
        />
        {errors.description && <p className="text-sm text-destructive">{errors.description.message}</p>}
      </div>

      {serverError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting…' : 'Submit Service Request'}
      </Button>
    </form>
  )
}
