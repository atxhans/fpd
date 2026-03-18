/**
 * POST /api/weather/backfill
 *
 * Backfills weather_snapshot for jobs that don't have one yet.
 * Protected by CRON_SECRET (same as other cron routes) or platform-admin session.
 *
 * Query params:
 *   limit   – max jobs to process per call (default 20)
 *   job_id  – process a single job by ID
 */

import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { geocodeCityState, fetchWeatherForDate } from '@/lib/openweather'

export async function POST(req: NextRequest) {
  // Auth: cron secret or platform admin session
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET
  const validCron = cronSecret && authHeader === `Bearer ${cronSecret}`

  if (!validCron) {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_platform_user, platform_role')
      .eq('id', user.id)
      .single()
    if (!profile?.is_platform_user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  const supabase = await createClient()
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') ?? '20'), 100)
  const singleJobId = url.searchParams.get('job_id')

  // Fetch jobs to process
  let query = supabase
    .from('jobs')
    .select('id, site_id, scheduled_at, sites(city, state, latitude, longitude)')
    .is('weather_snapshot', null)
    .not('site_id', 'is', null)

  if (singleJobId) {
    query = query.eq('id', singleJobId)
  } else {
    query = query.limit(limit)
  }

  const { data: jobs, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!jobs?.length) return NextResponse.json({ processed: 0, message: 'No jobs to backfill' })

  let processed = 0
  let failed = 0
  const siteCoordCache: Record<string, { lat: number; lon: number }> = {}

  for (const job of jobs) {
    try {
      const site = job.sites as unknown as { city: string; state: string; latitude: number | null; longitude: number | null } | null
      if (!site) { failed++; continue }

      let lat = site.latitude
      let lon = site.longitude

      // Geocode if missing (cache per site_id to avoid duplicate API calls)
      if (!lat || !lon) {
        const cacheKey = `${site.city},${site.state}`
        if (siteCoordCache[cacheKey]) {
          ;({ lat, lon } = siteCoordCache[cacheKey])
        } else {
          const coords = await geocodeCityState(site.city, site.state)
          if (!coords) { failed++; continue }
          lat = coords.lat
          lon = coords.lon
          siteCoordCache[cacheKey] = coords
          // Save to DB for future use
          await supabase.from('sites').update({ latitude: lat, longitude: lon }).eq('id', job.site_id)
        }
      }

      const date = job.scheduled_at ? new Date(job.scheduled_at) : new Date()
      const weather = await fetchWeatherForDate(lat!, lon!, date)
      if (!weather) { failed++; continue }

      await supabase.from('jobs').update({ weather_snapshot: weather }).eq('id', job.id)
      processed++

      // Small delay to respect API rate limits
      await new Promise(r => setTimeout(r, 200))
    } catch {
      failed++
    }
  }

  return NextResponse.json({ processed, failed, total: jobs.length })
}
