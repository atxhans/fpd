-- =====================================================
-- Migration 008: Audit Logs & Impersonation
-- =====================================================

CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),           -- null for platform-level events
  actor_id UUID REFERENCES profiles(id),
  actor_email TEXT,
  impersonated_by UUID REFERENCES profiles(id),    -- set when action performed during impersonation
  impersonation_session_id UUID,

  action TEXT NOT NULL,        -- e.g. 'tenant.created', 'job.completed', 'user.invited'
  resource_type TEXT,          -- e.g. 'job', 'equipment', 'tenant'
  resource_id TEXT,
  resource_label TEXT,

  metadata JSONB DEFAULT '{}', -- before/after state, IPs, etc.
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id, created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action, created_at DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_impersonation ON audit_logs(impersonation_session_id) WHERE impersonation_session_id IS NOT NULL;

-- Impersonation sessions (immutable once created)
CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  initiated_by UUID NOT NULL REFERENCES profiles(id),
  target_user_id UUID NOT NULL REFERENCES profiles(id),
  target_tenant_id UUID REFERENCES tenants(id),
  reason TEXT NOT NULL,                         -- required justification
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'ended')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  ended_by UUID REFERENCES profiles(id),
  metadata JSONB DEFAULT '{}'
  -- No updated_at: this table is append-only / immutable after insert
);

CREATE INDEX idx_impersonation_initiated_by ON impersonation_sessions(initiated_by);
CREATE INDEX idx_impersonation_target ON impersonation_sessions(target_user_id);
CREATE INDEX idx_impersonation_status ON impersonation_sessions(status) WHERE status = 'active';

-- Support cases (lightweight internal tracking)
CREATE TABLE support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  subject TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_to UUID REFERENCES profiles(id),
  reported_by_name TEXT,
  reported_by_email TEXT,
  created_by UUID REFERENCES profiles(id),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_cases_tenant ON support_cases(tenant_id);
CREATE INDEX idx_support_cases_status ON support_cases(status);

CREATE TABLE support_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id UUID NOT NULL REFERENCES support_cases(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_support_notes_case ON support_notes(case_id);

CREATE TRIGGER support_cases_updated_at BEFORE UPDATE ON support_cases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
