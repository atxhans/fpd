import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { AppSidebar } from '@/components/layout/app-sidebar'
import { AppTopNav } from '@/components/layout/app-top-nav'
import { HelpWidget } from '@/components/support/help-widget'
import type { Profile } from '@/types/user'

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  // Fetch profile and tenant
  const [profileResult, membershipResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    supabase.from('memberships')
      .select('*, tenants(name)')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single(),
  ])

  const profile = profileResult.data
  const membership = membershipResult.data
  const tenant = membership?.tenants as { name: string } | null

  // Platform admins with no tenant membership belong in the admin console
  if (!membership) {
    const isPlatformUser = (profile as Record<string, unknown> | null)?.is_platform_user
    redirect(isPlatformUser ? '/admin/platform' : '/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <AppSidebar companyName={tenant?.name} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppTopNav profile={profile as unknown as Profile} />
        <main className="flex-1 overflow-y-auto bg-background">
          {children}
        </main>
      </div>
      <HelpWidget
        userEmail={profile?.email ?? ''}
        userName={[profile?.first_name, profile?.last_name].filter(Boolean).join(' ')}
      />
    </div>
  )
}
