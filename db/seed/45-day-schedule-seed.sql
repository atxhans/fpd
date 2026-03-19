-- ============================================================
-- 45-day forward schedule seed  (Mar 20 – May 3 2026)
--
-- Generates realistic daily job loads:
--   Weekdays:  3–5 jobs/day
--   Saturdays: 1–3 jobs/day
--   Sundays:   0–2 jobs/day (~40% chance of 0)
--
-- Rotates across 4 technicians + occasional unassigned
-- Times between 7 AM–5 PM CDT (UTC = CDT + 5h)
-- ============================================================

DO $$
DECLARE
  v_tenant_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_owner      UUID;
  v_tech1      UUID;  -- mike
  v_tech2      UUID;  -- sarah
  v_tech4      UUID;  -- carlos
  v_tech5      UUID;  -- jessica

  -- Paired customer/site indices (must stay in sync)
  v_customers  UUID[] := ARRAY[
    'b0000000-0000-0000-0000-000000000001'::UUID,  -- Smith Residence
    'b0000000-0000-0000-0000-000000000002'::UUID,  -- ABC Office Building
    'b0000000-0000-0000-0000-000000000003'::UUID,  -- Downtown Restaurant
    'b0000000-0000-0000-0000-000000000006'::UUID,  -- West LA customer
    'b0000000-0000-0000-0000-000000000008'::UUID,  -- Downey customer
    'b0000000-0000-0000-0000-000000000009'::UUID,  -- Compton customer
    'b0000000-0000-0000-0000-000000000011'::UUID   -- Van Nuys customer
  ];
  v_sites      UUID[] := ARRAY[
    'c0000000-0000-0000-0000-000000000001'::UUID,
    'c0000000-0000-0000-0000-000000000002'::UUID,
    'c0000000-0000-0000-0000-000000000003'::UUID,
    'c0000000-0000-0000-0000-000000000006'::UUID,
    'c0000000-0000-0000-0000-000000000008'::UUID,
    'c0000000-0000-0000-0000-000000000009'::UUID,
    'c0000000-0000-0000-0000-000000000011'::UUID
  ];

  -- Problem descriptions by category
  v_maint_desc TEXT[] := ARRAY[
    'Quarterly preventive maintenance. Filters, coils, and electrical inspection.',
    'Annual system tune-up. Replace filters, clean coils, check refrigerant charge.',
    'Bi-monthly PM visit per maintenance agreement.',
    'Pre-summer season startup check. Full inspection before peak cooling load.',
    'Full PM — filter replacement, coil cleaning, drain flush, readings logged.',
    'Scheduled maintenance visit. Customer reports system has been running fine.'
  ];
  v_repair_desc TEXT[] := ARRAY[
    'Unit not reaching setpoint. Warm air from all vents.',
    'Thermostat unresponsive. Unit cycling on and off every few minutes.',
    'Loud grinding noise from outdoor unit — possible motor bearing failure.',
    'System tripping on high-pressure cutout every 20–30 minutes.',
    'Water dripping from indoor air handler. Drain pan overflow suspected.',
    'Significantly reduced airflow. Possible dirty evaporator coil or blower issue.',
    'Unit runs but no cooling output. Possible capacitor or refrigerant issue.',
    'Zone 2 not cooling to setpoint. Other zones fine.',
    'Compressor short-cycling. Trips within 2 minutes of startup.',
    'Ice forming on refrigerant lines. Low airflow or low charge suspected.'
  ];
  v_inspect_desc TEXT[] := ARRAY[
    'Pre-season inspection before summer cooling loads.',
    'New tenant move-in equipment inspection and condition report.',
    'Follow-up inspection after last month''s repair — verify repair held.',
    'Post-installation inspection of new equipment.',
    'Landlord-requested inspection for lease renewal documentation.'
  ];
  v_install_desc TEXT[] := ARRAY[
    'Install new 3-ton split system to replace failed unit.',
    'Install ductless mini-split in new server room addition.',
    'Replace failed condensing unit — equipment already on site.',
    'Install programmable thermostat and zone dampers.'
  ];
  v_emerg_desc TEXT[] := ARRAY[
    'Total loss of cooling. Customer has elderly resident — urgent.',
    'Compressor locked out on high-pressure fault. Cannot clear remotely.',
    'Commercial refrigeration failure. Health code concern.',
    'Walk-in cooler temperature rising. Restaurant at risk of health violation.',
    'Office building — no cooling in 90°F+ heat. Employees being sent home.'
  ];

  -- Loop variables
  v_day        DATE;
  v_dow        INTEGER;
  v_job_count  INTEGER;
  v_hour_utc   INTEGER;
  v_min        INTEGER;
  v_cat        TEXT;
  v_priority   TEXT;
  v_status     TEXT;
  v_tech       UUID;
  v_desc       TEXT;
  v_jnum       INTEGER := 200;  -- starts at JOB-0200
  v_cidx       INTEGER;
  v_rand       FLOAT;

