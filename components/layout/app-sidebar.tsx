'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Briefcase, Users, Wrench,
  MapPin, Map, Settings, LogOut, BarChart3, CalendarDays,
} from 'lucide-react'
import { FieldpieceLogo } from './fieldpiece-logo'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/jobs',       label: 'Jobs',        icon: Briefcase },
  { href: '/schedule',   label: 'Schedule',    icon: CalendarDays },
  { href: '/jobs/map',   label: 'Job Map',     icon: Map },
  { href: '/customers',  label: 'Customers',   icon: MapPin },
  { href: '/equipment',  label: 'Equipment',   icon: Wrench },
  { href: '/team',       label: 'Team',        icon: Users },
  { href: '/settings',   label: 'Settings',    icon: Settings },
]

interface AppSidebarProps {
  companyName?: string
  onSignOut?: () => void
}

export function AppSidebar({ companyName, onSignOut }: AppSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/jobs') return pathname === '/jobs' || (pathname.startsWith('/jobs/') && !pathname.startsWith('/jobs/map'))
    if (href === '/schedule') return pathname === '/schedule' || pathname.startsWith('/schedule/')
    return pathname.startsWith(href)
  }

  return (
    <aside className="hidden md:flex w-64 flex-col bg-black text-white border-r border-border shrink-0 h-full">
      <div className="p-4 border-b border-white/10">
        <FieldpieceLogo size="sm" showTagline variant="light" />
        {companyName && (
          <p className="text-xs text-white/60 mt-2 truncate">{companyName}</p>
        )}
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-sm font-medium',
              isActive(href)
                ? 'bg-primary text-primary-foreground'
                : 'text-white/80 hover:bg-white/10 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {label}
          </Link>
        ))}
      </nav>

      {onSignOut && (
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg w-full text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign out
          </button>
        </div>
      )}
    </aside>
  )
}
