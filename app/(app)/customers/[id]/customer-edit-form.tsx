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
import { updateCustomer } from '@/lib/actions/customer-actions'

const schema = z.object({
  name:          z.string().min(1, 'Name is required'),
  email:         z.string().email('Invalid email').or(z.literal('')).nullable().optional(),
  phone:         z.string().nullable().optional(),
  customer_type: z.enum(['residential', 'commercial', 'industrial']),
  notes:         z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

interface CustomerEditFormProps {
  customerId: string
  defaultValues: FormData
}

export function CustomerEditForm({ customerId, defaultValues }: CustomerEditFormProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  })

  async function onSubmit(data: FormData) {
    const result = await updateCustomer(customerId, data)
    if (result.error) { toast.error(result.error); return }
    toast.success('Customer updated')
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
          <SheetTitle>Edit Customer</SheetTitle>
        </SheetHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 mt-2 px-4 pb-6">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" {...register('name')} />
            {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register('phone')} />
          </div>

          <div className="space-y-2">
            <Label>Customer Type</Label>
            <Select
              defaultValue={defaultValues.customer_type}
              onValueChange={(v) => setValue('customer_type', v as FormData['customer_type'])}
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
            <Label htmlFor="notes">Notes</Label>
            <Textarea id="notes" rows={4} placeholder="Internal notes…" {...register('notes')} />
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
