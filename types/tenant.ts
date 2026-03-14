export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled'
export type TenantPlan = 'trial' | 'starter' | 'professional' | 'business' | 'enterprise'
export type OnboardingStatus = 'pending' | 'in_progress' | 'complete'

export interface Tenant {
  id: string
  name: string
  slug: string
  status: TenantStatus
  plan: TenantPlan
  seat_limit: number | null
  contract_tier: string | null
  renewal_date: string | null
  onboarding_status: OnboardingStatus
  website: string | null
  phone: string | null
  address_line1: string | null
  city: string | null
  state: string | null
  zip: string | null
  country: string
  timezone: string
  logo_url: string | null
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export function getTenantStatusLabel(status: TenantStatus): string {
  const labels: Record<TenantStatus, string> = {
    active: 'Active',
    trial: 'Trial',
    suspended: 'Suspended',
    cancelled: 'Cancelled',
  }
  return labels[status]
}
