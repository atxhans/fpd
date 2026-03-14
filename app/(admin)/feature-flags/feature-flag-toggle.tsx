'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface FeatureFlagToggleProps {
  id: string
  flagKey: string
  enabled: boolean
  scope: 'global' | 'tenant'
  tenantId?: string
}

export function FeatureFlagToggle({ id, flagKey, enabled, scope }: FeatureFlagToggleProps) {
  const [value, setValue] = useState(enabled)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function toggle(newValue: boolean) {
    setLoading(true)
    setValue(newValue)
    const supabase = createClient()
    const { error } = scope === 'global'
      ? await supabase.from('platform_feature_flags').update({ enabled: newValue }).eq('id', id)
      : await supabase.from('tenant_feature_flags').update({ enabled: newValue }).eq('id', id)
    setLoading(false)
    if (error) {
      setValue(!newValue)
      toast.error(error.message)
      return
    }

    // Audit log
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('audit_logs').insert({
        actor_id: user.id,
        action: 'feature_flag.changed',
        resource_type: 'feature_flag',
        resource_label: flagKey,
        metadata: { flag: flagKey, from: !newValue, to: newValue, scope },
      })
    }

    toast.success(`${flagKey} ${newValue ? 'enabled' : 'disabled'}`)
    router.refresh()
  }

  return (
    <Switch
      checked={value}
      onCheckedChange={toggle}
      disabled={loading}
    />
  )
}
