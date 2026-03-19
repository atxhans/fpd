-- ============================================================
-- Today's dispatch — jobs for March 19 2026
--
-- Creates 2 new technicians (Carlos Rivera, Jessica Park)
-- then seeds 6 jobs spread across the day, assigned to all
-- four technicians with a mix of priorities and categories.
--
-- Times stored as UTC (CDT = UTC−5, DST active since Mar 8)
--   8:00 AM CDT = 13:00 UTC
--  10:00 AM CDT = 15:00 UTC
--  12:30 PM CDT = 17:30 UTC
--   2:00 PM CDT = 19:00 UTC
--   3:30 PM CDT = 20:30 UTC
--   5:00 PM CDT = 22:00 UTC
-- ============================================================

DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001';

  -- Existing customers & sites from dev-seed
  v_c1 UUID := 'b0000000-0000-0000-0000-000000000001';  -- Smith Residence
  v_s1 UUID := 'c0000000-0000-0000-0000-000000000001';
  v_c2 UUID := 'b0000000-0000-0000-0000-000000000002';  -- ABC Office Building
  v_s2 UUID := 'c0000000-0000-0000-0000-000000000002';
  v_c3 UUID := 'b0000000-0000-0000-0000-000000000003';  -- Downtown Restaurant
  v_s3 UUID := 'c0000000-0000-0000-0000-000000000003';

  -- Existing equipment from dev-seed
  v_eq1 UUID := 'd0000000-0000-0000-0000-000000000001';  -- Carrier split AC (Smith)
  v_eq4 UUID := 'd0000000-0000-0000-0000-000000000004';  -- Lennox rooftop (Restaurant)

  -- Existing technicians
  v_tech1 UUID;  -- mike@abchvac.com
  v_tech2 UUID;  -- sarah@abchvac.com
  v_owner UUID;  -- owner@abchvac.com (created_by)

  -- New technicians
  v_tech4 UUID;  -- carlos@abchvac.com
  v_tech5 UUID;  -- jessica@abchvac.com

  -- Today's job IDs (55xx series)
  v_j1 UUID := '55000000-0000-0000-0000-000000000001';
  v_j2 UUID := '55000000-0000-0000-0000-000000000002';
  v_j3 UUID := '55000000-0000-0000-0000-000000000003';
  v_j4 UUID := '55000000-0000-0000-0000-000000000004';
  v_j5 UUID := '55000000-0000-0000-0000-000000000005';
  v_j6 UUID := '55000000-0000-0000-0000-000000000006';

