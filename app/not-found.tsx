import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Construction, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-8">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-primary border-2 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
            <Construction className="h-10 w-10 text-black" />
          </div>
        </div>

        {/* Heading */}
        <div className="space-y-3">
          <p className="text-sm font-mono font-semibold text-muted-foreground tracking-widest uppercase">404</p>
          <h1 className="text-3xl font-bold">Page Not Found</h1>
          <p className="text-muted-foreground leading-relaxed">
            This page doesn't exist yet — Fieldpiece Digital is an active demo
            and not all features are complete. Some routes and sections are still
            under construction.
          </p>
        </div>

        {/* Demo notice */}
        <div className="rounded-lg border border-primary/40 bg-primary/10 p-4 text-sm text-left space-y-1">
          <p className="font-semibold text-black">Demo system notice</p>
          <p className="text-muted-foreground">
            This platform is a working prototype. Features are being added continuously.
            If you're looking for something specific, it may not be built yet.
          </p>
        </div>

        {/* CTA */}
        <Link href="/dashboard">
          <Button className="bg-black text-primary hover:bg-black/90 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

      </div>
    </div>
  )
}
