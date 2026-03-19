'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { US_TIMEZONES } from '@/lib/timezone'

type TZValue = typeof US_TIMEZONES[number]['value']

export async function updateTimezone(timezone: TZValue) {
  const validValues = US_TIMEZONES.map(t => t.value) as string[]
  if (!validValues.includes(timezone)) return { error: 'Invalid timezone' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { error } = await supabase
    .from('profiles')
    .update({ timezone })
    .eq('id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/settings')
  revalidatePath('/schedule')
  return { success: true }
}
