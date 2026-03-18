-- Add page context to support cases
ALTER TABLE support_cases ADD COLUMN IF NOT EXISTS page_url text;

-- Comments / activity thread on support cases
CREATE TABLE support_case_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id     uuid        NOT NULL REFERENCES support_cases(id) ON DELETE CASCADE,
  author_id   uuid        NOT NULL REFERENCES profiles(id),
  body        text        NOT NULL,
  is_internal boolean     NOT NULL DEFAULT false,  -- internal = only visible to platform staff
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_case_comments_case ON support_case_comments(case_id);
ALTER TABLE support_case_comments ENABLE ROW LEVEL SECURITY;

-- Platform staff can read/write all comments
CREATE POLICY "Platform users can manage support comments"
  ON support_case_comments FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_platform_user = true));

-- Tenant members can read non-internal comments on their own cases
CREATE POLICY "Tenant members can read their case comments"
  ON support_case_comments FOR SELECT
  USING (
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM support_cases sc
      JOIN memberships m ON m.tenant_id = sc.tenant_id
      WHERE sc.id = case_id AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

-- Tenant members can post non-internal comments on their cases
CREATE POLICY "Tenant members can add comments to their cases"
  ON support_case_comments FOR INSERT
  WITH CHECK (
    author_id = auth.uid() AND
    is_internal = false AND
    EXISTS (
      SELECT 1 FROM support_cases sc
      JOIN memberships m ON m.tenant_id = sc.tenant_id
      WHERE sc.id = case_id AND m.user_id = auth.uid() AND m.is_active = true
    )
  );

-- Allow tenant members to create support cases for their tenant
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_cases' AND policyname = 'Tenant members can insert support cases'
  ) THEN
    CREATE POLICY "Tenant members can insert support cases"
      ON support_cases FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM memberships
          WHERE tenant_id = support_cases.tenant_id AND user_id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;

-- Allow tenant members to read their own cases
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'support_cases' AND policyname = 'Tenant members can read their support cases'
  ) THEN
    CREATE POLICY "Tenant members can read their support cases"
      ON support_cases FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM memberships
          WHERE tenant_id = support_cases.tenant_id AND user_id = auth.uid() AND is_active = true
        )
      );
  END IF;
END $$;
