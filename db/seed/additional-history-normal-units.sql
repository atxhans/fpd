-- ============================================================
-- Normal unit histories — quarterly visits, Jan 2024 – Oct 2025
--
-- Unit A: Goodman GSX160481 (GD22I33219)
--   Marina Del Rey, 4 ton split AC, 2022 install
--   Coastal climate — mild temps year-round, readings rock-steady
--
-- Unit B: Trane 4TTR4036H1 (TR22C13579)
--   West Los Angeles, 3 ton split AC, 2022 install
--   Mild with moderate summer peaks — textbook healthy unit
-- ============================================================

DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001';

  -- Goodman GD22I33219
  v_e13 UUID := 'd0000000-0000-0000-0000-000000000013';
  v_s12 UUID := 'c0000000-0000-0000-0000-000000000012';
  v_c12 UUID := 'b0000000-0000-0000-0000-000000000012';

  -- Trane TR22C13579
  v_e7  UUID := 'd0000000-0000-0000-0000-000000000007';
  v_s6  UUID := 'c0000000-0000-0000-0000-000000000006';
  v_c6  UUID := 'b0000000-0000-0000-0000-000000000006';

  v_tech1_id UUID;
  v_tech2_id UUID;
  v_owner_id UUID;

  -- Goodman job IDs (11xx series)
  v_ga1 UUID := '11000000-0000-0000-0000-000000000001';
  v_ga2 UUID := '11000000-0000-0000-0000-000000000002';
  v_ga3 UUID := '11000000-0000-0000-0000-000000000003';
  v_ga4 UUID := '11000000-0000-0000-0000-000000000004';
  v_ga5 UUID := '11000000-0000-0000-0000-000000000005';
  v_ga6 UUID := '11000000-0000-0000-0000-000000000006';
  v_ga7 UUID := '11000000-0000-0000-0000-000000000007';
  v_ga8 UUID := '11000000-0000-0000-0000-000000000008';

  -- Trane TR22C13579 job IDs (22xx series)
  v_gb1 UUID := '22000000-0000-0000-0000-000000000001';
  v_gb2 UUID := '22000000-0000-0000-0000-000000000002';
  v_gb3 UUID := '22000000-0000-0000-0000-000000000003';
  v_gb4 UUID := '22000000-0000-0000-0000-000000000004';
  v_gb5 UUID := '22000000-0000-0000-0000-000000000005';
  v_gb6 UUID := '22000000-0000-0000-0000-000000000006';
  v_gb7 UUID := '22000000-0000-0000-0000-000000000007';
  v_gb8 UUID := '22000000-0000-0000-0000-000000000008';

