-- =====================================================
-- Migration 010: Email Templates (per-tenant)
-- =====================================================

CREATE TABLE email_templates (
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID    NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key         TEXT    NOT NULL,
  subject     TEXT    NOT NULL DEFAULT '',
  html_body   TEXT    NOT NULL DEFAULT '',
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (tenant_id, key)
);

CREATE INDEX idx_email_templates_tenant ON email_templates(tenant_id);

CREATE TRIGGER email_templates_updated_at
  BEFORE UPDATE ON email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY email_templates_tenant ON email_templates FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);
