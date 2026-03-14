export type UserRole =
  | 'platform_super_admin'
  | 'platform_support_admin'
  | 'platform_support_agent'
  | 'company_admin'
  | 'dispatcher'
  | 'technician'

export interface Profile {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  avatar_url: string | null
  is_platform_user: boolean
  platform_role: UserRole | null
  is_active: boolean
  last_sign_in_at: string | null
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  tenant_id: string
  user_id: string
  role: UserRole
  is_active: boolean
  invited_by: string | null
  accepted_at: string | null
  created_at: string
}

export function getDisplayName(profile: Partial<Profile> | null): string {
  if (!profile) return 'Unknown'
  if (profile.first_name || profile.last_name) {
    return [profile.first_name, profile.last_name].filter(Boolean).join(' ')
  }
  return profile.email ?? 'Unknown'
}

export function getRoleLabel(role: UserRole): string {
  const labels: Record<UserRole, string> = {
    platform_super_admin: 'Super Admin',
    platform_support_admin: 'Support Admin',
    platform_support_agent: 'Support Agent',
    company_admin: 'Company Admin',
    dispatcher: 'Dispatcher',
    technician: 'Technician',
  }
  return labels[role] ?? role
}
