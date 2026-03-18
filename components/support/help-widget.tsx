'use client'

import { useState, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { HelpCircle, X, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { createSupportCase } from '@/lib/actions/support-actions'
import { cn } from '@/lib/utils'

const schema = z.object({
  subject: z.string().min(3, 'Please enter a subject'),
  description: z.string().min(10, 'Please describe the issue (at least 10 characters)'),
})
type FormData = z.infer<typeof schema>

interface HelpWidgetProps {
  userEmail: string
  userName: string
}

export function HelpWidget({ userEmail, userName }: HelpWidgetProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [pending, startTransition] = useTransition()

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { subject: '', description: '' },
  })

  function openWidget() {
    setSubmitted(false)
    reset()
    setOpen(true)
  }

  function onSubmit(data: FormData) {
    const pageUrl = window.location.href
    startTransition(async () => {
      const result = await createSupportCase({
        subject: data.subject,
        description: data.description,
        pageUrl,
      })
      if (result.error) { toast.error(result.error); return }
      setSubmitted(true)
    })
  }

  // Don't render on the schedule/map pages (full-screen)
  if (pathname.startsWith('/jobs/map')) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={openWidget}
        aria-label="Get help"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-black text-primary shadow-lg hover:bg-black/80 transition-colors"
      >
        <HelpCircle className="h-5 w-5" />
      </button>

      {/* Overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-6 sm:items-center sm:justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative z-10 w-full max-w-md rounded-xl bg-background shadow-2xl border border-border">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border">
              <div>
                <h2 className="font-semibold text-base">Get help</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Our support team will respond shortly
                </p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-md p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {submitted ? (
              /* Success state */
              <div className="p-8 flex flex-col items-center text-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <CheckCircle2 className="h-6 w-6 text-green-600" />
                </div>
                <p className="font-semibold">Request submitted</p>
                <p className="text-sm text-muted-foreground">
                  We've received your request and will get back to you soon.
                </p>
                <Button variant="outline" onClick={() => setOpen(false)} className="mt-2">
                  Close
                </Button>
              </div>
            ) : (
              /* Form */
              <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
                {/* Auto-captured context — shown as read-only info */}
                <div className="rounded-lg bg-muted/50 px-3 py-2.5 space-y-0.5 text-xs text-muted-foreground">
                  <p><span className="font-medium text-foreground">From:</span> {userName || userEmail}</p>
                  <p className="truncate"><span className="font-medium text-foreground">Page:</span> {pathname}</p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hw-subject">Subject</Label>
                  <Input
                    id="hw-subject"
                    placeholder="e.g. Can't assign a technician"
                    {...register('subject')}
                  />
                  {errors.subject && (
                    <p className="text-xs text-destructive">{errors.subject.message}</p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="hw-desc">Description</Label>
                  <textarea
                    id="hw-desc"
                    rows={4}
                    placeholder="Describe what you were trying to do and what happened…"
                    className={cn(
                      'w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background',
                      'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                      'resize-none'
                    )}
                    {...register('description')}
                  />
                  {errors.description && (
                    <p className="text-xs text-destructive">{errors.description.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={pending} className="w-full">
                  {pending ? 'Submitting…' : 'Submit request'}
                </Button>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  )
}
