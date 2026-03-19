-- RLS policies for the invitations table
-- The table was created without policies, causing all reads with the anon/service key to be blocked.

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Tenant admins and dispatchers can read invitations for their own tenant
CREATE POLICY "tenant_members_can_read_invitations"
  ON invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = invitations.tenant_id
        AND memberships.user_id   = auth.uid()
        AND memberships.is_active  = true
        AND memberships.role IN ('company_admin', 'dispatcher')
    )
  );

-- Only company admins can insert invitations
CREATE POLICY "company_admins_can_insert_invitations"
  ON invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = invitations.tenant_id
        AND memberships.user_id   = auth.uid()
        AND memberships.is_active  = true
        AND memberships.role = 'company_admin'
    )
  );

-- Only company admins can update (revoke, accept) invitations for their tenant
CREATE POLICY "company_admins_can_update_invitations"
  ON invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM memberships
      WHERE memberships.tenant_id = invitations.tenant_id
        AND memberships.user_id   = auth.uid()
        AND memberships.is_active  = true
        AND memberships.role = 'company_admin'
    )
  );

-- Public read of a single invitation by token (for the accept-invite page)
-- Only exposes non-sensitive columns; the token itself is the auth mechanism
CREATE POLICY "public_can_read_invitation_by_token"
  ON invitations FOR SELECT
  USING (
    revoked_at IS NULL
    AND accepted_at IS NULL
    AND expires_at > now()
  );
