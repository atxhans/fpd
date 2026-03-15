'use client'

import { useEffect, useRef, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { MapJob } from './jobs-map'

// Fix Leaflet default marker icons
const markerIcon = new L.Icon({
  iconUrl:       '/leaflet/marker-icon.png',
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  shadowUrl:     '/leaflet/marker-shadow.png',
  iconSize:     [25, 41],
  iconAnchor:   [12, 41],
  popupAnchor:  [1, -34],
  shadowSize:   [41, 41],
})

// Austin, TX as fallback center
const DEFAULT_CENTER: [number, number] = [30.2672, -97.7431]
const DEFAULT_ZOOM = 11

type GeocodedJob = MapJob & { lat: number; lng: number; resolvedAddress: string }

function getSite(job: MapJob): SiteRow | null {
  const s = Array.isArray(job.sites) ? job.sites[0] : job.sites
  return s as SiteRow | null
}

type SiteRow = { address_line1: string; address_line2: string | null; city: string; state: string; zip: string; latitude: number | null; longitude: number | null }

function buildAddress(site: SiteRow): string {
  return [site.address_line1, site.address_line2, site.city, site.state, site.zip].filter(Boolean).join(', ')
}

async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const encoded = encodeURIComponent(address)
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encoded}&limit=1`,
      { headers: { 'Accept-Language': 'en' } }
    )
    const data = await res.json()
    if (!data[0]) return null
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
  } catch {
    return null
  }
}

function FitBounds({ positions }: { positions: [number, number][] }) {
  const map = useMap()
  useEffect(() => {
    if (positions.length === 0) return
    if (positions.length === 1) {
      map.setView(positions[0], 14)
    } else {
      map.fitBounds(positions, { padding: [40, 40] })
    }
  }, [map, positions])
  return null
}

const STATUS_COLORS: Record<string, string> = {
  assigned:    'bg-blue-100 text-blue-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  paused:      'bg-orange-100 text-orange-800',
  completed:   'bg-green-100 text-green-800',
  cancelled:   'bg-red-100 text-red-800',
}

export default function MapView({ jobs }: { jobs: MapJob[] }) {
  const [geocoded, setGeocoded] = useState<GeocodedJob[]>([])
  const [loading, setLoading] = useState(true)
  const geocodedRef = useRef<Set<string>>(new Set())

  useEffect(() => {
    if (jobs.length === 0) { setLoading(false); return }

    let cancelled = false
    setLoading(true)

    async function run() {
      const results: GeocodedJob[] = []
      for (const job of jobs) {
        const site = getSite(job)
        if (!site) continue

        // Use pre-computed lat/lng if available — skip geocoding
        if (site.latitude != null && site.longitude != null) {
          geocodedRef.current.add(job.id)
          const address = buildAddress(site) ?? ''
          results.push({ ...job, lat: site.latitude, lng: site.longitude, resolvedAddress: address })
          continue
        }

        const address = buildAddress(site)
        if (!address) continue

        // Rate-limit Nominatim to 1 req/sec
        await new Promise(r => setTimeout(r, 1000))
        if (cancelled) return
        if (geocodedRef.current.has(job.id)) continue

        const coords = await geocodeAddress(address)
        if (coords) {
          geocodedRef.current.add(job.id)
          results.push({ ...job, ...coords, resolvedAddress: address })
        }
      }
      if (!cancelled) setGeocoded(results)
      setLoading(false)
    }

    run()
    return () => { cancelled = true }
  }, [jobs])

  const positions = geocoded.map(j => [j.lat, j.lng] as [number, number])

  return (
    <div className="relative w-full h-full min-h-[400px]">
      {loading && jobs.length > 0 && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 rounded-md px-3 py-1 text-sm shadow">
          Loading job locations…
        </div>
      )}

      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        className="w-full h-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <FitBounds positions={positions} />

        {geocoded.map(job => {
          const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers

          return (
            <Marker key={job.id} position={[job.lat, job.lng]} icon={markerIcon}>
              <Popup minWidth={240}>
                <div className="space-y-2 py-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">#{job.job_number}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[job.status] ?? 'bg-gray-100 text-gray-700'}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                  </div>

                  {customer && (
                    <div>
                      <p className="font-medium text-sm">{customer.name}</p>
                      {customer.phone && <p className="text-xs text-gray-600">{customer.phone}</p>}
                      {customer.email && <p className="text-xs text-gray-600">{customer.email}</p>}
                    </div>
                  )}

                  <p className="text-xs text-gray-700">{job.resolvedAddress}</p>

                  {job.scheduled_at && (
                    <p className="text-xs text-gray-500">
                      {new Date(job.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  )}

                  {job.notes && (
                    <p className="text-xs text-gray-600 border-t pt-1">{job.notes}</p>
                  )}

                  <a
                    href={`/jobs/${job.id}`}
                    className="block text-xs text-blue-600 hover:underline pt-1"
                  >
                    View job →
                  </a>
                </div>
              </Popup>
            </Marker>
          )
        })}
      </MapContainer>

      {!loading && geocoded.length === 0 && jobs.length > 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
          <div className="bg-white/90 rounded-md px-4 py-3 text-sm text-muted-foreground shadow">
            No site addresses found for these jobs.
          </div>
        </div>
      )}

      {!loading && jobs.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-[500]">
          <div className="bg-white/90 rounded-md px-4 py-3 text-sm text-muted-foreground shadow">
            No jobs scheduled for this date.
          </div>
        </div>
      )}
    </div>
  )
}
