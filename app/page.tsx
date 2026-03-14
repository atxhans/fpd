import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function RootPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Route platform users to admin console, tenant users to dashboard
  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()

  if (profile?.is_platform_user) redirect('/admin/platform')
  redirect('/dashboard')
}
