'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Real-time unread badge for the admin sidebar Live Chat nav item.
 * Subscribes to chat_conversations updates and shows unread_by_agent total.
 */
export function ChatInboxBadge() {
  const [count, setCount] = useState(0)
  const supabase = createClient()

  useEffect(() => {
    async function fetchCount() {
      const { data } = await supabase
        .from('chat_conversations')
        .select('unread_by_agent')
        .in('status', ['open', 'active'])
      setCount(data?.reduce((s, c) => s + (c.unread_by_agent ?? 0), 0) ?? 0)
    }

    void fetchCount()

    const channel = supabase
      .channel('chat:inbox:badge')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations' },
        () => { void fetchCount() },
      )
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        () => { void fetchCount() },
      )
      .subscribe()

    return () => { void channel.unsubscribe() }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  if (!count) return null

  return (
    <span className="ml-auto flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
      {count > 9 ? '9+' : count}
    </span>
  )
}
