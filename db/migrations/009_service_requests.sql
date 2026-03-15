-- =====================================================
-- Migration 009: Service Requests
-- =====================================================

CREATE TABLE service_requests (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Tenant ownership (nullable for unmatched inbound emails)
  tenant_id               UUID REFERENCES tenants(id) ON DELETE CASCADE,

  -- Customer linkage (nullable until matched or created)
  customer_id             UUID REFERENCES customers(id) ON DELETE SET NULL,

  -- Source of the request
  source                  TEXT NOT NULL DEFAULT 'email'
                            CHECK (source IN ('email', 'web_form', 'manual')),

  -- Contact info (from inbound email or form submission)
  contact_name            TEXT,
  contact_email           TEXT NOT NULL,
  contact_phone           TEXT,

  -- Request details
  subject                 TEXT,
  description             TEXT,
  address                 TEXT,

  -- Lifecycle
  status                  TEXT NOT NULL DEFAULT 'new'
                            CHECK (status IN ('new', 'acknowledged', 'converted', 'spam', 'closed')),

  -- If converted to a job
  job_id                  UUID REFERENCES jobs(id) ON DELETE SET NULL,

  -- Raw inbound email payload (for debugging / replay)
  raw_payload             JSONB DEFAULT '{}',

  -- Auto-responder tracking
  auto_response_sent_at   TIMESTAMPTZ,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_service_requests_tenant   ON service_requests(tenant_id)   WHERE tenant_id IS NOT NULL;
CREATE INDEX idx_service_requests_customer ON service_requests(customer_id) WHERE customer_id IS NOT NULL;
CREATE INDEX idx_service_requests_email    ON service_requests(contact_email);
CREATE INDEX idx_service_requests_status   ON service_requests(status);
CREATE INDEX idx_service_requests_job      ON service_requests(job_id)      WHERE job_id IS NOT NULL;

-- Auto-update updated_at
CREATE TRIGGER service_requests_updated_at
  BEFORE UPDATE ON service_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- RLS
ALTER TABLE service_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY service_requests_tenant ON service_requests FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);
