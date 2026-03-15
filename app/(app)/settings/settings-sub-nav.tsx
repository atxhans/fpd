'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const SUB_NAV = [
  { href: '/settings',                 label: 'General' },
  { href: '/settings/email-templates', label: 'Email Templates' },
]

export function SettingsSubNav() {
  const pathname = usePathname()

  return (
    <div className="flex gap-1 border-b border-border">
      {SUB_NAV.map(({ href, label }) => {
        const isActive = href === '/settings'
          ? pathname === '/settings'
          : pathname.startsWith(href)
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </Link>
        )
      })}
    </div>
  )
}
