-- =====================================================
-- Development Seed Data — Fieldpiece Digital
-- Creates realistic demo data for development/testing
-- =====================================================
-- NOTE: Auth users must be created via Supabase dashboard or auth.admin API
-- before running this seed. Use the emails below.
-- =====================================================

-- -------------------------------------------------------
-- Platform Users (Fieldpiece Internal)
-- -------------------------------------------------------
-- Create these in Supabase auth first:
--   superadmin@fieldpiecedigital.com  (password: FpdDemo2024!)
--   support@fieldpiecedigital.com     (password: FpdDemo2024!)
-- Then their UUIDs will auto-create profiles via auth trigger.
-- We update them here:

-- Use DO block to avoid hard-coding UUIDs
DO $$
DECLARE
  v_super_admin_id UUID;
  v_support_admin_id UUID;
  v_tenant_id UUID;
  v_owner_id UUID;
  v_dispatch_id UUID;
  v_tech1_id UUID;
  v_tech2_id UUID;
  v_tech3_id UUID;
  v_customer1_id UUID;
  v_customer2_id UUID;
  v_customer3_id UUID;
  v_site1_id UUID;
  v_site2_id UUID;
  v_site3_id UUID;
  v_eq1_id UUID;
  v_eq2_id UUID;
  v_eq3_id UUID;
  v_eq4_id UUID;
  v_job1_id UUID;
  v_job2_id UUID;
  v_job3_id UUID;
BEGIN

-- -------------------------------------------------------
-- Profiles (assuming auth users already exist)
-- -------------------------------------------------------

SELECT id INTO v_super_admin_id FROM auth.users WHERE email = 'superadmin@fieldpiecedigital.com' LIMIT 1;
SELECT id INTO v_support_admin_id FROM auth.users WHERE email = 'support@fieldpiecedigital.com' LIMIT 1;

IF v_super_admin_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user, platform_role)
  VALUES (v_super_admin_id, 'superadmin@fieldpiecedigital.com', 'Alex', 'Rivera', true, 'platform_super_admin')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_platform_user = true,
    platform_role = 'platform_super_admin';
END IF;

IF v_support_admin_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user, platform_role)
  VALUES (v_support_admin_id, 'support@fieldpiecedigital.com', 'Jordan', 'Kim', true, 'platform_support_admin')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    is_platform_user = true,
    platform_role = 'platform_support_admin';
END IF;

-- -------------------------------------------------------
-- Tenant: ABC HVAC Services
-- -------------------------------------------------------
INSERT INTO tenants (id, name, slug, status, plan, onboarding_status, address_line1, city, state, zip, phone)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'ABC HVAC Services',
  'abc-hvac',
  'active',
  'professional',
  'complete',
  '1234 Industrial Blvd',
  'Los Angeles',
  'CA',
  '90001',
  '(213) 555-0100'
) ON CONFLICT (id) DO NOTHING;

v_tenant_id := 'a0000000-0000-0000-0000-000000000001';

-- Platform feature flags
INSERT INTO platform_feature_flags (key, enabled, description) VALUES
  ('ai_diagnostics', false, 'Enable AI-powered diagnostic suggestions (Claude integration)'),
  ('device_ingestion', false, 'Enable automated device data ingestion API'),
  ('weather_enrichment', false, 'Enable automatic weather data enrichment for sites')
ON CONFLICT (key) DO NOTHING;

-- Tenant feature flag
INSERT INTO tenant_feature_flags (tenant_id, key, enabled) VALUES
  (v_tenant_id, 'ai_diagnostics', false)
ON CONFLICT (tenant_id, key) DO NOTHING;

-- -------------------------------------------------------
-- Tenant Users
-- -------------------------------------------------------
-- These also need to exist in auth.users first.
-- Seed emails: owner@abchvac.com, dispatch@abchvac.com,
--   mike@abchvac.com, sarah@abchvac.com, david@abchvac.com

SELECT id INTO v_owner_id FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;
SELECT id INTO v_dispatch_id FROM auth.users WHERE email = 'dispatch@abchvac.com' LIMIT 1;
SELECT id INTO v_tech1_id FROM auth.users WHERE email = 'mike@abchvac.com' LIMIT 1;
SELECT id INTO v_tech2_id FROM auth.users WHERE email = 'sarah@abchvac.com' LIMIT 1;
SELECT id INTO v_tech3_id FROM auth.users WHERE email = 'david@abchvac.com' LIMIT 1;

IF v_owner_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_owner_id, 'owner@abchvac.com', 'Mark', 'Thompson', false)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_owner_id, 'company_admin', true, now())
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END IF;

IF v_dispatch_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_dispatch_id, 'dispatch@abchvac.com', 'Lisa', 'Chen', false)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_dispatch_id, 'dispatcher', true, now())
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END IF;

IF v_tech1_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_tech1_id, 'mike@abchvac.com', 'Mike', 'Johnson', false)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_tech1_id, 'technician', true, now())
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END IF;

IF v_tech2_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_tech2_id, 'sarah@abchvac.com', 'Sarah', 'Lee', false)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_tech2_id, 'technician', true, now())
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END IF;

IF v_tech3_id IS NOT NULL THEN
  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_tech3_id, 'david@abchvac.com', 'David', 'Nguyen', false)
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_tech3_id, 'technician', true, now())
  ON CONFLICT (tenant_id, user_id) DO NOTHING;
END IF;

-- -------------------------------------------------------
-- Customers
-- -------------------------------------------------------

