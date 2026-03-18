import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageCircle, Clock, User } from 'lucide-react'
import { formatRelativeTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Live Chat Inbox' }

const STATUS_STYLES: Record<string, string> = {
  open:   'bg-yellow-100 text-yellow-800',
  active: 'bg-green-100  text-green-800',
  closed: 'bg-muted      text-muted-foreground',
}

export default async function ChatInboxPage() {
  const supabase = await createClient()

  const { data: conversations } = await supabase
    .from('chat_conversations')
    .select(`
      id, status, last_message_at, unread_by_agent, created_at,
      profiles!chat_conversations_user_id_fkey(first_name, last_name, email),
      tenants(name)
    `)
    .in('status', ['open', 'active'])
    .order('last_message_at', { ascending: false })

  const { data: recent } = await supabase
    .from('chat_conversations')
    .select(`
      id, status, last_message_at, created_at,
      profiles!chat_conversations_user_id_fkey(first_name, last_name, email),
      tenants(name)
    `)
    .eq('status', 'closed')
    .order('last_message_at', { ascending: false })
    .limit(20)

  return (
    <div className="p-6 space-y-8 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold">Live Chat Inbox</h1>
        <p className="text-sm text-muted-foreground mt-1">Active and open conversations from HVAC contractors</p>
      </div>

      {/* Open / Active */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Open Conversations
          {(conversations?.length ?? 0) > 0 && (
            <span className="ml-2 inline-flex h-5 items-center justify-center rounded-full bg-black px-2 text-[10px] font-bold text-white">
              {conversations!.length}
            </span>
          )}
        </h2>

        {!conversations?.length ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            <MessageCircle className="h-8 w-8 opacity-30" />
            <p className="text-sm">No open conversations</p>
          </div>
        ) : (
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {conversations.map(conv => {
              const profile = conv.profiles as { first_name: string | null; last_name: string | null; email: string } | null
              const tenant = conv.tenants as { name: string } | null
              const displayName = profile
                ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
                : '—'

              return (
                <Link
                  key={conv.id}
                  href={`/admin/support/inbox/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
                    <User className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{displayName}</span>
                      <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase', STATUS_STYLES[conv.status])}>
                        {conv.status}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{tenant?.name ?? '—'}</p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    {conv.unread_by_agent > 0 && (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {conv.unread_by_agent > 9 ? '9+' : conv.unread_by_agent}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(conv.last_message_at)}
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </section>

      {/* Recently Closed */}
      {(recent?.length ?? 0) > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Recently Closed</h2>
          <div className="divide-y divide-border rounded-xl border border-border overflow-hidden">
            {recent!.map(conv => {
              const profile = conv.profiles as { first_name: string | null; last_name: string | null; email: string } | null
              const tenant = conv.tenants as { name: string } | null
              const displayName = profile
                ? [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email
                : '—'

              return (
                <Link
                  key={conv.id}
                  href={`/admin/support/inbox/${conv.id}`}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-muted/50 transition-colors opacity-70"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-sm font-medium">{displayName}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{tenant?.name ?? '—'}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatRelativeTime(conv.last_message_at)}</span>
                </Link>
              )
            })}
          </div>
        </section>
      )}
    </div>
  )
}
