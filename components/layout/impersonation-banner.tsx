'use client'

import { AlertTriangle, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface ImpersonationBannerProps {
  targetName: string
  targetEmail: string
  onEnd: () => void
}

export function ImpersonationBanner({ targetName, targetEmail, onEnd }: ImpersonationBannerProps) {
  return (
    <div className="bg-orange-600 text-white px-4 py-2 flex items-center justify-between gap-4 z-50">
      <div className="flex items-center gap-3">
        <AlertTriangle className="h-5 w-5 shrink-0" />
        <span className="text-sm font-semibold">
          IMPERSONATING: {targetName} ({targetEmail})
        </span>
        <span className="text-xs text-orange-200">— All actions are audited</span>
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={onEnd}
        className="bg-transparent border-white/50 text-white hover:bg-white/10 hover:text-white shrink-0"
      >
        <X className="h-4 w-4 mr-1" />
        End Session
      </Button>
    </div>
  )
}
