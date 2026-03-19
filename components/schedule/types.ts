export interface JobEntry {
  id: string
  job_number: string
  status: string
  priority: string
  scheduled_at: string | null
  service_category: string
  assigned_technician_id: string | null
  customer_name: string
  site_city: string
  site_state: string
  tech_first: string | null
  tech_last: string | null
}

export interface Technician {
  id: string
  name: string
}

export type ViewType = 'board' | 'day' | 'week' | 'month'

export const PRIORITY_COLORS: Record<string, string> = {
  emergency: 'bg-red-100 text-red-800 border-red-200',
  high: 'bg-orange-100 text-orange-800 border-orange-200',
  normal: 'bg-blue-100 text-blue-800 border-blue-200',
  low: 'bg-gray-100 text-gray-700 border-gray-200',
}
