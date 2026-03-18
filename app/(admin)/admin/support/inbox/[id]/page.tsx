import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { ChevronLeft } from 'lucide-react'
import { formatDateTime } from '@/lib/utils'
import { ChatThread } from './chat-thread'
import type { Metadata } from 'next'

export const metadata: Metadata = { title: 'Chat Conversation' }

export default async function ConversationPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [convResult, messagesResult, currentUserResult] = await Promise.all([
    supabase
      .from('chat_conversations')
      .select(`
        id, status, assigned_agent_id, created_at,
        profiles!chat_conversations_user_id_fkey(first_name, last_name, email),
        tenants(name)
      `)
      .eq('id', id)
      .single(),

    supabase
      .from('chat_messages')
      .select('id, body, sender_role, created_at, sender_id')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true }),

    supabase.auth.getUser(),
  ])

  if (!convResult.data) notFound()

  const conv = convResult.data
  const userProfile = conv.profiles as { first_name: string | null; last_name: string | null; email: string } | null
  const tenant = conv.tenants as { name: string } | null
  const displayName = userProfile
    ? [userProfile.first_name, userProfile.last_name].filter(Boolean).join(' ') || userProfile.email
    : '—'

  const messages = (messagesResult.data ?? []).map(m => ({
    id: m.id,
    body: m.body,
    sender_role: m.sender_role as 'user' | 'agent',
    created_at: m.created_at,
    sender_id: m.sender_id,
  }))

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="shrink-0 border-b border-border px-6 py-4">
        <Link
          href="/admin/support/inbox"
          className="mb-3 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Inbox
        </Link>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-bold text-lg">{displayName}</h1>
            <p className="text-sm text-muted-foreground">
              {tenant?.name ?? '—'} · {userProfile?.email ?? ''} · Started {formatDateTime(conv.created_at)}
            </p>
          </div>
        </div>
      </div>

      {/* Real-time chat thread */}
      <ChatThread
        conversationId={id}
        initialMessages={messages}
        initialStatus={conv.status as 'open' | 'active' | 'closed'}
        assignedAgentId={conv.assigned_agent_id}
        currentUserId={currentUserResult.data.user?.id ?? ''}
      />
    </div>
  )
}
