'use client'

import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { acceptInvite } from '@/lib/actions/accept-invite-action'

const ROLE_LABELS: Record<string, string> = {
  technician:    'Technician',
  dispatcher:    'Dispatcher',
  company_admin: 'Company Admin',
}

const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName:  z.string().min(1, 'Last name is required'),
  password:  z.string().min(8, 'Password must be at least 8 characters'),
  confirm:   z.string(),
}).refine(d => d.password === d.confirm, {
  message: 'Passwords do not match',
  path: ['confirm'],
})
type FormData = z.infer<typeof schema>

interface AcceptFormProps {
  token: string
  email: string
  role: string
  companyName: string
}

export function AcceptForm({ token, email, role, companyName }: AcceptFormProps) {
  const router = useRouter()
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const result = await acceptInvite({
      token,
      firstName: data.firstName,
      lastName: data.lastName,
      password: data.password,
    })

    if ('error' in result) {
      toast.error(result.error)
      return
    }

    toast.success('Account created! Welcome to Fieldpiece Digital.')
    router.push(result.redirectTo)
  }

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl border border-border w-full max-w-md overflow-hidden">
        {/* Header */}
        <div className="bg-black px-8 py-6 text-center">
          <span className="text-[#FFD100] font-bold text-xl tracking-wide">FIELDPIECE DIGITAL</span>
        </div>

        <div className="px-8 py-8 space-y-6">
          <div>
            <h1 className="text-2xl font-bold">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-1">
              You've been invited to join <strong>{companyName}</strong> as a{' '}
              <strong>{ROLE_LABELS[role] ?? role}</strong>.
            </p>
          </div>

          {/* Email (read-only) */}
          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input value={email} readOnly className="bg-muted/40 text-muted-foreground" />
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
              <Label>Password</Label>
              <Input type="password" placeholder="At least 8 characters" {...register('password')} />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label>Confirm Password</Label>
              <Input type="password" placeholder="Re-enter your password" {...register('confirm')} />
              {errors.confirm && <p className="text-xs text-destructive">{errors.confirm.message}</p>}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account…' : 'Create Account & Join Team'}
            </Button>
          </form>

          <p className="text-xs text-center text-muted-foreground">
            Already have an account?{' '}
            <a href="/login" className="text-primary hover:underline">Sign in</a>
          </p>
        </div>
      </div>
    </div>
  )
}
