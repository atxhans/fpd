'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FieldpieceLogo } from '@/components/layout/fieldpiece-logo'
import { APP_URL } from '@/lib/constants'

const schema = z.object({ email: z.string().email('Enter a valid email') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${APP_URL}/reset-password`,
    })
    setSent(true)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="bg-black px-6 py-4">
        <FieldpieceLogo size="md" showTagline />
      </div>
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-8">
            <div className="h-1 w-12 bg-primary mb-4" />
            <h1 className="text-2xl font-bold">Reset password</h1>
            <p className="text-muted-foreground mt-1">Enter your email and we'll send a reset link</p>
          </div>

          {sent ? (
            <div className="p-4 bg-green-50 border border-green-200 rounded-md text-center">
              <p className="font-medium text-green-800">Check your email</p>
              <p className="text-sm text-green-700 mt-1">If an account exists, a reset link has been sent.</p>
              <Link href="/login" className="text-sm font-medium text-green-800 underline mt-3 inline-block">
                Back to sign in
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" autoComplete="email" placeholder="you@company.com" {...register('email')} />
                {errors.email && <p className="text-sm text-danger">{errors.email.message}</p>}
              </div>
              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? 'Sending…' : 'Send reset link'}
              </Button>
              <p className="text-center text-sm">
                <Link href="/login" className="text-muted-foreground hover:text-foreground">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
