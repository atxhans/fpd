import { Droplets, Thermometer, Wind } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WeatherIcon } from './weather-icon'
import type { WeatherSnapshot } from '@/lib/openweather'

interface WeatherBadgeProps {
  snapshot: WeatherSnapshot
  /** compact: icon + temp + description on one line (cards/chips)
   *  full: large icon + temp + detail row (job detail card) */
  variant?: 'compact' | 'full'
  className?: string
}

export function WeatherBadge({ snapshot, variant = 'compact', className }: WeatherBadgeProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-1.5', className)}>
        <WeatherIcon icon={snapshot.icon} size="sm" />
        <span className="text-xs font-semibold tabular-nums">{snapshot.temp_f}°F</span>
        <span className="text-xs text-muted-foreground capitalize">{snapshot.description}</span>
      </div>
    )
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-3">
        <WeatherIcon icon={snapshot.icon} size="lg" />
        <div>
          <p className="text-3xl font-bold tabular-nums leading-none">{snapshot.temp_f}°F</p>
          <p className="text-sm text-muted-foreground capitalize mt-1">{snapshot.description}</p>
        </div>
      </div>
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Thermometer className="h-3 w-3 shrink-0" />
          Feels {snapshot.feels_like_f}°
        </span>
        <span className="flex items-center gap-1">
          <Droplets className="h-3 w-3 shrink-0" />
          {snapshot.humidity}% humidity
        </span>
        <span className="flex items-center gap-1">
          <Wind className="h-3 w-3 shrink-0" />
          {snapshot.wind_mph} mph
        </span>
      </div>
    </div>
  )
}
