-- API keys for device/external ingestion endpoints
-- Keys are stored as SHA-256 hashes; the plaintext key is only shown once at creation

CREATE TABLE api_keys (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  key_hash     TEXT        NOT NULL UNIQUE,
  label        TEXT        NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at   TIMESTAMPTZ
);

CREATE INDEX api_keys_tenant_id_idx ON api_keys(tenant_id);

ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- Company admins can view their own tenant's keys (not the hash — managed via UI)
CREATE POLICY "Company admins can view their api keys"
  ON api_keys FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = api_keys.tenant_id
        AND memberships.user_id = auth.uid()
        AND memberships.role = 'company_admin'
        AND memberships.is_active = true
    )
  );
