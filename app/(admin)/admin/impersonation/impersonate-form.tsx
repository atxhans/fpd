'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Shield } from 'lucide-react'

const schema = z.object({
  userEmail: z.string().email('Enter a valid email'),
  reason: z.string().min(20, 'Reason must be at least 20 characters — be specific'),
})
type FormData = z.infer<typeof schema>

export function ImpersonateForm() {
  const [confirmed, setConfirmed] = useState(false)

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    if (!confirmed) { setConfirmed(true); return }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Find target user
    const { data: targetProfile } = await supabase
      .from('profiles').select('id').eq('email', data.userEmail).single()

    if (!targetProfile) { toast.error('User not found'); return }

    // Create immutable session record
    const { error: sessionError } = await supabase.from('impersonation_sessions').insert({
      initiated_by: user.id,
      target_user_id: targetProfile.id,
      reason: data.reason,
      status: 'active',
    })

    if (sessionError) { toast.error(sessionError.message); return }

    // Log audit event
    await supabase.from('audit_logs').insert({
      actor_id: user.id,
      action: 'impersonation.started',
      resource_type: 'user',
      resource_id: targetProfile.id,
      resource_label: data.userEmail,
      metadata: { reason: data.reason },
    })

    toast.success(`Impersonation session started for ${data.userEmail}`)
    reset()
    setConfirmed(false)
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" />
          <CardTitle>Start Impersonation</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="userEmail">Target User Email</Label>
            <Input id="userEmail" type="email" placeholder="user@company.com" {...register('userEmail')} />
            {errors.userEmail && <p className="text-sm text-danger">{errors.userEmail.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Business Reason (required)</Label>
            <Textarea
              id="reason"
              rows={3}
              placeholder="Describe why you need to impersonate this user and what support issue you are resolving…"
              {...register('reason')}
            />
            {errors.reason && <p className="text-sm text-danger">{errors.reason.message}</p>}
          </div>

          {confirmed && (
            <div className="p-3 bg-orange-50 border border-orange-300 rounded-md">
              <p className="text-sm font-semibold text-orange-800">Confirm impersonation?</p>
              <p className="text-xs text-orange-700 mt-1">This will be permanently recorded in the audit log.</p>
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            variant={confirmed ? 'destructive' : 'default'}
            className={!confirmed ? 'bg-black text-primary hover:bg-black/90' : ''}
          >
            {confirmed ? 'Confirm & Start Session' : 'Start Impersonation'}
          </Button>
          {confirmed && (
            <Button type="button" variant="outline" className="ml-2" onClick={() => setConfirmed(false)}>
              Cancel
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
