-- =====================================================
-- Migration 017: Equipment Health Intelligence
-- =====================================================

-- AI summary cache and health score on equipment
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS ai_summary               JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS health_score             SMALLINT CHECK (health_score BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS health_score_at          TIMESTAMPTZ;

-- Index for future equipment list ordered by health
CREATE INDEX IF NOT EXISTS idx_equipment_health_score
  ON equipment(tenant_id, health_score)
  WHERE deleted_at IS NULL;
