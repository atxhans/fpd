'use client'

import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// Dynamic import to disable SSR for Leaflet
const MapView = dynamic(() => import('./map-view'), { ssr: false, loading: () => (
  <div className="w-full h-full flex items-center justify-center bg-muted rounded-lg">
    <p className="text-muted-foreground text-sm">Loading map…</p>
  </div>
)})

type Customer = {
  id: string
  name: string
  email: string | null
  phone: string | null
} | null

type Site = {
  id: string
  address_line1: string
  address_line2: string | null
  city: string
  state: string
  zip: string
  latitude: number | null
  longitude: number | null
} | null

export type MapJob = {
  id: string
  job_number: string
  status: string
  scheduled_at: string | null
  notes: string | null
  customers: Customer | Customer[]
  sites: Site | Site[]
}

interface JobsMapProps {
  jobs: MapJob[]
  selectedDate: string
}

export function JobsMap({ jobs, selectedDate }: JobsMapProps) {
  const router = useRouter()
  const [date, setDate] = useState(selectedDate)

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newDate = e.target.value
    setDate(newDate)
    router.push(`/jobs/map?date=${newDate}`)
  }

  return (
    <div className="flex flex-col gap-3 h-full">
      <div className="flex items-center gap-3">
        <Label htmlFor="map-date" className="shrink-0">Date</Label>
        <Input
          id="map-date"
          type="date"
          value={date}
          onChange={handleDateChange}
          className="w-44"
        />
        <span className="text-sm text-muted-foreground">{jobs.length} job{jobs.length !== 1 ? 's' : ''} scheduled</span>
      </div>

      <div className="flex-1 min-h-0 rounded-lg overflow-hidden border border-border">
        <MapView jobs={jobs} />
      </div>
    </div>
  )
}
