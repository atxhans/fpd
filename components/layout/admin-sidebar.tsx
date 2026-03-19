'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Building2, HeadphonesIcon, FileText,
  Flag, Settings, Users, LogOut, Shield, Inbox, MessageCircle, BarChart2,
} from 'lucide-react'
import { FieldpieceLogo } from './fieldpiece-logo'
import { ChatInboxBadge } from './chat-inbox-badge'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/admin/platform',         label: 'Platform Dashboard', icon: LayoutDashboard },
  { href: '/admin/analytics',        label: 'Fleet Intelligence', icon: BarChart2 },
  { href: '/admin/tenants',          label: 'HVAC Contractors',   icon: Building2 },
  { href: '/admin/users',            label: 'Users',              icon: Users },
  { href: '/admin/support/inbox',    label: 'Live Chat',          icon: MessageCircle, badge: true },
  { href: '/admin/support',          label: 'Support Console',    icon: HeadphonesIcon },
  { href: '/admin/assignment-queue', label: 'Assignment Queue',   icon: Inbox },
  { href: '/admin/impersonation',    label: 'Impersonation',      icon: Shield },
  { href: '/admin/audit-logs',       label: 'Audit Logs',         icon: FileText },
  { href: '/admin/feature-flags',    label: 'Feature Flags',      icon: Flag },
  { href: '/admin/settings',         label: 'Platform Settings',  icon: Settings },
]

interface AdminSidebarProps {
  onSignOut?: () => void
}

export function AdminSidebar({ onSignOut }: AdminSidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => pathname === href || (href !== '/admin/platform' && pathname.startsWith(href))

  return (
    <aside className="hidden md:flex w-64 flex-col bg-black text-white border-r border-border shrink-0 h-full">
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-5 w-5 text-accent" />
          <span className="font-semibold text-white">Admin Console</span>
        </div>
        <FieldpieceLogo size="sm" showTagline={false} variant="light" />
        <p className="text-xs text-white/50 mt-2">Platform Operations</p>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ href, label, icon: Icon, badge }) => (
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
            {badge && <ChatInboxBadge />}
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
