'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CalendarPlus, Loader2, Sparkles, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { generateFollowUpSuggestion, createFollowUpJob } from '@/lib/actions/follow-up-action'

type State = 'loading' | 'ready' | 'submitting' | 'done'

const SERVICE_CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'repair',      label: 'Repair' },
  { value: 'inspection',  label: 'Inspection' },
  { value: 'estimate',    label: 'Estimate' },
  { value: 'other',       label: 'Other' },
]

function addDays(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

interface FollowUpDialogProps {
  jobId: string
  jobNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function FollowUpDialog({ jobId, jobNumber, open, onOpenChange }: FollowUpDialogProps) {
  const router = useRouter()
  const [state, setState] = useState<State>('loading')
  const [reason, setReason] = useState('')
  const [date, setDate] = useState(addDays(30))
  const [category, setCategory] = useState('maintenance')
  const [description, setDescription] = useState('')
  const [newJobNumber, setNewJobNumber] = useState('')

  // Auto-generate suggestion when dialog opens
  useEffect(() => {
    if (!open) return
    setState('loading')
    setReason('')
    setDescription('')
    setDate(addDays(30))
    setCategory('maintenance')

    generateFollowUpSuggestion(jobId).then((result) => {
      if ('error' in result) {
        toast.error(result.error)
        onOpenChange(false)
        return
      }
      const { suggestion } = result
      setReason(suggestion.reason)
      setDescription(suggestion.description)
      setDate(addDays(suggestion.timeframe_days))
      setCategory(suggestion.service_category)
      setState('ready')
    })
  }, [open, jobId, onOpenChange])

  async function handleConfirm() {
    setState('submitting')
    const result = await createFollowUpJob({
      originalJobId: jobId,
      scheduledDate: date,
      service_category: category,
      description,
    })
    if ('error' in result) {
      toast.error(result.error)
      setState('ready')
      return
    }
    setNewJobNumber(result.jobNumber)
    setState('done')
  }

  function handleNavigate() {
    onOpenChange(false)
    router.push(`/jobs`)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarPlus className="h-5 w-5" />
            Schedule Follow-up for {jobNumber}
          </DialogTitle>
        </DialogHeader>

        {state === 'loading' && (
          <div className="py-10 flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-7 w-7 animate-spin" />
            <p className="text-sm">Analysing job — generating recommendation…</p>
          </div>
        )}

        {state === 'done' && (
          <div className="py-8 flex flex-col items-center gap-4 text-center">
            <CheckCircle className="h-10 w-10 text-green-500" />
            <div>
              <p className="font-semibold text-lg">Follow-up job created</p>
              <p className="text-sm text-muted-foreground mt-1">{newJobNumber} has been added to the job board.</p>
            </div>
            <Button onClick={handleNavigate}>View Jobs</Button>
          </div>
        )}

        {(state === 'ready' || state === 'submitting') && (
          <div className="space-y-4 mt-1">
            {/* AI reasoning */}
            <div className="flex gap-2.5 p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-800">
              <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />
              <p>{reason}</p>
            </div>

            {/* Scheduled date */}
            <div className="space-y-1.5">
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={date}
                onChange={e => setDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Service category */}
            <div className="space-y-1.5">
              <Label>Service Type</Label>
              <Select value={category} onValueChange={(v) => { if (v) setCategory(v) }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SERVICE_CATEGORIES.map(c => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                rows={3}
                placeholder="What should be done at this follow-up?"
              />
            </div>

            <div className="flex gap-2 justify-end pt-1">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={state === 'submitting' || !description.trim()}>
                {state === 'submitting' ? (
                  <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating…</>
                ) : (
                  <><CalendarPlus className="h-4 w-4 mr-2" /> Create Follow-up Job</>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
