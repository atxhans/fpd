'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { CalendarPlus } from 'lucide-react'
import { FollowUpDialog } from './follow-up-dialog'

interface FollowUpButtonProps {
  jobId: string
  jobNumber: string
}

export function FollowUpButton({ jobId, jobNumber }: FollowUpButtonProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus className="h-4 w-4 mr-2" />
        Follow-up
      </Button>
      <FollowUpDialog
        jobId={jobId}
        jobNumber={jobNumber}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  )
}
