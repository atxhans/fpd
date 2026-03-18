-- ============================================================
-- Migration 014: Live chat — conversations, messages, push subscriptions
-- ============================================================

-- Chat conversations (one per user session)
CREATE TABLE IF NOT EXISTS chat_conversations (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  user_id           UUID        NOT NULL REFERENCES profiles(id),
  assigned_agent_id UUID        REFERENCES profiles(id),
  status            TEXT        NOT NULL DEFAULT 'open'
                                CHECK (status IN ('open', 'active', 'closed')),
  unread_by_agent   INT         NOT NULL DEFAULT 0,
  unread_by_user    INT         NOT NULL DEFAULT 0,
  last_message_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  closed_at         TIMESTAMPTZ
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID        NOT NULL REFERENCES chat_conversations(id) ON DELETE CASCADE,
  sender_id       UUID        NOT NULL REFERENCES profiles(id),
  sender_role     TEXT        NOT NULL CHECK (sender_role IN ('user', 'agent')),
  body            TEXT        NOT NULL,
  read_at         TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Push subscriptions (one per browser/device per user)
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  endpoint   TEXT        NOT NULL UNIQUE,
  p256dh     TEXT        NOT NULL,
  auth       TEXT        NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS chat_conversations_user_id_idx    ON chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS chat_conversations_status_idx     ON chat_conversations(status);
CREATE INDEX IF NOT EXISTS chat_conversations_last_msg_idx   ON chat_conversations(last_message_at DESC);
CREATE INDEX IF NOT EXISTS chat_messages_conversation_id_idx ON chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS push_subscriptions_user_id_idx    ON push_subscriptions(user_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────────

ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages      ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- chat_conversations: tenant users see & create their own
CREATE POLICY "Users can view own conversations"
  ON chat_conversations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can create conversations"
  ON chat_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- chat_conversations: platform users see and update all
CREATE POLICY "Platform users can view all conversations"
  ON chat_conversations FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_user = true
  ));

CREATE POLICY "Platform users can update conversations"
  ON chat_conversations FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_user = true
  ));

-- chat_messages: users can read/write messages in their own conversations
CREATE POLICY "Users can view messages in own conversations"
  ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()
  ));

CREATE POLICY "Users can send messages in own conversations"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM chat_conversations WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

-- chat_messages: platform users can read and send in any conversation
CREATE POLICY "Platform users can view all messages"
  ON chat_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_user = true
  ));

CREATE POLICY "Platform users can send messages"
  ON chat_messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_user = true
    )
  );

-- push_subscriptions: users manage their own
CREATE POLICY "Users can manage own push subscriptions"
  ON push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- Run these in the Supabase SQL editor (requires superuser):
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE chat_conversations;
