/**
 * OpenWeather API client
 *
 * Uses:
 *  - Geocoding API (free): city/state → lat/lon
 *  - Current Weather API (free): lat/lon → current conditions
 *  - One Call 3.0 Historical (paid, ~$0.0015/call): lat/lon + unix timestamp → past conditions
 */

const API_KEY = process.env.OPENWEATHER_API_KEY

export type WeatherSnapshot = {
  temp_f: number
  feels_like_f: number
  humidity: number
  conditions: string    // "Clear", "Clouds", "Rain", etc.
  description: string   // "clear sky", "few clouds", etc.
  icon: string          // "01d", "02d", etc.
  wind_mph: number
  fetched_at: string    // ISO timestamp
}

// ─── Geocoding ──────────────────────────────────────────────────────────────

export async function geocodeCityState(
  city: string,
  state: string,
): Promise<{ lat: number; lon: number } | null> {
  if (!API_KEY) return null
  try {
    const q = encodeURIComponent(`${city},${state},US`)
    const res = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${q}&limit=1&appid=${API_KEY}`,
      { next: { revalidate: 86400 } }, // cache 24h — coordinates don't change
    )
    if (!res.ok) return null
    const data = await res.json() as { lat: number; lon: number }[]
    if (!data.length) return null
    return { lat: data[0].lat, lon: data[0].lon }
  } catch {
    return null
  }
}

// ─── Current weather ────────────────────────────────────────────────────────

export async function fetchCurrentWeather(
  lat: number,
  lon: number,
): Promise<WeatherSnapshot | null> {
  if (!API_KEY) return null
  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const d = await res.json() as {
      main: { temp: number; feels_like: number; humidity: number }
      weather: { main: string; description: string; icon: string }[]
      wind: { speed: number }
    }
    return {
      temp_f: Math.round(d.main.temp),
      feels_like_f: Math.round(d.main.feels_like),
      humidity: d.main.humidity,
      conditions: d.weather[0]?.main ?? 'Unknown',
      description: d.weather[0]?.description ?? '',
      icon: d.weather[0]?.icon ?? '01d',
      wind_mph: Math.round(d.wind.speed),
      fetched_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ─── Historical weather (One Call 3.0) ──────────────────────────────────────

export async function fetchHistoricalWeather(
  lat: number,
  lon: number,
  date: Date,
): Promise<WeatherSnapshot | null> {
  if (!API_KEY) return null
  try {
    const dt = Math.floor(date.getTime() / 1000)
    const res = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall/timemachine?lat=${lat}&lon=${lon}&dt=${dt}&appid=${API_KEY}&units=imperial`,
      { cache: 'no-store' },
    )
    if (!res.ok) return null
    const d = await res.json() as {
      data: {
        temp: number
        feels_like: number
        humidity: number
        weather: { main: string; description: string; icon: string }[]
        wind_speed: number
      }[]
    }
    const h = d.data?.[0]
    if (!h) return null
    return {
      temp_f: Math.round(h.temp),
      feels_like_f: Math.round(h.feels_like),
      humidity: h.humidity,
      conditions: h.weather[0]?.main ?? 'Unknown',
      description: h.weather[0]?.description ?? '',
      icon: h.weather[0]?.icon ?? '01d',
      wind_mph: Math.round(h.wind_speed),
      fetched_at: new Date().toISOString(),
    }
  } catch {
    return null
  }
}

// ─── Smart fetch (historical vs current) ────────────────────────────────────

/**
 * Fetches weather for a given date at a location.
 * Uses historical API for past dates, current API for today/future.
 * Returns null silently on failure — weather is non-critical.
 */
export async function fetchWeatherForDate(
  lat: number,
  lon: number,
  date: Date,
): Promise<WeatherSnapshot | null> {
  const now = new Date()
  const ageMs = now.getTime() - date.getTime()
  const oneDayMs = 24 * 60 * 60 * 1000

  if (ageMs < oneDayMs) {
    // Within 24h — use current weather
    return fetchCurrentWeather(lat, lon)
  }
  return fetchHistoricalWeather(lat, lon, date)
}

// ─── Weather icon → emoji ────────────────────────────────────────────────────

export function weatherEmoji(icon: string): string {
  const code = icon.slice(0, 2)
  const map: Record<string, string> = {
    '01': '☀️',
    '02': '🌤️',
    '03': '⛅',
    '04': '🌥️',
    '09': '🌧️',
    '10': '🌦️',
    '11': '⛈️',
    '13': '❄️',
    '50': '🌫️',
  }
  return map[code] ?? '🌡️'
}
