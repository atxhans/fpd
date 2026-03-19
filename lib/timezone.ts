export const DEFAULT_TIMEZONE = 'America/Chicago'

export const US_TIMEZONES = [
  { value: 'America/New_York',    label: 'Eastern Time (ET)'  },
  { value: 'America/Chicago',     label: 'Central Time (CT)'  },
  { value: 'America/Denver',      label: 'Mountain Time (MT)' },
  { value: 'America/Phoenix',     label: 'Arizona (no DST)'   },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)'  },
  { value: 'America/Anchorage',   label: 'Alaska Time (AKT)'  },
  { value: 'Pacific/Honolulu',    label: 'Hawaii (HT)'        },
] as const

export type TimezoneValue = typeof US_TIMEZONES[number]['value']

/**
 * Returns today's date as YYYY-MM-DD in the given IANA timezone.
 * Use on the server instead of new Date().toISOString().split('T')[0]
 * which returns the UTC date and will be wrong for US timezones at night.
 */
export function getTodayInTimezone(timezone: string): string {
  // en-CA locale formats as YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(new Date())
}

/**
 * Converts a local date string (YYYY-MM-DD) to UTC ISO string bounds
 * representing midnight–23:59:59 in the given IANA timezone.
 *
 * Uses noon UTC as an anchor to correctly handle DST transitions.
 * Works for all North American timezones (UTC−10 to UTC−4).
 */
export function getDayBoundsUTC(
  dateStr: string,
  timezone: string,
): { start: string; end: string } {
  // Determine what time noon UTC appears as in the target timezone.
  // This gives us the UTC↔local offset for this specific date (DST-aware).
  const noonUtc = new Date(`${dateStr}T12:00:00Z`)
  const localNoon = noonUtc.toLocaleString('en-US', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const [h, m] = localNoon.split(':').map(Number)

  // offsetMinutes: how many minutes UTC is ahead of local time.
  // Example: CDT (UTC−5) → noon UTC shows as 7:00 AM → offset = 720 − 420 = 300 min
  const offsetMinutes = 12 * 60 - (h * 60 + m)

  const start = new Date(`${dateStr}T00:00:00Z`)
  start.setMinutes(start.getMinutes() + offsetMinutes)

  const end = new Date(`${dateStr}T23:59:59Z`)
  end.setMinutes(end.getMinutes() + offsetMinutes)

  return { start: start.toISOString(), end: end.toISOString() }
}