BEGIN
  SELECT id INTO v_tech1_id FROM auth.users WHERE email = 'mike@abchvac.com'  LIMIT 1;
  SELECT id INTO v_tech2_id FROM auth.users WHERE email = 'sarah@abchvac.com' LIMIT 1;
  SELECT id INTO v_owner_id  FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;
  IF v_tech1_id IS NULL THEN RAISE EXCEPTION 'Seed users not found — run base seed first'; END IF;

  -- ── JOBS ──────────────────────────────────────────────────────────────────

  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id,
                    assigned_technician_id, created_by, service_category, priority,
                    problem_description, resolution_summary,
                    status, scheduled_at, started_at, completed_at)
  VALUES
    -- Goodman GD22I33219 — Marina Del Rey (coastal, mild, perfectly healthy)
    (v_ga1, v_tenant_id, 'JOB-GA01', v_c12, v_s12, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'All readings within spec. Filters clean. No issues.',
     'completed', '2024-01-16 09:00:00', '2024-01-16 09:30:00', '2024-01-16 11:00:00'),
    (v_ga2, v_tenant_id, 'JOB-GA02', v_c12, v_s12, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'All readings normal. Filters replaced.',
     'completed', '2024-04-16 09:00:00', '2024-04-16 09:30:00', '2024-04-16 11:00:00'),
    (v_ga3, v_tenant_id, 'JOB-GA03', v_c12, v_s12, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection — summer check.', 'Summer performance excellent. Mild coastal climate keeps discharge pressure low.',
     'completed', '2024-07-16 10:00:00', '2024-07-16 10:30:00', '2024-07-16 12:00:00'),
    (v_ga4, v_tenant_id, 'JOB-GA04', v_c12, v_s12, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'Readings stable. Unit performing well for age.',
     'completed', '2024-10-15 09:00:00', '2024-10-15 09:30:00', '2024-10-15 11:00:00'),
    (v_ga5, v_tenant_id, 'JOB-GA05', v_c12, v_s12, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Annual maintenance.', 'Full annual inspection. All readings in spec. Coils clean.',
     'completed', '2025-01-14 09:00:00', '2025-01-14 09:30:00', '2025-01-14 11:30:00'),
    (v_ga6, v_tenant_id, 'JOB-GA06', v_c12, v_s12, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'All readings normal.',
     'completed', '2025-04-15 09:00:00', '2025-04-15 09:30:00', '2025-04-15 11:00:00'),
    (v_ga7, v_tenant_id, 'JOB-GA07', v_c12, v_s12, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection — summer.', 'Excellent performance. Marina Del Rey ambient stays mild even in summer.',
     'completed', '2025-07-15 10:00:00', '2025-07-15 10:30:00', '2025-07-15 12:00:00'),
    (v_ga8, v_tenant_id, 'JOB-GA08', v_c12, v_s12, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'Unit in excellent condition. Recommended continued quarterly service.',
     'completed', '2025-10-14 09:00:00', '2025-10-14 09:30:00', '2025-10-14 11:00:00'),

    -- Trane TR22C13579 — West LA (moderate, healthy with summer variation)
    (v_gb1, v_tenant_id, 'JOB-GB01', v_c6, v_s6, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'All readings within normal range.',
     'completed', '2024-01-17 09:00:00', '2024-01-17 09:30:00', '2024-01-17 11:00:00'),
    (v_gb2, v_tenant_id, 'JOB-GB02', v_c6, v_s6, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'Spring startup check — system operating well.',
     'completed', '2024-04-17 09:00:00', '2024-04-17 09:30:00', '2024-04-17 11:00:00'),
    (v_gb3, v_tenant_id, 'JOB-GB03', v_c6, v_s6, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection — summer peak.', 'Higher ambient pushing discharge toward upper range — normal for this time of year. Unit coping well.',
     'completed', '2024-07-17 10:00:00', '2024-07-17 10:30:00', '2024-07-17 12:00:00'),
    (v_gb4, v_tenant_id, 'JOB-GB04', v_c6, v_s6, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'Fall readings — back to baseline. Unit in good health.',
     'completed', '2024-10-16 09:00:00', '2024-10-16 09:30:00', '2024-10-16 11:00:00'),
    (v_gb5, v_tenant_id, 'JOB-GB05', v_c6, v_s6, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Annual maintenance.', 'Full inspection. All readings normal. Minor refrigerant top-off (0.25 lbs) — within tolerance.',
     'completed', '2025-01-15 09:00:00', '2025-01-15 09:30:00', '2025-01-15 11:30:00'),
    (v_gb6, v_tenant_id, 'JOB-GB06', v_c6, v_s6, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'All readings normal post top-off.',
     'completed', '2025-04-16 09:00:00', '2025-04-16 09:30:00', '2025-04-16 11:00:00'),
    (v_gb7, v_tenant_id, 'JOB-GB07', v_c6, v_s6, v_tech2_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection — summer.', 'Summer conditions — discharge at upper range but within spec. No concerns.',
     'completed', '2025-07-16 10:00:00', '2025-07-16 10:30:00', '2025-07-16 12:00:00'),
    (v_gb8, v_tenant_id, 'JOB-GB08', v_c6, v_s6, v_tech1_id, v_owner_id, 'maintenance', 'normal',
     'Quarterly inspection.', 'Excellent condition. Unit operating at spec after 3 years of service.',
     'completed', '2025-10-15 09:00:00', '2025-10-15 09:30:00', '2025-10-15 11:00:00')

  ON CONFLICT (id) DO NOTHING;

  -- Link to equipment
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_ga1,v_e13,v_tenant_id),(v_ga2,v_e13,v_tenant_id),(v_ga3,v_e13,v_tenant_id),(v_ga4,v_e13,v_tenant_id),
    (v_ga5,v_e13,v_tenant_id),(v_ga6,v_e13,v_tenant_id),(v_ga7,v_e13,v_tenant_id),(v_ga8,v_e13,v_tenant_id),
    (v_gb1,v_e7,v_tenant_id),(v_gb2,v_e7,v_tenant_id),(v_gb3,v_e7,v_tenant_id),(v_gb4,v_e7,v_tenant_id),
    (v_gb5,v_e7,v_tenant_id),(v_gb6,v_e7,v_tenant_id),(v_gb7,v_e7,v_tenant_id),(v_gb8,v_e7,v_tenant_id)
  ON CONFLICT DO NOTHING;

  -- ── READINGS — Goodman GD22I33219 (coastal, mild, all normal) ─────────────

  -- GA1: Jan 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga1,v_e13,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2024-01-16 10:30:00'
  FROM (VALUES ('suction_pressure',64.0),('discharge_pressure',242.0),('superheat',13.0),('subcooling',11.0),
               ('return_air_temp',73.0),('supply_air_temp',54.0),('delta_t',19.0),
               ('compressor_amps',17.5),('voltage',232.0),('ambient_temp',62.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA2: Apr 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga2,v_e13,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2024-04-16 10:30:00'
  FROM (VALUES ('suction_pressure',65.0),('discharge_pressure',244.0),('superheat',13.0),('subcooling',11.0),
               ('return_air_temp',74.0),('supply_air_temp',54.0),('delta_t',20.0),
               ('compressor_amps',17.8),('voltage',232.0),('ambient_temp',67.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA3: Jul 2024 (mild coastal summer)
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga3,v_e13,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2024-07-16 11:00:00'
  FROM (VALUES ('suction_pressure',66.0),('discharge_pressure',251.0),('superheat',13.0),('subcooling',10.0),
               ('return_air_temp',76.0),('supply_air_temp',56.0),('delta_t',20.0),
               ('compressor_amps',18.5),('voltage',231.0),('ambient_temp',72.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA4: Oct 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga4,v_e13,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2024-10-15 10:30:00'
  FROM (VALUES ('suction_pressure',65.0),('discharge_pressure',245.0),('superheat',13.0),('subcooling',11.0),
               ('return_air_temp',74.0),('supply_air_temp',54.0),('delta_t',20.0),
               ('compressor_amps',17.6),('voltage',232.0),('ambient_temp',70.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA5: Jan 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga5,v_e13,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2025-01-14 10:30:00'
  FROM (VALUES ('suction_pressure',64.0),('discharge_pressure',241.0),('superheat',14.0),('subcooling',11.0),
               ('return_air_temp',73.0),('supply_air_temp',54.0),('delta_t',19.0),
               ('compressor_amps',17.4),('voltage',232.0),('ambient_temp',62.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA6: Apr 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga6,v_e13,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2025-04-15 10:30:00'
  FROM (VALUES ('suction_pressure',65.0),('discharge_pressure',243.0),('superheat',13.0),('subcooling',11.0),
               ('return_air_temp',74.0),('supply_air_temp',55.0),('delta_t',19.0),
               ('compressor_amps',17.7),('voltage',231.0),('ambient_temp',67.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA7: Jul 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga7,v_e13,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2025-07-15 11:00:00'
  FROM (VALUES ('suction_pressure',67.0),('discharge_pressure',250.0),('superheat',12.0),('subcooling',11.0),
               ('return_air_temp',76.0),('supply_air_temp',56.0),('delta_t',20.0),
               ('compressor_amps',18.4),('voltage',231.0),('ambient_temp',72.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GA8: Oct 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_ga8,v_e13,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2025-10-14 10:30:00'
  FROM (VALUES ('suction_pressure',65.0),('discharge_pressure',244.0),('superheat',13.0),('subcooling',11.0),
               ('return_air_temp',74.0),('supply_air_temp',54.0),('delta_t',20.0),
               ('compressor_amps',17.5),('voltage',232.0),('ambient_temp',70.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- ── READINGS — Trane TR22C13579 (West LA, mild seasonal variation) ────────

  -- GB1: Jan 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb1,v_e7,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2024-01-17 10:30:00'
  FROM (VALUES ('suction_pressure',63.0),('discharge_pressure',243.0),('superheat',14.0),('subcooling',11.0),
               ('return_air_temp',74.0),('supply_air_temp',55.0),('delta_t',19.0),
               ('compressor_amps',15.2),('voltage',231.0),('ambient_temp',65.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB2: Apr 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb2,v_e7,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2024-04-17 10:30:00'
  FROM (VALUES ('suction_pressure',64.0),('discharge_pressure',246.0),('superheat',14.0),('subcooling',11.0),
               ('return_air_temp',75.0),('supply_air_temp',55.0),('delta_t',20.0),
               ('compressor_amps',15.5),('voltage',231.0),('ambient_temp',72.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB3: Jul 2024 (summer — discharge near upper range, all within spec)
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb3,v_e7,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2024-07-17 11:00:00'
  FROM (VALUES ('suction_pressure',62.0),('discharge_pressure',256.0),('superheat',16.0),('subcooling',10.0),
               ('return_air_temp',78.0),('supply_air_temp',57.0),('delta_t',21.0),
               ('compressor_amps',16.8),('voltage',230.0),('ambient_temp',83.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB4: Oct 2024
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb4,v_e7,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2024-10-16 10:30:00'
  FROM (VALUES ('suction_pressure',64.0),('discharge_pressure',246.0),('superheat',14.0),('subcooling',11.0),
               ('return_air_temp',75.0),('supply_air_temp',55.0),('delta_t',20.0),
               ('compressor_amps',15.4),('voltage',231.0),('ambient_temp',74.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB5: Jan 2025 (minor top-off — readings all fine)
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb5,v_e7,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2025-01-15 10:30:00'
  FROM (VALUES ('suction_pressure',63.0),('discharge_pressure',242.0),('superheat',14.0),('subcooling',12.0),
               ('return_air_temp',74.0),('supply_air_temp',55.0),('delta_t',19.0),
               ('compressor_amps',15.1),('voltage',231.0),('ambient_temp',65.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB6: Apr 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb6,v_e7,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2025-04-16 10:30:00'
  FROM (VALUES ('suction_pressure',65.0),('discharge_pressure',245.0),('superheat',13.0),('subcooling',12.0),
               ('return_air_temp',75.0),('supply_air_temp',56.0),('delta_t',19.0),
               ('compressor_amps',15.3),('voltage',231.0),('ambient_temp',72.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB7: Jul 2025 (summer)
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb7,v_e7,v_tech2_id,rt.id,v.val,rt.unit,'manual',false,'2025-07-16 11:00:00'
  FROM (VALUES ('suction_pressure',63.0),('discharge_pressure',257.0),('superheat',15.0),('subcooling',10.0),
               ('return_air_temp',78.0),('supply_air_temp',57.0),('delta_t',21.0),
               ('compressor_amps',16.9),('voltage',230.0),('ambient_temp',83.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

  -- GB8: Oct 2025
  INSERT INTO readings (tenant_id,job_id,equipment_id,technician_id,reading_type_id,value,unit,source,is_flagged,captured_at)
  SELECT v_tenant_id,v_gb8,v_e7,v_tech1_id,rt.id,v.val,rt.unit,'manual',false,'2025-10-15 10:30:00'
  FROM (VALUES ('suction_pressure',64.0),('discharge_pressure',245.0),('superheat',14.0),('subcooling',11.0),
               ('return_air_temp',75.0),('supply_air_temp',55.0),('delta_t',20.0),
               ('compressor_amps',15.3),('voltage',231.0),('ambient_temp',74.0)) AS v(key,val)
  JOIN reading_types rt ON rt.key=v.key ON CONFLICT DO NOTHING;

END $$;
