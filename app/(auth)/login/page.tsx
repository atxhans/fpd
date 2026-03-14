import { Suspense } from 'react'
import { FieldpieceLogo } from '@/components/layout/fieldpiece-logo'
import { LoginForm } from './login-form'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="bg-black px-6 py-4">
        <FieldpieceLogo size="md" showTagline />
      </div>

      {/* Form */}
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="mb-8">
            <div className="h-1 w-12 bg-primary mb-4" />
            <h1 className="text-2xl font-bold">Sign in</h1>
            <p className="text-muted-foreground mt-1">Access your Fieldpiece Digital account</p>
          </div>

          <Suspense fallback={<div className="space-y-4 animate-pulse"><div className="h-10 bg-muted rounded" /><div className="h-10 bg-muted rounded" /><div className="h-10 bg-muted rounded" /></div>}>
            <LoginForm />
          </Suspense>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Need access?{' '}
            <span className="font-medium">Contact your company administrator or Fieldpiece support.</span>
          </p>
        </div>
      </div>
    </div>
  )
}
