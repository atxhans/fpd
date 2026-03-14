import type { UserRole, Profile, Membership } from '@/types/user'

// =====================================================
// Role hierarchy (higher index = more permissions)
// =====================================================
const ROLE_HIERARCHY: UserRole[] = [
  'technician',
  'dispatcher',
  'company_admin',
  'platform_support_agent',
  'platform_support_admin',
  'platform_super_admin',
]

export function roleLevel(role: UserRole): number {
  return ROLE_HIERARCHY.indexOf(role)
}

export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  return roleLevel(userRole) >= roleLevel(requiredRole)
}

// =====================================================
// Context-aware permission checks
// =====================================================
export interface PermissionContext {
  profile: Profile | null
  membership: Membership | null
}

export function isPlatformUser(ctx: PermissionContext): boolean {
  return ctx.profile?.is_platform_user === true
}

export function isSuperAdmin(ctx: PermissionContext): boolean {
  return ctx.profile?.platform_role === 'platform_super_admin'
}

export function isSupportAdmin(ctx: PermissionContext): boolean {
  const role = ctx.profile?.platform_role
  return role === 'platform_support_admin' || role === 'platform_super_admin'
}

export function isCompanyAdmin(ctx: PermissionContext): boolean {
  return ctx.membership?.role === 'company_admin'
}

export function isTechnician(ctx: PermissionContext): boolean {
  return ctx.membership?.role === 'technician'
}

export function canManageTenant(ctx: PermissionContext): boolean {
  return isSuperAdmin(ctx) || isSupportAdmin(ctx)
}

export function canImpersonate(ctx: PermissionContext): boolean {
  return isSuperAdmin(ctx) || isSupportAdmin(ctx)
}

export function canManageUsers(ctx: PermissionContext): boolean {
  return isPlatformUser(ctx) || isCompanyAdmin(ctx)
}

export function canViewAuditLogs(ctx: PermissionContext): boolean {
  return isPlatformUser(ctx) || isCompanyAdmin(ctx)
}

export function canManageFeatureFlags(ctx: PermissionContext): boolean {
  return isSuperAdmin(ctx)
}

export function canViewAllTenants(ctx: PermissionContext): boolean {
  return isPlatformUser(ctx)
}

export function getEffectiveRole(ctx: PermissionContext): UserRole | null {
  if (ctx.profile?.is_platform_user && ctx.profile.platform_role) {
    return ctx.profile.platform_role as UserRole
  }
  return ctx.membership?.role ?? null
}
