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
import { Pencil, Plus } from 'lucide-react'
import { createSite, updateSite } from '@/lib/actions/site-actions'

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  address_line1: z.string().min(1, 'Address is required'),
  address_line2: z.string().nullable().optional(),
  city:          z.string().min(1, 'City is required'),
  state:         z.string().min(1, 'State is required'),
  zip:           z.string().min(1, 'ZIP is required'),
  site_type:     z.enum(['residential', 'commercial', 'industrial']),
  notes:         z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

type SiteFormProps =
  | { mode: 'create'; customerId: string; tenantId: string }
  | { mode: 'edit'; siteId: string; defaultValues: FormData }

export function SiteForm(props: SiteFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const defaults: FormData = props.mode === 'edit'
    ? props.defaultValues
    : { name: '', address_line1: '', address_line2: '', city: '', state: '', zip: '', site_type: 'residential', notes: '' }

  const { register, handleSubmit, setValue, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: defaults,
  })

  async function onSubmit(data: FormData) {
    const result = props.mode === 'create'
      ? await createSite(props.customerId, props.tenantId, data)
      : await updateSite(props.siteId, data)

    if (result.error) { toast.error(result.error); return }
    toast.success(props.mode === 'create' ? 'Site added' : 'Site updated')
    setOpen(false)
    if (props.mode === 'create') reset()
    router.refresh()
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          props.mode === 'create'
            ? <Button variant="outline" size="sm" />
            : <Button variant="ghost" size="icon-sm" />
        }
      >
        {props.mode === 'create'
          ? <><Plus className="h-4 w-4 mr-2" />Add Site</>
          : <Pencil className="h-3.5 w-3.5" />
        }
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{props.mode === 'create' ? 'Add Site' : 'Edit Site'}</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-2 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Site Name</Label>
            <Input id="name" placeholder="e.g. Main Residence, Unit 4B" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label>Site Type</Label>
            <Select
              defaultValue={defaults.site_type}
              onValueChange={(v) => setValue('site_type', v as FormData['site_type'])}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line1">Address</Label>
            <Input id="address_line1" placeholder="123 Main St" {...register('address_line1')} />
            {errors.address_line1 && <p className="text-sm text-destructive">{errors.address_line1.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2 <span className="text-muted-foreground">(optional)</span></Label>
            <Input id="address_line2" placeholder="Apt, Suite, Unit…" {...register('address_line2')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...register('city')} />
              {errors.city && <p className="text-sm text-destructive">{errors.city.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input id="state" placeholder="CA" maxLength={2} className="uppercase" {...register('state')} />
              {errors.state && <p className="text-sm text-destructive">{errors.state.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input id="zip" placeholder="90210" {...register('zip')} />
            {errors.zip && <p className="text-sm text-destructive">{errors.zip.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes <span className="text-muted-foreground">(optional)</span></Label>
            <Textarea id="notes" rows={3} placeholder="Access instructions, equipment notes…" {...register('notes')} />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? 'Saving…' : props.mode === 'create' ? 'Add Site' : 'Save Changes'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}
