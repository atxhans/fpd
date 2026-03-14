export type JobStatus = 'unassigned' | 'assigned' | 'in_progress' | 'paused' | 'completed' | 'cancelled'
export type JobPriority = 'low' | 'normal' | 'high' | 'emergency'
export type ServiceCategory = 'maintenance' | 'repair' | 'installation' | 'inspection' | 'emergency' | 'warranty' | 'estimate' | 'other'

export interface Job {
  id: string
  tenant_id: string
  job_number: string
  customer_id: string
  site_id: string
  assigned_technician_id: string | null
  created_by: string
  service_category: ServiceCategory
  priority: JobPriority
  problem_description: string | null
  resolution_summary: string | null
  follow_up_required: boolean
  follow_up_notes: string | null
  scheduled_at: string | null
  started_at: string | null
  completed_at: string | null
  status: JobStatus
  notes: string | null
  created_at: string
  updated_at: string
}

export function getJobStatusLabel(status: JobStatus): string {
  const labels: Record<JobStatus, string> = {
    unassigned: 'Unassigned',
    assigned: 'Assigned',
    in_progress: 'In Progress',
    paused: 'Paused',
    completed: 'Completed',
    cancelled: 'Cancelled',
  }
  return labels[status]
}

export function getJobStatusColor(status: JobStatus): string {
  const colors: Record<JobStatus, string> = {
    unassigned: 'bg-muted text-muted-foreground',
    assigned: 'bg-blue-100 text-blue-800',
    in_progress: 'bg-yellow-100 text-yellow-800',
    paused: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
  }
  return colors[status]
}

export function getPriorityColor(priority: JobPriority): string {
  const colors: Record<JobPriority, string> = {
    low: 'text-muted-foreground',
    normal: 'text-foreground',
    high: 'text-orange-600',
    emergency: 'text-red-600',
  }
  return colors[priority]
}
