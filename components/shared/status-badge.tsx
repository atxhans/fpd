import { cn } from '@/lib/utils'

type Status =
  | 'active' | 'trial' | 'suspended' | 'cancelled'
  | 'assigned' | 'in_progress' | 'completed' | 'paused' | 'unassigned'
  | 'open' | 'in-progress' | 'resolved' | 'closed'
  | 'pending' | 'warning' | 'critical'

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  active:      { label: 'Active',      classes: 'bg-green-100 text-green-800 border border-green-200' },
  trial:       { label: 'Trial',       classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
  suspended:   { label: 'Suspended',   classes: 'bg-orange-100 text-orange-800 border border-orange-200' },
  cancelled:   { label: 'Cancelled',   classes: 'bg-red-100 text-red-800 border border-red-200' },
  assigned:    { label: 'Assigned',    classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
  in_progress: { label: 'In Progress', classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  'in-progress':{ label: 'In Progress',classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  paused:      { label: 'Paused',      classes: 'bg-orange-100 text-orange-800 border border-orange-200' },
  completed:   { label: 'Completed',   classes: 'bg-green-100 text-green-800 border border-green-200' },
  unassigned:  { label: 'Unassigned',  classes: 'bg-gray-100 text-gray-700 border border-gray-200' },
  pending:     { label: 'Pending',     classes: 'bg-gray-100 text-gray-700 border border-gray-200' },
  open:        { label: 'Open',        classes: 'bg-blue-100 text-blue-800 border border-blue-200' },
  resolved:    { label: 'Resolved',    classes: 'bg-green-100 text-green-800 border border-green-200' },
  closed:      { label: 'Closed',      classes: 'bg-gray-100 text-gray-700 border border-gray-200' },
  warning:     { label: 'Warning',     classes: 'bg-yellow-100 text-yellow-800 border border-yellow-200' },
  critical:    { label: 'Critical',    classes: 'bg-red-100 text-red-800 border border-red-200' },
}

interface StatusBadgeProps {
  status: Status | string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? { label: status, classes: 'bg-gray-100 text-gray-700 border border-gray-200' }
  return (
    <span className={cn('inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', config.classes, className)}>
      {config.label}
    </span>
  )
}
