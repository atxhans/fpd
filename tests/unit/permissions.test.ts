import { describe, it, expect } from 'vitest'
import {
  hasRole, roleLevel, isPlatformUser, isSuperAdmin, isSupportAdmin,
  isCompanyAdmin, canImpersonate, canManageTenant, canViewAllTenants,
  type PermissionContext,
} from '@/lib/auth/permissions'
import type { Profile, Membership } from '@/types/user'

function makeProfile(overrides: Partial<Profile> = {}): Profile {
  return {
    id: 'test-id',
    email: 'test@example.com',
    first_name: null,
    last_name: null,
    phone: null,
    avatar_url: null,
    is_platform_user: false,
    platform_role: null,
    is_active: true,
    last_sign_in_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }
}

function makeCtx(profileOverrides: Partial<Profile> = {}, membershipOverrides: Partial<Membership> = {}): PermissionContext {
  return {
    profile: makeProfile(profileOverrides),
    membership: {
      id: 'mem-id',
      tenant_id: 'tenant-id',
      user_id: 'test-id',
      role: 'technician',
      is_active: true,
      invited_by: null,
      accepted_at: null,
      created_at: new Date().toISOString(),
      ...membershipOverrides,
    },
  }
}

describe('Role hierarchy', () => {
  it('technician has lowest level', () => {
    expect(roleLevel('technician')).toBe(0)
  })

  it('super admin has highest level', () => {
    expect(roleLevel('platform_super_admin')).toBeGreaterThan(roleLevel('company_admin'))
  })

  it('company_admin has higher level than dispatcher', () => {
    expect(hasRole('company_admin', 'dispatcher')).toBe(true)
  })

  it('technician does not satisfy company_admin requirement', () => {
    expect(hasRole('technician', 'company_admin')).toBe(false)
  })
})

describe('Permission checks', () => {
  it('identifies platform users', () => {
    const ctx = makeCtx({ is_platform_user: true })
    expect(isPlatformUser(ctx)).toBe(true)
  })

  it('non-platform users are not platform users', () => {
    const ctx = makeCtx()
    expect(isPlatformUser(ctx)).toBe(false)
  })

  it('super admin can impersonate', () => {
    const ctx = makeCtx({ is_platform_user: true, platform_role: 'platform_super_admin' })
    expect(canImpersonate(ctx)).toBe(true)
  })

  it('support admin can impersonate', () => {
    const ctx = makeCtx({ is_platform_user: true, platform_role: 'platform_support_admin' })
    expect(canImpersonate(ctx)).toBe(true)
  })

  it('technician cannot impersonate', () => {
    const ctx = makeCtx()
    expect(canImpersonate(ctx)).toBe(false)
  })

  it('company admin cannot manage tenants', () => {
    const ctx = makeCtx({}, { role: 'company_admin' })
    expect(canManageTenant(ctx)).toBe(false)
  })

  it('platform user can manage tenants', () => {
    const ctx = makeCtx({ is_platform_user: true, platform_role: 'platform_super_admin' })
    expect(canManageTenant(ctx)).toBe(true)
  })

  it('platform user can view all tenants', () => {
    const ctx = makeCtx({ is_platform_user: true, platform_role: 'platform_support_admin' })
    expect(canViewAllTenants(ctx)).toBe(true)
  })

  it('company admin cannot view all tenants', () => {
    const ctx = makeCtx({}, { role: 'company_admin' })
    expect(canViewAllTenants(ctx)).toBe(false)
  })

  it('company admin can be identified', () => {
    const ctx = makeCtx({}, { role: 'company_admin' })
    expect(isCompanyAdmin(ctx)).toBe(true)
  })
})
