'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { getOrCreateConversation, sendMessage, markRead } from '@/lib/actions/chat-actions'
import { Button } from '@/components/ui/button'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { RealtimeChannel } from '@supabase/supabase-js'

interface ChatMessage {
  id: string
  sender_role: 'user' | 'agent'
  body: string
  created_at: string
}

interface ChatWidgetProps {
  userId: string
  userEmail: string
  userName: string
}

export function ChatWidget({ userId, userEmail, userName }: ChatWidgetProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const [open, setOpen] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isAgentTyping, setIsAgentTyping] = useState(false)
  const [unread, setUnread] = useState(0)
  const [isPending, startTransition] = useTransition()

  const channelRef = useRef<RealtimeChannel | null>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const typingBroadcastRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // ─── Track unread when widget is closed ──────────────────────────────────
  useEffect(() => {
    if (open) return

    // Initial unread count
    supabase
      .from('chat_conversations')
      .select('unread_by_user')
      .eq('user_id', userId)
      .in('status', ['open', 'active'])
      .then(({ data }) => {
        setUnread(data?.reduce((s, c) => s + (c.unread_by_user ?? 0), 0) ?? 0)
      })

    const channel = supabase
      .channel(`chat:unread:${userId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'chat_conversations', filter: `user_id=eq.${userId}` },
        payload => { setUnread(payload.new.unread_by_user ?? 0) },
      )
      .subscribe()

    return () => { void channel.unsubscribe() }
  }, [open, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Initialize conversation + Realtime when widget opens ────────────────
  useEffect(() => {
    if (!open) return

    let alive = true
    setIsLoading(true)

    async function initialize() {
      const result = await getOrCreateConversation()
      if (!alive || result.error || !result.data) { setIsLoading(false); return }

      const convId = result.data.id
      setConversationId(convId)

      // Load history
      const { data: msgs } = await supabase
        .from('chat_messages')
        .select('id, sender_role, body, created_at')
        .eq('conversation_id', convId)
        .order('created_at', { ascending: true })

      if (alive) {
        setMessages(msgs ?? [])
        setIsLoading(false)
        setUnread(0)
        void markRead(convId, 'user')
      }

      // Subscribe to realtime
      const channel = supabase
        .channel(`chat:${convId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'chat_messages', filter: `conversation_id=eq.${convId}` },
          payload => {
            const msg = payload.new as ChatMessage
            setMessages(prev => prev.some(m => m.id === msg.id) ? prev : [...prev, msg])
            if (msg.sender_role === 'agent') {
              void markRead(convId, 'user')
            }
          },
        )
        .on('broadcast', { event: 'typing' }, ({ payload }) => {
          if (payload.role === 'agent') {
            setIsAgentTyping(true)
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
            typingTimeoutRef.current = setTimeout(() => setIsAgentTyping(false), 2500)
          }
        })
        .subscribe()

      channelRef.current = channel
    }

    void initialize()

    return () => {
      alive = false
      channelRef.current?.unsubscribe()
      channelRef.current = null
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      if (typingBroadcastRef.current) clearTimeout(typingBroadcastRef.current)
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Scroll to bottom ────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isAgentTyping])

  // ─── Handlers ────────────────────────────────────────────────────────────
  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)

    // Throttle typing broadcasts — send at most once per second
    if (!conversationId || !channelRef.current || typingBroadcastRef.current) return
    void channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { role: 'user' } })
    typingBroadcastRef.current = setTimeout(() => { typingBroadcastRef.current = null }, 1000)
  }

  function handleSend() {
    if (!conversationId || !input.trim() || isPending) return
    const body = input.trim()
    setInput('')

    // Optimistic message
    const optimisticId = `opt-${Date.now()}`
    setMessages(prev => [...prev, { id: optimisticId, sender_role: 'user', body, created_at: new Date().toISOString() }])

    startTransition(async () => {
      const result = await sendMessage(conversationId, body)
      if (result?.error) {
        // Roll back optimistic on failure
        setMessages(prev => prev.filter(m => m.id !== optimisticId))
        setInput(body)
      }
    })
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  if (pathname.startsWith('/jobs/map')) return null

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="Chat with support"
        className="fixed bottom-6 right-6 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg hover:bg-black/80 transition-colors"
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircle className="h-5 w-5" />}
        {!open && unread > 0 && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div
          className="fixed bottom-[4.5rem] right-6 z-50 flex w-80 flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl sm:w-96"
          style={{ height: 480 }}
        >
          {/* Header */}
          <div className="flex shrink-0 items-center gap-3 bg-black px-4 py-3 text-white">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/20">
              <MessageCircle className="h-4 w-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">Support Chat</p>
              <p className="text-xs text-white/60">We typically reply in minutes</p>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="shrink-0 rounded p-1 text-white/60 hover:text-white transition-colors"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 space-y-2.5 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex h-full items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground">
                <MessageCircle className="h-8 w-8 opacity-20" />
                <p className="text-sm">Hi {userName.split(' ')[0] || 'there'}! Send a message and a support agent will reply shortly.</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={cn('flex', msg.sender_role === 'user' ? 'justify-end' : 'justify-start')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3 py-2 text-sm leading-relaxed',
                      msg.sender_role === 'user'
                        ? 'rounded-br-sm bg-black text-white'
                        : 'rounded-bl-sm bg-muted text-foreground',
                    )}
                  >
                    {msg.body}
                  </div>
                </div>
              ))
            )}

            {/* Typing indicator */}
            {isAgentTyping && (
              <div className="flex justify-start">
                <div className="flex gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground/50" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border p-3">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className={cn(
                  'max-h-24 flex-1 resize-none overflow-y-auto rounded-lg border border-input bg-background px-3 py-2 text-sm',
                  'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring',
                )}
              />
              <Button
                size="icon"
                onClick={handleSend}
                disabled={!input.trim() || isPending}
                className="h-9 w-9 shrink-0"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="mt-1.5 text-[10px] text-muted-foreground">Enter to send · Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </>
  )
}
