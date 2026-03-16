'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateJobStatus } from '@/lib/actions/job-actions'

type JobStatus = 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'

interface TechnicianAssignProps {
  jobId: string
  currentTechId: string | null
  currentStatus: string
  technicians: Array<{ id: string; name: string }>
}

export function TechnicianAssign({
  jobId,
  currentTechId,
  currentStatus,
  technicians,
}: TechnicianAssignProps) {
  const router = useRouter()
  const [selectedId, setSelectedId] = useState<string>(currentTechId ?? '')
  const [isSaving, setIsSaving] = useState(false)

  async function handleSave() {
    setIsSaving(true)
    const technicianId = selectedId || undefined
    const newStatus: JobStatus = technicianId ? 'assigned' : 'unassigned'
    // Keep current status if it's beyond assigned (in_progress, paused, completed, cancelled)
    const advancedStatuses = ['in_progress', 'paused', 'completed', 'cancelled']
    const statusToUse: JobStatus = advancedStatuses.includes(currentStatus)
      ? (currentStatus as JobStatus)
      : newStatus

    const result = await updateJobStatus(jobId, statusToUse, { technicianId })
    setIsSaving(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Technician updated')
    router.refresh()
  }

  const currentTech = technicians.find((t) => t.id === currentTechId)
  const displayName = currentTech?.name ?? 'Unassigned'

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">Currently: <span className="font-medium text-foreground">{displayName}</span></p>
      <div className="flex gap-2 items-center">
        <Select value={selectedId} onValueChange={(v) => setSelectedId(v ?? '')}>
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Unassigned" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">Unassigned</SelectItem>
            {technicians.map((t) => (
              <SelectItem key={t.id} value={t.id}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button size="sm" onClick={handleSave} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </div>
  )
}