BEGIN
  SELECT id INTO v_owner  FROM auth.users WHERE email = 'owner@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech1  FROM auth.users WHERE email = 'mike@abchvac.com'    LIMIT 1;
  SELECT id INTO v_tech2  FROM auth.users WHERE email = 'sarah@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech4  FROM auth.users WHERE email = 'carlos@abchvac.com'  LIMIT 1;
  SELECT id INTO v_tech5  FROM auth.users WHERE email = 'jessica@abchvac.com' LIMIT 1;

  IF v_tech1 IS NULL THEN
    RAISE EXCEPTION 'Base seed users not found — run dev-seed and today-jobs-seed first';
  END IF;

  -- ── Loop over 45 days starting March 20 ──────────────────────────────────
  FOR i IN 0..44 LOOP
    v_day := '2026-03-20'::DATE + i;
    v_dow := EXTRACT(DOW FROM v_day)::INTEGER;  -- 0=Sun, 6=Sat

    -- Job count by day type
    IF v_dow = 0 THEN      -- Sunday
      v_job_count := CASE WHEN random() < 0.4 THEN 0 ELSE 1 + floor(random() * 2)::INTEGER END;
    ELSIF v_dow = 6 THEN   -- Saturday
      v_job_count := 1 + floor(random() * 3)::INTEGER;
    ELSE                   -- Weekday
      v_job_count := 3 + floor(random() * 3)::INTEGER;
    END IF;

    FOR j IN 1..v_job_count LOOP

      -- Scheduled time: 7 AM–5 PM CDT = 12:00–22:00 UTC
      v_hour_utc := 12 + floor(random() * 10)::INTEGER;
      v_min      := (floor(random() * 4)::INTEGER) * 15;

      -- Customer/site pair (rotate with some randomness)
      v_cidx := 1 + (((i * 5 + j * 3) + floor(random() * 3)::INTEGER) % 7);

      -- Technician assignment (~15% unassigned)
      v_rand := random();
      IF v_rand < 0.15 THEN
        v_tech   := NULL;
        v_status := 'unassigned';
      ELSE
        v_tech := CASE floor(random() * 4)::INTEGER
          WHEN 0 THEN v_tech1
          WHEN 1 THEN v_tech2
          WHEN 2 THEN v_tech4
          ELSE v_tech5
        END;
        v_status := 'assigned';
      END IF;

      -- Service category with realistic weighting (10 slots)
      CASE floor(random() * 10)::INTEGER
        WHEN 0, 1, 2, 3 THEN v_cat := 'maintenance';   -- 40%
        WHEN 4, 5, 6    THEN v_cat := 'repair';         -- 30%
        WHEN 7          THEN v_cat := 'inspection';     -- 10%
        WHEN 8          THEN v_cat := 'installation';   -- 10%
        ELSE                 v_cat := 'emergency';      -- 10%
      END CASE;

      -- Priority
      v_priority := CASE
        WHEN v_cat = 'emergency'                         THEN 'emergency'
        WHEN random() < 0.60                             THEN 'normal'
        WHEN random() < 0.70                             THEN 'high'
        WHEN random() < 0.50                             THEN 'low'
        ELSE                                                  'normal'
      END;

      -- Problem description
      v_desc := CASE v_cat
        WHEN 'maintenance'  THEN v_maint_desc  [1 + floor(random() * array_length(v_maint_desc,  1))::INTEGER]
        WHEN 'repair'       THEN v_repair_desc [1 + floor(random() * array_length(v_repair_desc,  1))::INTEGER]
        WHEN 'inspection'   THEN v_inspect_desc[1 + floor(random() * array_length(v_inspect_desc, 1))::INTEGER]
        WHEN 'installation' THEN v_install_desc[1 + floor(random() * array_length(v_install_desc, 1))::INTEGER]
        ELSE                     v_emerg_desc  [1 + floor(random() * array_length(v_emerg_desc,   1))::INTEGER]
      END;

      INSERT INTO jobs (
        id, tenant_id, job_number,
        customer_id, site_id,
        assigned_technician_id, created_by,
        service_category, priority, status,
        problem_description, scheduled_at
      ) VALUES (
        gen_random_uuid(),
        v_tenant_id,
        'JOB-' || LPAD(v_jnum::TEXT, 4, '0'),
        v_customers[v_cidx],
        v_sites[v_cidx],
        v_tech,
        v_owner,
        v_cat,
        v_priority,
        v_status,
        v_desc,
        (v_day::TEXT || 'T' || LPAD(v_hour_utc::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0') || ':00Z')::TIMESTAMPTZ
      );

      v_jnum := v_jnum + 1;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'Inserted % jobs across 45 days', v_jnum - 200;
END $$;
