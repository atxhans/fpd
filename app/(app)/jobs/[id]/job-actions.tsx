'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Play, Pause, CheckCircle } from 'lucide-react'

interface JobActionsProps {
  job: Record<string, unknown>
  userId: string
  role: string
}

export function JobActions({ job, userId, role }: JobActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const canEdit = role === 'technician' || role === 'company_admin' || role === 'dispatcher'
  const status = job.status as string

  async function updateStatus(newStatus: string) {
    setLoading(true)
    const supabase = createClient()
    const updates: Record<string, unknown> = { status: newStatus }
    if (newStatus === 'in_progress' && !job.started_at) updates.started_at = new Date().toISOString()
    if (newStatus === 'completed') updates.completed_at = new Date().toISOString()

    const { error } = await supabase.from('jobs').update(updates).eq('id', job.id as string)
    setLoading(false)
    if (error) { toast.error(error.message); return }
    toast.success(`Job ${newStatus.replace('_', ' ')}`)
    router.refresh()
  }

  if (!canEdit) return null

  return (
    <div className="flex gap-2">
      {(status === 'assigned' || status === 'paused') && (
        <Button
          size="sm"
          onClick={() => updateStatus('in_progress')}
          disabled={loading}
          className="bg-black text-primary hover:bg-black/90"
        >
          <Play className="h-4 w-4 mr-1" />
          Start Job
        </Button>
      )}
      {status === 'in_progress' && (
        <>
          <Button size="sm" variant="outline" onClick={() => updateStatus('paused')} disabled={loading}>
            <Pause className="h-4 w-4 mr-1" /> Pause
          </Button>
          <Button size="sm" onClick={() => updateStatus('completed')} disabled={loading} className="bg-black text-primary hover:bg-black/90">
            <CheckCircle className="h-4 w-4 mr-1" /> Complete
          </Button>
        </>
      )}
    </div>
  )
}