v_customer1_id := 'b0000000-0000-0000-0000-000000000001';
v_customer2_id := 'b0000000-0000-0000-0000-000000000002';
v_customer3_id := 'b0000000-0000-0000-0000-000000000003';

INSERT INTO customers (id, tenant_id, name, email, phone, customer_type) VALUES
  (v_customer1_id, v_tenant_id, 'Smith Residence',      'john.smith@email.com',    '(310) 555-0101', 'residential'),
  (v_customer2_id, v_tenant_id, 'ABC Office Building',  'facilities@abcoffice.com','(213) 555-0202', 'commercial'),
  (v_customer3_id, v_tenant_id, 'Downtown Restaurant',  'mgr@downtownrest.com',    '(213) 555-0303', 'commercial')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Sites
-- -------------------------------------------------------

v_site1_id := 'c0000000-0000-0000-0000-000000000001';
v_site2_id := 'c0000000-0000-0000-0000-000000000002';
v_site3_id := 'c0000000-0000-0000-0000-000000000003';

INSERT INTO sites (id, tenant_id, customer_id, name, address_line1, city, state, zip, site_type) VALUES
  (v_site1_id, v_tenant_id, v_customer1_id, 'Smith Home',          '123 Oak St',       'Los Angeles', 'CA', '90024', 'residential'),
  (v_site2_id, v_tenant_id, v_customer2_id, 'ABC Office - Floor 3', '456 Pine Ave',     'Los Angeles', 'CA', '90017', 'commercial'),
  (v_site3_id, v_tenant_id, v_customer3_id, 'Downtown Restaurant',  '789 Main St',      'Los Angeles', 'CA', '90012', 'commercial')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Equipment
-- -------------------------------------------------------

v_eq1_id := 'd0000000-0000-0000-0000-000000000001';
v_eq2_id := 'd0000000-0000-0000-0000-000000000002';
v_eq3_id := 'd0000000-0000-0000-0000-000000000003';
v_eq4_id := 'd0000000-0000-0000-0000-000000000004';

INSERT INTO equipment (id, tenant_id, site_id, customer_id, manufacturer, model_number, serial_number, unit_type, refrigerant_type, tonnage, install_date, location, status) VALUES
  (v_eq1_id, v_tenant_id, v_site1_id, v_customer1_id, 'Carrier',  '24ACC636A003', 'C18G12345', 'split_ac',   'R-410A', 3.0, '2019-06-15', 'outdoor', 'active'),
  (v_eq2_id, v_tenant_id, v_site1_id, v_customer1_id, 'Carrier',  'FX4DNF037L00', 'C18A12345', 'air_handler','R-410A', 3.0, '2019-06-15', 'indoor',  'active'),
  (v_eq3_id, v_tenant_id, v_site2_id, v_customer2_id, 'Trane',    '4TTR6036J1',   'T20G98765', 'split_ac',   'R-410A', 3.0, '2020-04-10', 'outdoor', 'active'),
  (v_eq4_id, v_tenant_id, v_site3_id, v_customer3_id, 'Lennox',   'XC21-060',     'L17X55432', 'rooftop_unit','R-410A', 5.0, '2017-08-20', 'outdoor', 'active')
ON CONFLICT (id) DO NOTHING;

-- -------------------------------------------------------
-- Jobs
-- -------------------------------------------------------

v_job1_id := 'e0000000-0000-0000-0000-000000000001';
v_job2_id := 'e0000000-0000-0000-0000-000000000002';
v_job3_id := 'e0000000-0000-0000-0000-000000000003';

IF v_tech1_id IS NOT NULL AND v_owner_id IS NOT NULL THEN
  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id, assigned_technician_id, created_by, service_category, priority, problem_description, status, scheduled_at) VALUES
    (v_job1_id, v_tenant_id, 'JOB-0001', v_customer1_id, v_site1_id, v_tech1_id, v_owner_id,
     'repair', 'normal', 'Unit not cooling. Customer reports warm air coming from vents.',
     'in_progress', now() - INTERVAL '2 hours'),
    (v_job2_id, v_tenant_id, 'JOB-0002', v_customer2_id, v_site2_id, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Annual preventive maintenance visit.',
     'completed', now() - INTERVAL '1 day'),
    (v_job3_id, v_tenant_id, 'JOB-0003', v_customer3_id, v_site3_id, v_tech1_id, v_owner_id,
     'repair', 'high', 'Rooftop unit completely down. Restaurant cannot operate.',
     'assigned', now() + INTERVAL '2 hours')
  ON CONFLICT (id) DO NOTHING;

  -- Job equipment links
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_job1_id, v_eq1_id, v_tenant_id),
    (v_job2_id, v_eq3_id, v_tenant_id),
    (v_job3_id, v_eq4_id, v_tenant_id)
  ON CONFLICT (job_id, equipment_id) DO NOTHING;

  -- Readings for completed job
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT
    v_tenant_id, v_job2_id, v_eq3_id, v_tech2_id,
    rt.id, vals.val, rt.unit, 'manual', now() - INTERVAL '1 day'
  FROM (VALUES
    ('suction_pressure',   62.5),
    ('discharge_pressure', 248.0),
    ('superheat',          14.0),
    ('subcooling',         10.5),
    ('return_air_temp',    76.0),
    ('supply_air_temp',    55.5),
    ('delta_t',            20.5),
    ('ambient_temp',       88.0),
    ('voltage',            236.0),
    ('compressor_amps',    15.8)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;
END IF;

RAISE NOTICE 'Seed data inserted successfully.';

END $$;
