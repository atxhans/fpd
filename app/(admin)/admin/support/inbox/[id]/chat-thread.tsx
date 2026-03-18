'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { sendMessage, claimConversation, closeConversation, markRead } from '@/lib/actions/chat-actions'
import { Button } from '@/components/ui/button'
import { Send, UserCheck, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatMessage {
  id: string
  sender_role: 'user' | 'agent'
  body: string
  created_at: string
  sender_id: string
}

interface ChatThreadProps {
  conversationId: string
  initialMessages: ChatMessage[]
  initialStatus: 'open' | 'active' | 'closed'
  assignedAgentId: string | null
  currentUserId: string
}

export function ChatThread({
  conversationId,
  initialMessages,
  initialStatus,
  assignedAgentId,
  currentUserId,
}: ChatThreadProps) {
  const supabase = createClient()
  const router = useRouter()

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [status, setStatus] = useState(initialStatus)
  const [input, setInput] = useState('')
  const [isUserTyping, setIsUserTyping] = useState(false)
  const [isPending, startTransition] = useTransition()

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const isClaimed = !!assignedAgentId
  const isClosed = status === 'closed'

  // ─── Mark as read and subscribe on mount ──────────────────────────────
  useEffect(() => {
    void markRead(conversationId, 'agent')

    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${conversationId}` },
        payload => {
          const msg = payload.new as ChatMessage
          setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
          if (msg.sender_role === 'user') {
            void markRead(conversationId, 'agent')
          }
        },
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `id=eq.${conversationId}` },
        payload => { setStatus(payload.new.status) },
      )
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.role === 'user') {
          setIsUserTyping(true)
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
          typingTimeoutRef.current = setTimeout(() => setIsUserTyping(false), 2500)
        }
      })
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current)
    }
  }, [conversationId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scroll to bottom ─────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isUserTyping])

  // ─── Handlers ─────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)

    if (!channelRef.current || typingBroadcastRef.current) return
    void channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'agent' } })
    typingBroadcastRef.current = setTimeout(() => { typingBroadcastRef.current = null }, 1000)
  }

  function handleSend() {
    if (!input.trim() || isPending || isClosed) return
    const body = input.trim()
    setInput('')

    const optimisticId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optimisticId, sender_role: 'agent', body, created_at: new Date().toISOString(), sender_id: currentUserId }])

    startTransition(async () => {
      const result = await sendMessage(conversationId, body)
      if (result?.error) {
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setInput(body)
        toast.error('Failed to send message')
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  function handleClaim() {
    startTransition(async () => {
      const result = await claimConversation(conversationId)
      if (result?.error) { toast.error(result.error); return }
      router.refresh()
    })
  }

  function handleClose() {
    startTransition(async () => {
      const result = await closeConversation(conversationId)
      if (result?.error) { toast.error(result.error); return }
      setStatus('closed')
      toast.success('Conversation closed')
    })
  }

  // ─── Helpers ──────────────────────────────────────────────────────────
  function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      {/* Status bar */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border bg-muted/30 px-6 py-2">
        <div className="flex items-center gap-2 text-sm">
          <span className={cn(
            'h-2 w-2 rounded-full',
            status === 'active' ? 'bg-green-500' : status === 'open' ? 'bg-yellow-500' : 'bg-muted-foreground',
          )} />
          <span className="capitalize text-muted-foreground">{status}</span>
          {isClaimed && assignedAgentId === currentUserId && (
            <span className="text-muted-foreground">· Assigned to you</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isClaimed && !isClosed && (
            <Button size="sm" variant="outline" onClick={handleClaim} disabled={isPending}>
              <UserCheck className="mr-1.5 h-3.5 w-3.5" />
              Claim
            </Button>
          )}
          {!isClosed && (
            <Button size="sm" variant="outline" onClick={handleClose} disabled={isPending}>
              <XCircle className="mr-1.5 h-3.5 w-3.5" />
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto p-6">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground py-12">No messages yet</p>
        ) : (
          messages.map(msg => (
            <div key={msg.id} className={cn('flex flex-col gap-0.5', msg.sender_role === 'agent' ? 'items-end' : 'items-start')}>
              <div
                className={cn(
                  'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                  msg.sender_role === 'agent'
                    ? 'rounded-br-sm bg-black text-white'
                    : 'rounded-bl-sm bg-muted text-foreground',
                )}
              >
                {msg.body}
              </div>
              <span className="text-[10px] text-muted-foreground">{formatTime(msg.created_at)}</span>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isUserTyping && (
          <div className="flex flex-col items-start gap-0.5">
            <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
              <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
            </div>
            <span className="text-[10px] text-muted-foreground">User is typing…</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="shrink-0 border-t border-border p-4">
        {isClosed ? (
          <p className="text-center text-sm text-muted-foreground">This conversation is closed.</p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Reply to user…"
              rows={1}
              disabled={isClosed}
              className={cn(
                'max-h-32 flex-1 resize-none overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm',
                'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
              )}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!input.trim() || isPending || isClosed}
              className="h-9 w-9 shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
