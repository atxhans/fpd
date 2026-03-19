'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Plus, Activity } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { ReadingsGrid } from '@/components/shared/readings-grid'

const READING_TYPES = [
  { key: 'suction_pressure',    label: 'Suction Pressure',      unit: 'PSI' },
  { key: 'discharge_pressure',  label: 'Discharge Pressure',    unit: 'PSI' },
  { key: 'superheat',           label: 'Superheat',             unit: '°F' },
  { key: 'subcooling',          label: 'Subcooling',            unit: '°F' },
  { key: 'return_air_temp',     label: 'Return Air Temp',       unit: '°F' },
  { key: 'supply_air_temp',     label: 'Supply Air Temp',       unit: '°F' },
  { key: 'delta_t',             label: 'Delta T (ΔT)',           unit: '°F' },
  { key: 'ambient_temp',        label: 'Ambient Outdoor Temp',  unit: '°F' },
  { key: 'humidity',            label: 'Relative Humidity',     unit: '%' },
  { key: 'compressor_amps',     label: 'Compressor Amps',       unit: 'A' },
  { key: 'voltage',             label: 'Supply Voltage',        unit: 'V' },
  { key: 'refrigerant_added',   label: 'Refrigerant Added',     unit: 'lbs' },
]

const schema = z.object({
  reading_key: z.string().min(1, 'Select a reading type'),
  value: z.string().min(1, 'Enter a value'),
  equipment_id: z.string().optional(),
  notes: z.string().optional(),
})
type FormData = z.infer<typeof schema>

interface ReadingsSectionProps {
  readings: Record<string, unknown>[]
  jobId: string
  tenantId: string
  equipmentList: Record<string, unknown>[]
}

export function ReadingsSection({ readings, jobId, tenantId, equipmentList }: ReadingsSectionProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  async function onSubmit(data: FormData) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get reading type ID
    const { data: rt } = await supabase
      .from('reading_types').select('id').eq('key', data.reading_key).single()
    if (!rt) { toast.error('Reading type not found'); return }

    const { error } = await supabase.from('readings').insert({
      tenant_id: tenantId,
      job_id: jobId,
      technician_id: user.id,
      reading_type_id: rt.id,
      value: parseFloat(data.value),
      unit: READING_TYPES.find(r => r.key === data.reading_key)?.unit ?? '',
      equipment_id: data.equipment_id || null,
      technician_notes: data.notes || null,
      source: 'manual',
    })

    if (error) { toast.error(error.message); return }
    toast.success('Reading saved')
    reset()
    setOpen(false)
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>Readings ({readings.length})</CardTitle>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" variant="outline" type="button" />}>
              <Plus className="h-4 w-4 mr-1" /> Add Reading
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Add Reading</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2">
                <div className="space-y-2">
                  <Label>Reading Type</Label>
                  <Select onValueChange={(v) => setValue('reading_key', v as string)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select reading type" />
                    </SelectTrigger>
                    <SelectContent>
                      {READING_TYPES.map(rt => (
                        <SelectItem key={rt.key} value={rt.key}>
                          {rt.label} ({rt.unit})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.reading_key && <p className="text-sm text-danger">{errors.reading_key.message}</p>}
                </div>

                <div className="space-y-2">
                  <Label>Value</Label>
                  <Input type="number" step="0.1" placeholder="0.0" {...register('value')} />
                  {errors.value && <p className="text-sm text-danger">{errors.value.message}</p>}
                </div>

                {equipmentList.length > 0 && (
                  <div className="space-y-2">
                    <Label>Equipment (optional)</Label>
                    <Select onValueChange={(v) => setValue('equipment_id', v as string)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select equipment" />
                      </SelectTrigger>
                      <SelectContent>
                        {equipmentList.map(eq => (
                          <SelectItem key={eq.id as string} value={eq.id as string}>
                            {eq.manufacturer as string} {eq.model_number as string}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Notes (optional)</Label>
                  <Input placeholder="Technician notes..." {...register('notes')} />
                </div>

                <div className="flex gap-2 justify-end pt-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving…' : 'Save Reading'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {readings.length === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">No readings yet. Add the first reading above.</p>
        ) : (
          <ReadingsGrid readings={readings.map((r: Record<string, unknown>) => {
            const rt = r.reading_types as { label: string; unit: string; normal_min: number | null; normal_max: number | null } | null
            return {
              id: r.id as string,
              label: rt?.label ?? 'Reading',
              unit: rt?.unit ?? '',
              value: r.value as number | null,
              bool_value: r.bool_value as boolean | null,
              is_flagged: r.is_flagged as boolean ?? false,
              normal_min: rt?.normal_min ?? null,
              normal_max: rt?.normal_max ?? null,
            }
          })} />
        )}
      </CardContent>
    </Card>
  )
}
