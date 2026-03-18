'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { sendPushToUser } from '@/lib/push'
import { writeAudit } from '@/lib/audit'

// ─── Tenant user: get or create their open conversation ──────────────────────

export async function getOrCreateConversation() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' as const, data: null }

  const { data: membership } = await supabase
    .from('memberships')
    .select('tenant_id')
    .eq('user_id', user.id)
    .eq('is_active', true)
    .single()

  if (!membership) return { error: 'No active membership' as const, data: null }

  // Return existing open/active conversation if one exists
  const { data: existing } = await supabase
    .from('chat_conversations')
    .select('id, status')
    .eq('user_id', user.id)
    .in('status', ['open', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return { error: null, data: existing }

  // Create new conversation
  const { data: created, error } = await supabase
    .from('chat_conversations')
    .insert({ tenant_id: membership.tenant_id, user_id: user.id, status: 'open' })
    .select('id, status')
    .single()

  if (error) return { error: error.message, data: null }

  void writeAudit({
    action: 'chat.conversation_started',
    tenantId: membership.tenant_id,
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'chat_conversation',
    resourceId: created.id,
  })

  return { error: null, data: created }
}

// ─── Send a message (tenant user or agent) ───────────────────────────────────

export async function sendMessage(conversationId: string, body: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_platform_user, first_name, last_name')
    .eq('id', user.id)
    .single()

  const senderRole: 'user' | 'agent' = profile?.is_platform_user ? 'agent' : 'user'

  const { error } = await supabase.from('chat_messages').insert({
    conversation_id: conversationId,
    sender_id: user.id,
    sender_role: senderRole,
    body: body.trim(),
  })

  if (error) return { error: error.message }

  // Side effects: update conversation + send push
  const admin = await createAdminClient()
  const { data: conv } = await admin
    .from('chat_conversations')
    .select('user_id, assigned_agent_id, unread_by_user, unread_by_agent')
    .eq('id', conversationId)
    .single()

  if (conv) {
    const senderName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ')
    const preview = body.length > 80 ? body.slice(0, 80) + '…' : body

    if (senderRole === 'agent') {
      await admin.from('chat_conversations').update({
        last_message_at: new Date().toISOString(),
        status: 'active',
        unread_by_user: (conv.unread_by_user ?? 0) + 1,
      }).eq('id', conversationId)

      void sendPushToUser(conv.user_id, {
        title: `${senderName || 'Support'} replied`,
        body: preview,
        url: '/?chat=open',
      })
    } else {
      await admin.from('chat_conversations').update({
        last_message_at: new Date().toISOString(),
        unread_by_agent: (conv.unread_by_agent ?? 0) + 1,
      }).eq('id', conversationId)

      if (conv.assigned_agent_id) {
        void sendPushToUser(conv.assigned_agent_id, {
          title: `Message from ${senderName || 'User'}`,
          body: preview,
          url: `/admin/support/inbox/${conversationId}`,
        })
      }
    }
  }

  return { ok: true }
}

// ─── Mark messages as read ───────────────────────────────────────────────────

export async function markRead(conversationId: string, reader: 'user' | 'agent') {
  const admin = await createAdminClient()
  const field = reader === 'user' ? 'unread_by_user' : 'unread_by_agent'
  await admin.from('chat_conversations').update({ [field]: 0 }).eq('id', conversationId)
  return { ok: true }
}

// ─── Agent: claim a conversation ─────────────────────────────────────────────

export async function claimConversation(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const { data: profile } = await supabase
    .from('profiles').select('is_platform_user').eq('id', user.id).single()
  if (!profile?.is_platform_user) return { error: 'Unauthorized' }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('chat_conversations')
    .update({ assigned_agent_id: user.id, status: 'active' })
    .eq('id', conversationId)

  if (error) return { error: error.message }
  void writeAudit({
    action: 'chat.conversation_claimed',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'chat_conversation',
    resourceId: conversationId,
  })
  return { ok: true }
}

// ─── Close a conversation ────────────────────────────────────────────────────

export async function closeConversation(conversationId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Unauthenticated' }

  const admin = await createAdminClient()
  const { error } = await admin
    .from('chat_conversations')
    .update({ status: 'closed', closed_at: new Date().toISOString() })
    .eq('id', conversationId)

  if (error) return { error: error.message }
  void writeAudit({
    action: 'chat.conversation_closed',
    actorId: user.id,
    actorEmail: user.email,
    resourceType: 'chat_conversation',
    resourceId: conversationId,
  })
  return { ok: true }
}
