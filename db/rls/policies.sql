-- =====================================================
-- Row Level Security Policies
-- =====================================================
-- All tenant data is isolated. Platform users bypass via service_role.
-- Users can only see data for their active tenant membership.
-- =====================================================

-- Helper function: get the calling user's tenant ID
CREATE OR REPLACE FUNCTION auth_tenant_id()
RETURNS UUID AS $$
  SELECT tenant_id
  FROM memberships
  WHERE user_id = auth.uid()
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: is the current user a platform-level user?
CREATE OR REPLACE FUNCTION is_platform_user()
RETURNS BOOLEAN AS $$
  SELECT is_platform_user FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper: does current user have a specific role in their tenant?
CREATE OR REPLACE FUNCTION has_tenant_role(required_role TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM memberships
    WHERE user_id = auth.uid()
      AND is_active = true
      AND role::TEXT = required_role
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- =====================================================
-- Enable RLS
-- =====================================================

ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_equipment ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE readings ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnostic_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- Tenants
-- =====================================================

-- Users see only their own tenant; platform users see all
CREATE POLICY tenant_select ON tenants FOR SELECT USING (
  is_platform_user() OR id = auth_tenant_id()
);

-- Only platform admins can create/modify tenants
CREATE POLICY tenant_insert ON tenants FOR INSERT WITH CHECK (is_platform_user());
CREATE POLICY tenant_update ON tenants FOR UPDATE USING (is_platform_user());

-- =====================================================
-- Profiles
-- =====================================================

-- Users see their own profile and their tenant members
CREATE POLICY profiles_select ON profiles FOR SELECT USING (
  id = auth.uid()
  OR is_platform_user()
  OR id IN (SELECT user_id FROM memberships WHERE tenant_id = auth_tenant_id() AND is_active = true)
);

CREATE POLICY profiles_update_own ON profiles FOR UPDATE USING (id = auth.uid());

-- =====================================================
-- Memberships
-- =====================================================

CREATE POLICY memberships_select ON memberships FOR SELECT USING (
  user_id = auth.uid()
  OR is_platform_user()
  OR tenant_id = auth_tenant_id()
);

CREATE POLICY memberships_insert ON memberships FOR INSERT WITH CHECK (
  is_platform_user()
  OR (tenant_id = auth_tenant_id() AND has_tenant_role('company_admin'))
);

-- =====================================================
-- Tenant-isolated tables (customers, sites, equipment, jobs, readings, etc.)
-- Pattern: users see rows where tenant_id = their tenant; platform users see all
-- =====================================================

-- Customers
CREATE POLICY customers_tenant ON customers FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Sites
CREATE POLICY sites_tenant ON sites FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Equipment
CREATE POLICY equipment_tenant ON equipment FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Jobs
CREATE POLICY jobs_tenant ON jobs FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Job equipment
CREATE POLICY job_equipment_tenant ON job_equipment FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Notes
CREATE POLICY notes_tenant ON notes FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Job parts
CREATE POLICY job_parts_tenant ON job_parts FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Readings
CREATE POLICY readings_tenant ON readings FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Diagnostic results
CREATE POLICY diagnostic_results_tenant ON diagnostic_results FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Attachments
CREATE POLICY attachments_tenant ON attachments FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Audit logs: users see only their tenant's logs; platform users see all
CREATE POLICY audit_logs_select ON audit_logs FOR SELECT USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Support cases: platform users only
CREATE POLICY support_cases_platform ON support_cases FOR ALL USING (is_platform_user());

-- Tenant settings
CREATE POLICY tenant_settings_tenant ON tenant_settings FOR ALL USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);

-- Feature flags: read for members, write for platform only
CREATE POLICY tenant_feature_flags_select ON tenant_feature_flags FOR SELECT USING (
  is_platform_user() OR tenant_id = auth_tenant_id()
);
CREATE POLICY tenant_feature_flags_write ON tenant_feature_flags FOR INSERT WITH CHECK (is_platform_user());
CREATE POLICY tenant_feature_flags_update ON tenant_feature_flags FOR UPDATE USING (is_platform_user());
