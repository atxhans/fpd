'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Pencil } from 'lucide-react'
import { updateEquipment } from '@/lib/actions/equipment-actions'

const schema = z.object({
  manufacturer: z.string().min(1, 'Manufacturer is required'),
  model_number: z.string().nullable().optional(),
  serial_number: z.string().nullable().optional(),
  unit_type: z.string().min(1, 'Unit type is required'),
  location: z.enum(['indoor', 'outdoor', 'both']).nullable().optional(),
  refrigerant_type: z.string().nullable().optional(),
  tonnage: z.string().nullable().optional(),
  install_date: z.string().nullable().optional(),
  warranty_expiry: z.string().nullable().optional(),
  status: z.enum(['active', 'retired', 'decommissioned']),
  notes: z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

interface EquipmentEditFormProps {
  equipmentId: string
  defaultValues: {
    manufacturer: string
    model_number: string | null
    serial_number: string | null
    unit_type: string
    location: 'indoor' | 'outdoor' | 'both' | null
    refrigerant_type: string | null
    tonnage: number | null
    install_date: string | null
    warranty_expiry: string | null
    status: 'active' | 'retired' | 'decommissioned'
    notes: string | null
  }
}

export function EquipmentEditForm({ equipmentId, defaultValues }: EquipmentEditFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      ...defaultValues,
      tonnage: defaultValues.tonnage != null ? String(defaultValues.tonnage) : '',
    },
  })

  async function onSubmit(data: FormData) {
    const tonnageNum = data.tonnage ? parseFloat(data.tonnage) : null
    const result = await updateEquipment(equipmentId, {
      manufacturer: data.manufacturer,
      model_number: data.model_number || null,
      serial_number: data.serial_number || null,
      unit_type: data.unit_type,
      location: data.location ?? null,
      refrigerant_type: data.refrigerant_type || null,
      tonnage: isNaN(tonnageNum as number) ? null : tonnageNum,
      install_date: data.install_date || null,
      warranty_expiry: data.warranty_expiry || null,
      status: data.status,
      notes: data.notes || null,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Equipment updated')
    setOpen(false)
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button variant="outline" size="sm" />}>
        <Pencil className="h-4 w-4 mr-2" />
        Edit
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Edit Equipment</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="manufacturer">Manufacturer <span className="text-destructive">*</span></Label>
            <Input id="manufacturer" {...register('manufacturer')} />
            {errors.manufacturer && <p className="text-sm text-destructive">{errors.manufacturer.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="model_number">Model Number</Label>
            <Input id="model_number" {...register('model_number')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serial_number">Serial Number</Label>
            <Input id="serial_number" {...register('serial_number')} />
          </div>

          <div className="space-y-2">
            <Label>Unit Type <span className="text-destructive">*</span></Label>
            <Select
              defaultValue={defaultValues.unit_type}
              onValueChange={(v) => setValue('unit_type', (v as string) || defaultValues.unit_type)}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="split_ac">Split AC</SelectItem>
                <SelectItem value="heat_pump">Heat Pump</SelectItem>
                <SelectItem value="furnace">Furnace</SelectItem>
                <SelectItem value="boiler">Boiler</SelectItem>
                <SelectItem value="chiller">Chiller</SelectItem>
                <SelectItem value="rooftop_unit">Rooftop Unit</SelectItem>
                <SelectItem value="mini_split">Mini Split</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Location</Label>
            <Select
              defaultValue={defaultValues.location ?? undefined}
              onValueChange={(v) => setValue('location', (v || null) as 'indoor' | 'outdoor' | 'both' | null | undefined)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Not specified</SelectItem>
                <SelectItem value="indoor">Indoor</SelectItem>
                <SelectItem value="outdoor">Outdoor</SelectItem>
                <SelectItem value="both">Both</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="refrigerant_type">Refrigerant Type</Label>
            <Input id="refrigerant_type" {...register('refrigerant_type')} placeholder="e.g. R-410A" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="tonnage">Tonnage</Label>
            <Input id="tonnage" type="number" step="0.5" {...register('tonnage')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="install_date">Install Date</Label>
            <Input id="install_date" type="date" {...register('install_date')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="warranty_expiry">Warranty Expiry</Label>
            <Input id="warranty_expiry" type="date" {...register('warranty_expiry')} />
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select
              defaultValue={defaultValues.status}
              onValueChange={(v) => setValue('status', v as FormData['status'])}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="retired">Retired</SelectItem>
                <SelectItem value="decommissioned">Decommissioned</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} placeholder="Notes…" {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