BEGIN

  SELECT id INTO v_tech1 FROM auth.users WHERE email = 'mike@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech2 FROM auth.users WHERE email = 'sarah@abchvac.com'  LIMIT 1;
  SELECT id INTO v_owner  FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;

  IF v_tech1 IS NULL THEN
    RAISE EXCEPTION 'Base seed users not found — run dev-seed first';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- NEW TECHNICIAN: Carlos Rivera
  -- ──────────────────────────────────────────────────────────────────────────

  SELECT id INTO v_tech4 FROM auth.users WHERE email = 'carlos@abchvac.com' LIMIT 1;

  IF v_tech4 IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data,
      created_at, updated_at, is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'carlos@abchvac.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"first_name":"Carlos","last_name":"Rivera"}',
      '{"provider":"email","providers":["email"]}',
      now(), now(), false
    ) RETURNING id INTO v_tech4;
  END IF;

  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_tech4, 'carlos@abchvac.com', 'Carlos', 'Rivera', false)
  ON CONFLICT (id) DO UPDATE SET first_name = 'Carlos', last_name = 'Rivera';

  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_tech4, 'technician', true, now())
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET is_active = true;

  -- ──────────────────────────────────────────────────────────────────────────
  -- NEW TECHNICIAN: Jessica Park
  -- ──────────────────────────────────────────────────────────────────────────

  SELECT id INTO v_tech5 FROM auth.users WHERE email = 'jessica@abchvac.com' LIMIT 1;

  IF v_tech5 IS NULL THEN
    INSERT INTO auth.users (
      id, instance_id, aud, role,
      email, encrypted_password, email_confirmed_at,
      raw_user_meta_data, raw_app_meta_data,
      created_at, updated_at, is_super_admin
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'authenticated', 'authenticated',
      'jessica@abchvac.com',
      crypt('TempPass123!', gen_salt('bf')),
      now(),
      '{"first_name":"Jessica","last_name":"Park"}',
      '{"provider":"email","providers":["email"]}',
      now(), now(), false
    ) RETURNING id INTO v_tech5;
  END IF;

  INSERT INTO profiles (id, email, first_name, last_name, is_platform_user)
  VALUES (v_tech5, 'jessica@abchvac.com', 'Jessica', 'Park', false)
  ON CONFLICT (id) DO UPDATE SET first_name = 'Jessica', last_name = 'Park';

  INSERT INTO memberships (tenant_id, user_id, role, is_active, accepted_at)
  VALUES (v_tenant_id, v_tech5, 'technician', true, now())
  ON CONFLICT (tenant_id, user_id) DO UPDATE SET is_active = true;

  -- ──────────────────────────────────────────────────────────────────────────
  -- TODAY'S JOBS  (Mar 19 2026, CDT = UTC−5)
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id,
                    assigned_technician_id, created_by,
                    service_category, priority, status,
                    problem_description, scheduled_at, started_at)
  VALUES

    -- 8:00 AM — Emergency: AC not working, Smith Residence (Mike)
    (v_j1, v_tenant_id, 'JOB-T001', v_c1, v_s1, v_tech1, v_owner,
     'emergency', 'emergency', 'in_progress',
     'Customer called at 7am — no cooling overnight. Woke up to 82°F inside. Split AC unit making a clicking noise but not starting.',
     '2026-03-19T13:00:00Z', '2026-03-19T13:15:00Z'),

    -- 10:00 AM — Annual maintenance, ABC Office Building (Sarah)
    (v_j2, v_tenant_id, 'JOB-T002', v_c2, v_s2, v_tech2, v_owner,
     'maintenance', 'normal', 'in_progress',
     'Scheduled annual preventive maintenance. Full inspection, filter replacement, coil cleaning, and readings on all three RTUs.',
     '2026-03-19T15:00:00Z', '2026-03-19T15:10:00Z'),

    -- 12:30 PM — Repair, Smith Residence (Carlos)
    (v_j3, v_tenant_id, 'JOB-T003', v_c1, v_s1, v_tech4, v_owner,
     'repair', 'high', 'assigned',
     'Air handler fan motor making grinding noise. Unit still running but reduced airflow reported. Possible bearing failure.',
     '2026-03-19T17:30:00Z', NULL),

    -- 2:00 PM — Inspection, ABC Office Building (Jessica)
    (v_j4, v_tenant_id, 'JOB-T004', v_c2, v_s2, v_tech5, v_owner,
     'inspection', 'normal', 'assigned',
     'Post-maintenance inspection of the third-floor VAV system. Tenant complaints about hot and cold spots near the east side offices.',
     '2026-03-19T19:00:00Z', NULL),

    -- 3:30 PM — Emergency, Downtown Restaurant (Mike)
    (v_j5, v_tenant_id, 'JOB-T005', v_c3, v_s3, v_tech1, v_owner,
     'emergency', 'emergency', 'assigned',
     'Walk-in cooler failed. Restaurant cannot operate — health code issue. Rooftop condensing unit tripped on high-pressure lockout. Customer reported discharge pressure alarm.',
     '2026-03-19T20:30:00Z', NULL),

    -- 5:00 PM — Maintenance, Downtown Restaurant (Unassigned)
    (v_j6, v_tenant_id, 'JOB-T006', v_c3, v_s3, NULL, v_owner,
     'maintenance', 'normal', 'unassigned',
     'Quarterly kitchen exhaust hood and make-up air unit service. Grease filter replacement, belt inspection, motor amperage check.',
     '2026-03-19T22:00:00Z', NULL)

  ON CONFLICT (id) DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- EQUIPMENT LINKS
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_j1, v_eq1, v_tenant_id),  -- Emergency at Smith → Carrier split AC
    (v_j3, v_eq1, v_tenant_id),  -- Fan motor repair at Smith → same unit
    (v_j5, v_eq4, v_tenant_id),  -- Emergency at Restaurant → Lennox RTU
    (v_j6, v_eq4, v_tenant_id)   -- Quarterly maintenance → same RTU
  ON CONFLICT DO NOTHING;

END $$;
