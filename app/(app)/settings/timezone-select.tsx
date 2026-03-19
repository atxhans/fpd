'use client'

import { useTransition } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { updateTimezone } from '@/lib/actions/profile-actions'
import { US_TIMEZONES } from '@/lib/timezone'

interface TimezoneSelectProps {
  currentTimezone: string
}

export function TimezoneSelect({ currentTimezone }: TimezoneSelectProps) {
  const [pending, startTransition] = useTransition()

  function handleChange(value: string | null) {
    if (!value) return
    startTransition(async () => {
      const result = await updateTimezone(value as typeof US_TIMEZONES[number]['value'])
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success('Timezone updated')
      }
    })
  }

  return (
    <Select defaultValue={currentTimezone} onValueChange={handleChange} disabled={pending}>
      <SelectTrigger className="w-[220px] h-7 text-sm font-medium">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {US_TIMEZONES.map((tz) => (
          <SelectItem key={tz.value} value={tz.value}>
            {tz.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
