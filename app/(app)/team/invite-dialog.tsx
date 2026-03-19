'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { inviteTeamMember } from '@/lib/actions/team-actions'

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  email:     z.string().email('Valid email address required'),
  role:      z.enum(['technician', 'dispatcher', 'company_admin']),
})
type FormData = z.infer<typeof schema>

const ROLE_OPTIONS = [
  { value: 'technician',   label: 'Technician',   description: 'Can view and complete assigned jobs' },
  { value: 'dispatcher',   label: 'Dispatcher',   description: 'Can assign jobs and manage schedules' },
  { value: 'company_admin',label: 'Company Admin', description: 'Full access to settings and team management' },
]

export function InviteDialog({ tenantId }: { tenantId: string }) {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'technician' },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    const result = await inviteTeamMember({ tenantId, ...data })
    if ('error' in result) {
      toast.error(result.error)
      return
    }
    toast.success(`Invitation sent to ${data.email}`)
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" />}>
        <UserPlus className="h-4 w-4 mr-2" />
        Invite Member
      </DialogTrigger>

      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input placeholder="Jane" {...register('firstName')} />
              {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input placeholder="Smith" {...register('lastName')} />
              {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email Address</Label>
            <Input type="email" placeholder="jane@company.com" {...register('email')} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label>Role</Label>
            <Select
              value={selectedRole}
              onValueChange={(v) => { if (v) setValue('role', v as FormData['role']) }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map(r => (
                  <SelectItem key={r.value} value={r.value}>
                    <div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-xs text-muted-foreground">{r.description}</p>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <p className="text-xs text-muted-foreground">
            They'll receive an email with a link to set up their account and join your team.
          </p>

          <div className="flex gap-2 justify-end pt-1">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Sending…' : 'Send Invitation'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
