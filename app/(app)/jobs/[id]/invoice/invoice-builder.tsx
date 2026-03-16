'use client'

import { useRouter } from 'next/navigation'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { Plus, Trash2 } from 'lucide-react'
import { createInvoice } from '@/lib/actions/invoice-actions'

const lineItemSchema = z.object({
  description: z.string().min(1, 'Description required'),
  qty: z.string().min(1, 'Qty required'),
  unit_price: z.string().min(1, 'Price required'),
  total: z.string().optional(),
})

const schema = z.object({
  line_items: z.array(lineItemSchema).min(1, 'Add at least one line item'),
  tax_rate: z.string().optional(),
  notes: z.string().nullable().optional(),
  due_date: z.string().nullable().optional(),
})
type FormData = z.infer<typeof schema>

interface InvoiceBuilderProps {
  jobId: string
}

export function InvoiceBuilder({ jobId }: InvoiceBuilderProps) {
  const router = useRouter()

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      line_items: [{ description: '', qty: '1', unit_price: '0', total: '0' }],
      tax_rate: '0',
      notes: '',
      due_date: '',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'line_items' })

  const watchedItems = watch('line_items')
  const taxRate = watch('tax_rate') ?? 0

  const subtotal = (watchedItems ?? []).reduce((sum, item) => {
    const qty = parseFloat(String(item.qty)) || 0
    const price = parseFloat(String(item.unit_price)) || 0
    return sum + qty * price
  }, 0)
  const taxAmount = subtotal * (parseFloat(String(taxRate)) / 100)
  const total = subtotal + taxAmount

  function updateRowTotal(index: number) {
    const item = watchedItems?.[index]
    if (item) {
      const t = (parseFloat(String(item.qty)) || 0) * (parseFloat(String(item.unit_price)) || 0)
      setValue(`line_items.${index}.total`, String(Math.round(t * 100) / 100))
    }
  }

  async function onSubmit(data: FormData) {
    // Recalculate totals before submit
    const lineItems = data.line_items.map((item) => ({
      description: item.description,
      qty: parseFloat(String(item.qty)) || 0,
      unit_price: parseFloat(String(item.unit_price)) || 0,
      total: Math.round((parseFloat(String(item.qty)) || 0) * (parseFloat(String(item.unit_price)) || 0) * 100) / 100,
    }))

    const result = await createInvoice(jobId, {
      lineItems,
      taxRate: parseFloat(String(data.tax_rate)) || 0,
      notes: data.notes || null,
      dueDate: data.due_date || null,
    })

    if (result.error) {
      toast.error(result.error)
      return
    }

    toast.success('Invoice saved as draft')
    router.refresh()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Invoice</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Line items */}
          <div className="space-y-3">
            <Label>Line Items</Label>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-muted-foreground">
                    <th className="text-left py-2 pr-3 font-medium">Description</th>
                    <th className="text-right py-2 px-3 font-medium w-20">Qty</th>
                    <th className="text-right py-2 px-3 font-medium w-28">Unit Price</th>
                    <th className="text-right py-2 px-3 font-medium w-28">Total</th>
                    <th className="w-10" />
                  </tr>
                </thead>
                <tbody>
                  {fields.map((field, index) => {
                    const qty = parseFloat(String(watchedItems?.[index]?.qty)) || 0
                    const price = parseFloat(String(watchedItems?.[index]?.unit_price)) || 0
                    const rowTotal = qty * price

                    return (
                      <tr key={field.id} className="border-b border-border/50">
                        <td className="py-2 pr-3">
                          <Input
                            {...register(`line_items.${index}.description`)}
                            placeholder="Description"
                            className="h-8"
                          />
                          {errors.line_items?.[index]?.description && (
                            <p className="text-xs text-destructive mt-0.5">
                              {errors.line_items[index]?.description?.message}
                            </p>
                          )}
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            {...register(`line_items.${index}.qty`)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-right"
                            onChange={(e) => {
                              register(`line_items.${index}.qty`).onChange(e)
                              setTimeout(() => updateRowTotal(index), 0)
                            }}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            {...register(`line_items.${index}.unit_price`)}
                            type="number"
                            step="0.01"
                            min="0"
                            className="h-8 text-right"
                            onChange={(e) => {
                              register(`line_items.${index}.unit_price`).onChange(e)
                              setTimeout(() => updateRowTotal(index), 0)
                            }}
                          />
                        </td>
                        <td className="py-2 px-3 text-right font-medium tabular-nums">
                          ${rowTotal.toFixed(2)}
                        </td>
                        <td className="py-2 pl-2">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => remove(index)}
                            disabled={fields.length === 1}
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => append({ description: '', qty: '1', unit_price: '0', total: '0' })}
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Line Item
            </Button>
            {errors.line_items?.root && (
              <p className="text-sm text-destructive">{errors.line_items.root.message}</p>
            )}
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="space-y-2 w-64">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium tabular-nums">${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Tax</span>
                  <Input
                    {...register('tax_rate')}
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    className="h-7 w-20 text-right text-sm"
                  />
                  <span className="text-muted-foreground text-sm">%</span>
                </div>
                <span className="font-medium tabular-nums">${taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between font-semibold border-t border-border pt-2">
                <span>Total</span>
                <span className="tabular-nums">${total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Notes and due date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="due_date">Due Date</Label>
              <Input id="due_date" type="date" {...register('due_date')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea id="notes" rows={3} placeholder="Invoice notes or payment terms…" {...register('notes')} />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving…' : 'Save Draft'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
