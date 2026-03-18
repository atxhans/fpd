'use client'

import { useState, useCallback, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { Search, Loader2, Building2, User, Wrench } from 'lucide-react'
import Link from 'next/link'

interface SearchResult {
  type: 'tenant' | 'user' | 'equipment'
  id: string
  label: string
  sublabel: string
  href: string
}

export function SupportSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim() || q.length < 2) { setResults([]); return }
    setLoading(true)
    const supabase = createClient()
    // Sanitize: strip PostgREST filter syntax special chars (comma, parens, dots in or() context)
    const safeQ = q.replace(/[^a-zA-Z0-9@._\- ]/g, '')
    const term = `%${safeQ}%`

    const [tenants, users, equipment] = await Promise.all([
      supabase.from('tenants').select('id, name, status').ilike('name', term).is('deleted_at', null).limit(3),
      supabase.from('profiles').select('id, email, first_name, last_name').or(`email.ilike.${term},first_name.ilike.${term},last_name.ilike.${term}`).limit(3),
      supabase.from('equipment').select('id, manufacturer, model_number, serial_number, tenants(name)').ilike('model_number', term).is('deleted_at', null).limit(3),
    ])

    const res: SearchResult[] = [
      ...(tenants.data ?? []).map(t => ({
        type: 'tenant' as const, id: t.id,
        label: t.name, sublabel: t.status,
        href: `/admin/tenants/${t.id}`,
      })),
      ...(users.data ?? []).map(u => ({
        type: 'user' as const, id: u.id,
        label: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email,
        sublabel: u.email,
        href: `/admin/users/${u.id}`,
      })),
      ...(equipment.data ?? []).map((e: Record<string, unknown>) => {
        const tenant = e.tenants as { name: string } | null
        return {
          type: 'equipment' as const, id: e.id as string,
          label: `${e.manufacturer} ${e.model_number}`,
          sublabel: `S/N: ${e.serial_number ?? '—'} · ${tenant?.name ?? ''}`,
          href: `/equipment/${e.id}`,
        }
      }),
    ]

    setResults(res)
    setLoading(false)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value
    setQuery(v)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => doSearch(v), 300)
  }

  const ICONS = { tenant: Building2, user: User, equipment: Wrench }

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
        <Input
          className="pl-10 h-12 text-base"
          placeholder="Search tenants, users, equipment, jobs…"
          value={query}
          onChange={handleChange}
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />}
      </div>

      {results.length > 0 && (
        <Card className="absolute z-50 mt-1 w-full shadow-lg">
          <CardContent className="p-2">
            {results.map((r) => {
              const Icon = ICONS[r.type]
              return (
                <Link key={`${r.type}-${r.id}`} href={r.href}>
                  <div
                    className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => { setResults([]); setQuery('') }}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md bg-black shrink-0">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm">{r.label}</p>
                      <p className="text-xs text-muted-foreground truncate">{r.sublabel}</p>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{r.type}</span>
                  </div>
                </Link>
              )
            })}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
