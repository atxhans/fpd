import {
  Sun, Moon, CloudSun, CloudMoon, CloudDrizzle, CloudRain,
  CloudSunRain, CloudMoonRain, CloudLightning, CloudSnow, CloudFog, Cloudy, Cloud,
  type LucideProps,
} from 'lucide-react'
import { cn } from '@/lib/utils'

type SizeKey = 'xs' | 'sm' | 'md' | 'lg'

const SIZES: Record<SizeKey, { container: string; iconSize: number }> = {
  xs: { container: 'w-5 h-5',   iconSize: 10 },
  sm: { container: 'w-7 h-7',   iconSize: 14 },
  md: { container: 'w-10 h-10', iconSize: 20 },
  lg: { container: 'w-14 h-14', iconSize: 28 },
}

type IconConfig = {
  Icon: React.FC<LucideProps>
  iconColor: string
  bgColor: string
}

const ICON_MAP: Record<string, IconConfig> = {
  '01d': { Icon: Sun,           iconColor: 'text-amber-500',   bgColor: 'bg-amber-100'  },
  '01n': { Icon: Moon,          iconColor: 'text-indigo-400',  bgColor: 'bg-indigo-100' },
  '02d': { Icon: CloudSun,      iconColor: 'text-amber-500',   bgColor: 'bg-orange-50'  },
  '02n': { Icon: CloudMoon,     iconColor: 'text-slate-400',   bgColor: 'bg-slate-100'  },
  '03d': { Icon: Cloud,         iconColor: 'text-slate-400',   bgColor: 'bg-slate-100'  },
  '03n': { Icon: Cloud,         iconColor: 'text-slate-400',   bgColor: 'bg-slate-100'  },
  '04d': { Icon: Cloudy,        iconColor: 'text-slate-500',   bgColor: 'bg-slate-100'  },
  '04n': { Icon: Cloudy,        iconColor: 'text-slate-500',   bgColor: 'bg-slate-100'  },
  '09d': { Icon: CloudDrizzle,  iconColor: 'text-blue-400',    bgColor: 'bg-blue-100'   },
  '09n': { Icon: CloudDrizzle,  iconColor: 'text-blue-400',    bgColor: 'bg-blue-100'   },
  '10d': { Icon: CloudSunRain,  iconColor: 'text-blue-500',    bgColor: 'bg-blue-100'   },
  '10n': { Icon: CloudMoonRain, iconColor: 'text-blue-500',    bgColor: 'bg-blue-100'   },
  '11d': { Icon: CloudLightning,iconColor: 'text-yellow-500',  bgColor: 'bg-yellow-100' },
  '11n': { Icon: CloudLightning,iconColor: 'text-yellow-400',  bgColor: 'bg-yellow-100' },
  '13d': { Icon: CloudSnow,     iconColor: 'text-sky-400',     bgColor: 'bg-sky-100'    },
  '13n': { Icon: CloudSnow,     iconColor: 'text-sky-400',     bgColor: 'bg-sky-100'    },
  '50d': { Icon: CloudFog,      iconColor: 'text-gray-400',    bgColor: 'bg-gray-100'   },
  '50n': { Icon: CloudFog,      iconColor: 'text-gray-400',    bgColor: 'bg-gray-100'   },
}

const FALLBACK: IconConfig = { Icon: Sun, iconColor: 'text-amber-500', bgColor: 'bg-amber-100' }

interface WeatherIconProps {
  /** OpenWeather icon code, e.g. "01d", "10n" */
  icon: string
  size?: SizeKey
  className?: string
  /** Render the icon without the colored background bubble */
  bare?: boolean
}

export function WeatherIcon({ icon, size = 'md', className, bare = false }: WeatherIconProps) {
  const cfg = ICON_MAP[icon] ?? FALLBACK
  const { container, iconSize } = SIZES[size]

  if (bare) {
    return (
      <cfg.Icon size={iconSize} strokeWidth={1.75} className={cn(cfg.iconColor, className)} />
    )
  }

  return (
    <span
      className={cn(
        'inline-flex items-center justify-center rounded-full shrink-0',
        container,
        cfg.bgColor,
        className,
      )}
    >
      <cfg.Icon size={iconSize} strokeWidth={1.75} className={cfg.iconColor} />
    </span>
  )
}
