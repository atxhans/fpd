export const APP_NAME = 'Fieldpiece Digital'
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://www.fieldpiecedigital.com'

export const PLATFORM_ROLES = [
  'platform_super_admin',
  'platform_support_admin',
  'platform_support_agent',
] as const

export const TENANT_ROLES = [
  'company_admin',
  'dispatcher',
  'technician',
] as const

export const ALL_ROLES = [...PLATFORM_ROLES, ...TENANT_ROLES] as const

export const JOB_STATUSES = [
  'unassigned',
  'assigned',
  'in_progress',
  'paused',
  'completed',
  'cancelled',
] as const

export const SERVICE_CATEGORIES = [
  { value: 'maintenance',  label: 'Preventive Maintenance' },
  { value: 'repair',       label: 'Repair' },
  { value: 'installation', label: 'Installation' },
  { value: 'inspection',   label: 'Inspection' },
  { value: 'emergency',    label: 'Emergency' },
  { value: 'warranty',     label: 'Warranty' },
  { value: 'estimate',     label: 'Estimate' },
  { value: 'other',        label: 'Other' },
] as const

export const EQUIPMENT_TYPES = [
  { value: 'split_ac',      label: 'Split AC' },
  { value: 'heat_pump',     label: 'Heat Pump' },
  { value: 'package_unit',  label: 'Package Unit' },
  { value: 'mini_split',    label: 'Mini Split' },
  { value: 'furnace',       label: 'Furnace' },
  { value: 'boiler',        label: 'Boiler' },
  { value: 'chiller',       label: 'Chiller' },
  { value: 'air_handler',   label: 'Air Handler' },
  { value: 'condenser',     label: 'Condenser' },
  { value: 'rooftop_unit',  label: 'Rooftop Unit (RTU)' },
  { value: 'other',         label: 'Other' },
] as const

export const REFRIGERANT_TYPES = [
  'R-410A', 'R-22', 'R-32', 'R-454B', 'R-407C', 'R-134a', 'R-404A', 'Other'
] as const

export const AUDIT_ACTIONS = {
  TENANT_CREATED:        'tenant.created',
  TENANT_UPDATED:        'tenant.updated',
  TENANT_SUSPENDED:      'tenant.suspended',
  USER_INVITED:          'user.invited',
  USER_DEACTIVATED:      'user.deactivated',
  JOB_CREATED:           'job.created',
  JOB_COMPLETED:         'job.completed',
  JOB_CANCELLED:         'job.cancelled',
  READINGS_SUBMITTED:    'readings.submitted',
  IMPERSONATION_STARTED: 'impersonation.started',
  IMPERSONATION_ENDED:   'impersonation.ended',
  FEATURE_FLAG_CHANGED:  'feature_flag.changed',
  SETTINGS_CHANGED:      'settings.changed',
} as const
