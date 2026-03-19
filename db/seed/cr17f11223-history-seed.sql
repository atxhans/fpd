-- ============================================================
-- Historical readings for CR17F11223 (Carrier 38AUD042310)
-- Central Warehouse Co. · Compton, CA
-- 3.5 ton split AC, R-410A, installed 2017
--
-- Story arc (Jan 2024 – Feb 2026, monthly visits):
--   • Recurring refrigerant leak — suction pressure slowly drops,
--     superheat climbs; recharged twice but leak worsens
--   • Compressor degradation — amps creep up from ~18A to ~28A
--   • Discharge pressure can no longer be normalised by recharging
--   • By late 2025 / early 2026: multiple simultaneous critical readings,
--     unit flagged for replacement
-- ============================================================

DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001';
  v_e10       UUID := 'd0000000-0000-0000-0000-000000000010';
  v_s9        UUID := 'c0000000-0000-0000-0000-000000000009';
  v_c9        UUID := 'b0000000-0000-0000-0000-000000000009';

  v_tech1_id  UUID;
  v_tech2_id  UUID;
  v_owner_id  UUID;

  -- 26 monthly job IDs  (f-series, 01–26)
  v_jh01 UUID := 'f0000000-0000-0000-0000-000000000001';
  v_jh02 UUID := 'f0000000-0000-0000-0000-000000000002';
  v_jh03 UUID := 'f0000000-0000-0000-0000-000000000003';
  v_jh04 UUID := 'f0000000-0000-0000-0000-000000000004';
  v_jh05 UUID := 'f0000000-0000-0000-0000-000000000005';
  v_jh06 UUID := 'f0000000-0000-0000-0000-000000000006';
  v_jh07 UUID := 'f0000000-0000-0000-0000-000000000007';
  v_jh08 UUID := 'f0000000-0000-0000-0000-000000000008';
  v_jh09 UUID := 'f0000000-0000-0000-0000-000000000009';
  v_jh10 UUID := 'f0000000-0000-0000-0000-000000000010';
  v_jh11 UUID := 'f0000000-0000-0000-0000-000000000011';
  v_jh12 UUID := 'f0000000-0000-0000-0000-000000000012';
  v_jh13 UUID := 'f0000000-0000-0000-0000-000000000013';
  v_jh14 UUID := 'f0000000-0000-0000-0000-000000000014';
  v_jh15 UUID := 'f0000000-0000-0000-0000-000000000015';
  v_jh16 UUID := 'f0000000-0000-0000-0000-000000000016';
  v_jh17 UUID := 'f0000000-0000-0000-0000-000000000017';
  v_jh18 UUID := 'f0000000-0000-0000-0000-000000000018';
  v_jh19 UUID := 'f0000000-0000-0000-0000-000000000019';
  v_jh20 UUID := 'f0000000-0000-0000-0000-000000000020';
  v_jh21 UUID := 'f0000000-0000-0000-0000-000000000021';
  v_jh22 UUID := 'f0000000-0000-0000-0000-000000000022';
  v_jh23 UUID := 'f0000000-0000-0000-0000-000000000023';
  v_jh24 UUID := 'f0000000-0000-0000-0000-000000000024';
  v_jh25 UUID := 'f0000000-0000-0000-0000-000000000025';
  v_jh26 UUID := 'f0000000-0000-0000-0000-000000000026';

BEGIN

  SELECT id INTO v_tech1_id FROM auth.users WHERE email = 'mike@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech2_id FROM auth.users WHERE email = 'sarah@abchvac.com'  LIMIT 1;
  SELECT id INTO v_owner_id  FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;

  IF v_tech1_id IS NULL THEN
    RAISE EXCEPTION 'Seed users not found — run base seed first';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- JOBS  (one per month, alternating technicians)
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id,
                    assigned_technician_id, created_by,
                    service_category, priority, problem_description, resolution_summary,
                    status, scheduled_at, started_at, completed_at)
  VALUES
    -- 2024 ──────────────────────────────────────────────────────────────────
    (v_jh01, v_tenant_id, 'JOB-H001', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Annual maintenance visit.',
     'All readings within spec. Filters replaced. No issues found.',
     'completed', '2024-01-15 09:00:00', '2024-01-15 09:30:00', '2024-01-15 11:30:00'),

    (v_jh02, v_tenant_id, 'JOB-H002', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Readings normal. Slight downward trend in suction pressure noted in log.',
     'completed', '2024-02-12 09:00:00', '2024-02-12 09:30:00', '2024-02-12 11:00:00'),

    (v_jh03, v_tenant_id, 'JOB-H003', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Suction pressure continued slow decline. Trend flagged for monitoring.',
     'completed', '2024-03-11 09:00:00', '2024-03-11 09:30:00', '2024-03-11 11:00:00'),

    (v_jh04, v_tenant_id, 'JOB-H004', v_c9, v_s9, v_tech2_id, v_owner_id,
     'repair', 'high', 'Unit not reaching setpoint. Warm supply air.',
     'Found low refrigerant charge — slow leak suspected. Added 1.2 lbs R-410A, system returned to normal pressures.',
     'completed', '2024-04-09 09:00:00', '2024-04-09 09:30:00', '2024-04-09 12:00:00'),

    (v_jh05, v_tenant_id, 'JOB-H005', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Post-repair follow-up and monthly check.',
     'Unit operating normally after April recharge. All readings in spec.',
     'completed', '2024-05-14 09:00:00', '2024-05-14 09:30:00', '2024-05-14 11:00:00'),

    (v_jh06, v_tenant_id, 'JOB-H006', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection — summer startup check.',
     'System handling summer load well. Discharge pressure elevated due to 85°F ambient, within spec.',
     'completed', '2024-06-11 10:00:00', '2024-06-11 10:30:00', '2024-06-11 12:00:00'),

    (v_jh07, v_tenant_id, 'JOB-H007', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection — peak summer.',
     'Hot ambient. Discharge at upper normal limit (260 PSI). Monitoring closely.',
     'completed', '2024-07-09 10:00:00', '2024-07-09 10:30:00', '2024-07-09 12:00:00'),

    (v_jh08, v_tenant_id, 'JOB-H008', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Readings within spec. Slight suction pressure decline resumed.',
     'completed', '2024-08-13 09:00:00', '2024-08-13 09:30:00', '2024-08-13 11:00:00'),

    (v_jh09, v_tenant_id, 'JOB-H009', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Suction pressure declining steadily. Amps slightly elevated. Monitoring.',
     'completed', '2024-09-10 09:00:00', '2024-09-10 09:30:00', '2024-09-10 11:00:00'),

    (v_jh10, v_tenant_id, 'JOB-H010', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Suction at lower normal limit (55 PSI). Superheat high-normal at 19°F. Scheduled repair for next month.',
     'completed', '2024-10-08 09:00:00', '2024-10-08 09:30:00', '2024-10-08 11:00:00'),

    (v_jh11, v_tenant_id, 'JOB-H011', v_c9, v_s9, v_tech1_id, v_owner_id,
     'repair', 'high', 'Insufficient cooling. Low suction pressure alarm.',
     'Low refrigerant charge confirmed. Added 1.5 lbs R-410A. Compressor amps elevated — likely wear. Advised customer to plan for replacement.',
     'completed', '2024-11-12 09:00:00', '2024-11-12 09:30:00', '2024-11-12 12:30:00'),

    (v_jh12, v_tenant_id, 'JOB-H012', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Post-repair check and monthly inspection.',
     'Pressures normal after November recharge. Amps still elevated (20.2A). Unit functional.',
     'completed', '2024-12-10 09:00:00', '2024-12-10 09:30:00', '2024-12-10 11:00:00'),

    -- 2025 ──────────────────────────────────────────────────────────────────
    (v_jh13, v_tenant_id, 'JOB-H013', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Suction stable post-recharge. Amps remain elevated — compressor degradation suspected.',
     'completed', '2025-01-14 09:00:00', '2025-01-14 09:30:00', '2025-01-14 11:00:00'),

    (v_jh14, v_tenant_id, 'JOB-H014', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Suction pressure slowly declining again. Amps continuing to rise.',
     'completed', '2025-02-11 09:00:00', '2025-02-11 09:30:00', '2025-02-11 11:00:00'),

    (v_jh15, v_tenant_id, 'JOB-H015', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Discharge pressure creeping up alongside suction decline — pointing to compressor wear plus refrigerant loss.',
     'completed', '2025-03-11 09:00:00', '2025-03-11 09:30:00', '2025-03-11 11:00:00'),

    (v_jh16, v_tenant_id, 'JOB-H016', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Multiple readings at limits: suction 55 PSI, discharge 260 PSI, superheat 19°F. Recommended repair visit.',
     'completed', '2025-04-08 09:00:00', '2025-04-08 09:30:00', '2025-04-08 11:00:00'),

    (v_jh17, v_tenant_id, 'JOB-H017', v_c9, v_s9, v_tech1_id, v_owner_id,
     'repair', 'high', 'Unit not cooling. Multiple alarm conditions.',
     'Low refrigerant (3rd recharge in 13 months — confirmed slow leak). Discharge 265 PSI suggests compressor over-compression. Added 1.8 lbs R-410A. Strongly recommended replacement.',
     'completed', '2025-05-13 09:00:00', '2025-05-13 09:30:00', '2025-05-13 13:00:00'),

    (v_jh18, v_tenant_id, 'JOB-H018', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Post-repair follow-up.',
     'Suction improved to 62 PSI after recharge but discharge remains 269 PSI — above normal. Compressor amps 23.1A and rising.',
     'completed', '2025-06-10 10:00:00', '2025-06-10 10:30:00', '2025-06-10 12:00:00'),

    (v_jh19, v_tenant_id, 'JOB-H019', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection — peak summer.',
     'Discharge pressure 272 PSI — above normal range. Compressor wear confirmed by amps trend.',
     'completed', '2025-07-08 10:00:00', '2025-07-08 10:30:00', '2025-07-08 12:00:00'),

    (v_jh20, v_tenant_id, 'JOB-H020', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Discharge 275 PSI. Amps 24.0A. Suction declining again. Unit deteriorating faster.',
     'completed', '2025-08-12 09:00:00', '2025-08-12 09:30:00', '2025-08-12 11:00:00'),

    (v_jh21, v_tenant_id, 'JOB-H021', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Monthly inspection.',
     'Multiple out-of-range readings. Replacement quote issued to customer.',
     'completed', '2025-09-09 09:00:00', '2025-09-09 09:30:00', '2025-09-09 11:00:00'),

    (v_jh22, v_tenant_id, 'JOB-H022', v_c9, v_s9, v_tech2_id, v_owner_id,
     'repair', 'high', 'Unit running continuously, setpoint not reached.',
     'Suction 53 PSI, discharge 281 PSI, superheat 22°F. Added 1.0 lb R-410A (diminishing returns). Compressor replacement or full unit replacement required.',
     'completed', '2025-10-14 09:00:00', '2025-10-14 09:30:00', '2025-10-14 13:00:00'),

    (v_jh23, v_tenant_id, 'JOB-H023', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'emergency', 'Facility reporting unit barely cooling.',
     'Critical readings across all parameters. Compressor drawing 25.7A. Unit operating well below design spec. Replacement approved by customer.',
     'completed', '2025-11-11 09:00:00', '2025-11-11 09:30:00', '2025-11-11 12:00:00'),

    (v_jh24, v_tenant_id, 'JOB-H024', v_c9, v_s9, v_tech2_id, v_owner_id,
     'maintenance', 'emergency', 'Monthly inspection while awaiting replacement unit.',
     'Continued deterioration. Suction 48 PSI, discharge 290 PSI, amps 26.4A. Replacement ETA 3 weeks.',
     'completed', '2025-12-09 09:00:00', '2025-12-09 09:30:00', '2025-12-09 11:00:00'),

    -- 2026 ──────────────────────────────────────────────────────────────────
    (v_jh25, v_tenant_id, 'JOB-H025', v_c9, v_s9, v_tech1_id, v_owner_id,
     'maintenance', 'emergency', 'Emergency check — facility reports unit stopped cooling overnight.',
     'Unit running but severely degraded. Suction 46 PSI, discharge 295 PSI, amps 27.1A. Replacement parts on order.',
     'completed', '2026-01-14 09:00:00', '2026-01-14 09:30:00', '2026-01-14 11:00:00'),

    (v_jh26, v_tenant_id, 'JOB-H026', v_c9, v_s9, v_tech2_id, v_owner_id,
     'repair', 'emergency', 'Unit failure imminent. Final readings before replacement.',
     'Unit at end of life. Suction 44 PSI, discharge 300 PSI, compressor amps 27.9A. Replacement unit scheduled for installation next week.',
     'completed', '2026-02-11 09:00:00', '2026-02-11 09:30:00', '2026-02-11 12:00:00')

  ON CONFLICT (id) DO NOTHING;

  -- Link jobs to equipment via job_equipment
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id)
  VALUES
    (v_jh01, v_e10, v_tenant_id), (v_jh02, v_e10, v_tenant_id),
    (v_jh03, v_e10, v_tenant_id), (v_jh04, v_e10, v_tenant_id),
    (v_jh05, v_e10, v_tenant_id), (v_jh06, v_e10, v_tenant_id),
    (v_jh07, v_e10, v_tenant_id), (v_jh08, v_e10, v_tenant_id),
    (v_jh09, v_e10, v_tenant_id), (v_jh10, v_e10, v_tenant_id),
    (v_jh11, v_e10, v_tenant_id), (v_jh12, v_e10, v_tenant_id),
    (v_jh13, v_e10, v_tenant_id), (v_jh14, v_e10, v_tenant_id),
    (v_jh15, v_e10, v_tenant_id), (v_jh16, v_e10, v_tenant_id),
    (v_jh17, v_e10, v_tenant_id), (v_jh18, v_e10, v_tenant_id),
    (v_jh19, v_e10, v_tenant_id), (v_jh20, v_e10, v_tenant_id),
    (v_jh21, v_e10, v_tenant_id), (v_jh22, v_e10, v_tenant_id),
    (v_jh23, v_e10, v_tenant_id), (v_jh24, v_e10, v_tenant_id),
    (v_jh25, v_e10, v_tenant_id), (v_jh26, v_e10, v_tenant_id)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- READINGS
  -- Each row: (job_id, reading_type_key, value, is_flagged, flag_reason)
  -- Flagged = out of normal range (suction <55, discharge >260, superheat >20,
  --           subcooling <8, voltage <208)
  -- ──────────────────────────────────────────────────────────────────────────

  -- Helper macro: insert numeric readings for one job
  -- We use a single big INSERT ... SELECT with a VALUES list per job

  -- JOB-H001  2024-01  Normal winter maintenance
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh01, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-01-15 10:30:00'
  FROM (VALUES
    ('suction_pressure',   63.0),
    ('discharge_pressure', 245.0),
    ('superheat',          14.0),
    ('subcooling',         11.0),
    ('return_air_temp',    74.0),
    ('supply_air_temp',    55.0),
    ('delta_t',            19.0),
    ('compressor_amps',    17.8),
    ('voltage',            232.0),
    ('ambient_temp',       65.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H002  2024-02  Normal
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh02, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-02-12 10:30:00'
  FROM (VALUES
    ('suction_pressure',   62.0),
    ('discharge_pressure', 246.0),
    ('superheat',          15.0),
    ('subcooling',         11.0),
    ('return_air_temp',    75.0),
    ('supply_air_temp',    56.0),
    ('delta_t',            19.0),
    ('compressor_amps',    18.0),
    ('voltage',            231.0),
    ('ambient_temp',       68.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H003  2024-03  Slight decline starts
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh03, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-03-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   60.0),
    ('discharge_pressure', 247.0),
    ('superheat',          16.0),
    ('subcooling',         10.0),
    ('return_air_temp',    75.0),
    ('supply_air_temp',    56.0),
    ('delta_t',            19.0),
    ('compressor_amps',    18.2),
    ('voltage',            231.0),
    ('ambient_temp',       70.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H004  2024-04  Low suction + high superheat — FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh04, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2024-04-09 10:30:00'
  FROM (VALUES
    ('suction_pressure',   54.0, true,  'Below normal range (55–75 PSI). Low refrigerant charge.'),
    ('discharge_pressure', 248.0, false, ''),
    ('superheat',          21.0, true,  'Above normal range (10–20°F). Consistent with low charge.'),
    ('subcooling',          9.0, false, ''),
    ('return_air_temp',    76.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    18.8, false, ''),
    ('voltage',            230.0, false, ''),
    ('ambient_temp',       75.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H005  2024-05  After recharge — normal
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh05, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-05-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   64.0),
    ('discharge_pressure', 246.0),
    ('superheat',          13.0),
    ('subcooling',         12.0),
    ('return_air_temp',    75.0),
    ('supply_air_temp',    55.0),
    ('delta_t',            20.0),
    ('compressor_amps',    18.1),
    ('voltage',            231.0),
    ('ambient_temp',       78.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H006  2024-06  Summer — elevated discharge due to ambient heat
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh06, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-06-11 11:00:00'
  FROM (VALUES
    ('suction_pressure',   65.0),
    ('discharge_pressure', 258.0),
    ('superheat',          13.0),
    ('subcooling',         10.0),
    ('return_air_temp',    78.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            21.0),
    ('compressor_amps',    19.2),
    ('voltage',            229.0),
    ('ambient_temp',       85.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H007  2024-07  Peak summer — discharge at upper limit
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh07, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-07-09 11:00:00'
  FROM (VALUES
    ('suction_pressure',   64.0),
    ('discharge_pressure', 260.0),
    ('superheat',          14.0),
    ('subcooling',         10.0),
    ('return_air_temp',    79.0),
    ('supply_air_temp',    58.0),
    ('delta_t',            21.0),
    ('compressor_amps',    19.8),
    ('voltage',            228.0),
    ('ambient_temp',       90.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H008  2024-08  Summer wind-down — decline resuming
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh08, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-08-13 10:30:00'
  FROM (VALUES
    ('suction_pressure',   61.0),
    ('discharge_pressure', 257.0),
    ('superheat',          15.0),
    ('subcooling',         10.0),
    ('return_air_temp',    78.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            21.0),
    ('compressor_amps',    19.4),
    ('voltage',            229.0),
    ('ambient_temp',       88.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H009  2024-09  Continued decline
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh09, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-09-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   58.0),
    ('discharge_pressure', 252.0),
    ('superheat',          17.0),
    ('subcooling',         10.0),
    ('return_air_temp',    77.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            20.0),
    ('compressor_amps',    19.1),
    ('voltage',            230.0),
    ('ambient_temp',       82.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H010  2024-10  At lower limit
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh10, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-10-08 10:30:00'
  FROM (VALUES
    ('suction_pressure',   55.0),
    ('discharge_pressure', 249.0),
    ('superheat',          19.0),
    ('subcooling',          9.0),
    ('return_air_temp',    76.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            19.0),
    ('compressor_amps',    19.6),
    ('voltage',            229.0),
    ('ambient_temp',       75.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H011  2024-11  Low suction + high superheat + elevated amps — FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh11, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2024-11-12 10:30:00'
  FROM (VALUES
    ('suction_pressure',   51.0, true,  'Below normal range. Low refrigerant — second recharge in 7 months.'),
    ('discharge_pressure', 247.0, false, ''),
    ('superheat',          23.0, true,  'Above normal range. Consistent with low charge.'),
    ('subcooling',          8.0, false, ''),
    ('return_air_temp',    75.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            18.0, false, ''),
    ('compressor_amps',    20.5, false, ''),
    ('voltage',            229.0, false, ''),
    ('ambient_temp',       70.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H012  2024-12  After 2nd recharge — amps still elevated
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh12, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2024-12-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   65.0),
    ('discharge_pressure', 247.0),
    ('superheat',          13.0),
    ('subcooling',         12.0),
    ('return_air_temp',    74.0),
    ('supply_air_temp',    55.0),
    ('delta_t',            19.0),
    ('compressor_amps',    20.2),
    ('voltage',            230.0),
    ('ambient_temp',       65.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H013  2025-01  Stable but amps elevated
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh13, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2025-01-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   63.0),
    ('discharge_pressure', 248.0),
    ('superheat',          14.0),
    ('subcooling',         11.0),
    ('return_air_temp',    74.0),
    ('supply_air_temp',    55.0),
    ('delta_t',            19.0),
    ('compressor_amps',    20.4),
    ('voltage',            229.0),
    ('ambient_temp',       65.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H014  2025-02  Slow decline
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh14, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2025-02-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   61.0),
    ('discharge_pressure', 250.0),
    ('superheat',          15.0),
    ('subcooling',         11.0),
    ('return_air_temp',    74.0),
    ('supply_air_temp',    55.0),
    ('delta_t',            19.0),
    ('compressor_amps',    20.8),
    ('voltage',            229.0),
    ('ambient_temp',       68.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H015  2025-03  Discharge creeping up — compressor + refrigerant dual issue
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh15, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', false, '2025-03-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   58.0),
    ('discharge_pressure', 255.0),
    ('superheat',          17.0),
    ('subcooling',         10.0),
    ('return_air_temp',    75.0),
    ('supply_air_temp',    56.0),
    ('delta_t',            19.0),
    ('compressor_amps',    21.3),
    ('voltage',            228.0),
    ('ambient_temp',       70.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H016  2025-04  At limits on multiple readings
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_jh16, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', false, '2025-04-08 10:30:00'
  FROM (VALUES
    ('suction_pressure',   55.0),
    ('discharge_pressure', 260.0),
    ('superheat',          19.0),
    ('subcooling',          9.0),
    ('return_air_temp',    76.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            19.0),
    ('compressor_amps',    21.8),
    ('voltage',            228.0),
    ('ambient_temp',       75.0)
  ) AS vals(key, val) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H017  2025-05  3rd recharge — multiple FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh17, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-05-13 10:30:00'
  FROM (VALUES
    ('suction_pressure',   52.0, true,  'Below normal range. Third low-charge event in 13 months — active leak confirmed.'),
    ('discharge_pressure', 265.0, true,  'Above normal range. Compressor over-compression — mechanical wear suspected.'),
    ('superheat',          22.0, true,  'Above normal range. Combined effect of low charge and compressor inefficiency.'),
    ('subcooling',          8.0, false, ''),
    ('return_air_temp',    77.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    22.5, false, ''),
    ('voltage',            227.0, false, ''),
    ('ambient_temp',       78.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H018  2025-06  After recharge — discharge still high
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh18, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-06-10 11:00:00'
  FROM (VALUES
    ('suction_pressure',   62.0, false, ''),
    ('discharge_pressure', 269.0, true,  'Above normal range post-recharge. High-side issue independent of refrigerant charge.'),
    ('superheat',          15.0, false, ''),
    ('subcooling',         10.0, false, ''),
    ('return_air_temp',    78.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            21.0, false, ''),
    ('compressor_amps',    23.1, false, ''),
    ('voltage',            227.0, false, ''),
    ('ambient_temp',       85.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H019  2025-07  Discharge flagged — compressor degradation
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh19, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-07-08 11:00:00'
  FROM (VALUES
    ('suction_pressure',   60.0, false, ''),
    ('discharge_pressure', 272.0, true,  'Above normal range. Compressor valve wear causing high head pressure.'),
    ('superheat',          16.0, false, ''),
    ('subcooling',          9.0, false, ''),
    ('return_air_temp',    80.0, false, ''),
    ('supply_air_temp',    59.0, false, ''),
    ('delta_t',            21.0, false, ''),
    ('compressor_amps',    23.6, false, ''),
    ('voltage',            226.0, false, ''),
    ('ambient_temp',       90.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H020  2025-08  Discharge + very high amps
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh20, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-08-12 10:30:00'
  FROM (VALUES
    ('suction_pressure',   58.0, false, ''),
    ('discharge_pressure', 275.0, true,  'Above normal range. Worsening compressor valve efficiency.'),
    ('superheat',          18.0, false, ''),
    ('subcooling',          9.0, false, ''),
    ('return_air_temp',    79.0, false, ''),
    ('supply_air_temp',    58.0, false, ''),
    ('delta_t',            21.0, false, ''),
    ('compressor_amps',    24.0, false, ''),
    ('voltage',            226.0, false, ''),
    ('ambient_temp',       88.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H021  2025-09  Multiple out-of-range
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh21, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-09-09 10:30:00'
  FROM (VALUES
    ('suction_pressure',   56.0, false, ''),
    ('discharge_pressure', 277.0, true,  'Above normal range. Escalating high-side pressure.'),
    ('superheat',          19.0, false, ''),
    ('subcooling',          8.0, false, ''),
    ('return_air_temp',    77.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    24.4, false, ''),
    ('voltage',            226.0, false, ''),
    ('ambient_temp',       82.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H022  2025-10  Critical — suction + discharge + superheat
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh22, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-10-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   53.0, true,  'Below normal range. 4th low-charge event — active leak unresolved.'),
    ('discharge_pressure', 281.0, true,  'Above normal range. Severe compressor valve degradation.'),
    ('superheat',          22.0, true,  'Above normal range.'),
    ('subcooling',          8.0, false, ''),
    ('return_air_temp',    76.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    25.0, false, ''),
    ('voltage',            225.0, false, ''),
    ('ambient_temp',       75.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H023  2025-11  Critical — approaching failure
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh23, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-11-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   50.0, true,  'Below normal range. Unit severely undercharged.'),
    ('discharge_pressure', 285.0, true,  'Above normal range. Compressor at end of service life.'),
    ('superheat',          24.0, true,  'Above normal range.'),
    ('subcooling',          7.0, true,  'Below normal range (8–14°F).'),
    ('return_air_temp',    75.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            18.0, false, ''),
    ('compressor_amps',    25.7, false, ''),
    ('voltage',            225.0, false, ''),
    ('ambient_temp',       70.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H024  2025-12  Critical — awaiting replacement
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh24, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2025-12-09 10:30:00'
  FROM (VALUES
    ('suction_pressure',   48.0, true,  'Below normal range. Continued refrigerant loss.'),
    ('discharge_pressure', 290.0, true,  'Above normal range.'),
    ('superheat',          27.0, true,  'Above normal range.'),
    ('subcooling',          7.0, true,  'Below normal range.'),
    ('return_air_temp',    74.0, false, ''),
    ('supply_air_temp',    56.0, false, ''),
    ('delta_t',            18.0, false, ''),
    ('compressor_amps',    26.4, false, ''),
    ('voltage',            224.0, false, ''),
    ('ambient_temp',       65.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H025  2026-01  Near-failure
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh25, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2026-01-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   46.0, true,  'Critically low. Unit at ~65% of rated capacity.'),
    ('discharge_pressure', 295.0, true,  'Critically high. Compressor over-working against degraded valves.'),
    ('superheat',          29.0, true,  'Critically high.'),
    ('subcooling',          6.0, true,  'Below normal range.'),
    ('return_air_temp',    73.0, false, ''),
    ('supply_air_temp',    56.0, false, ''),
    ('delta_t',            17.0, false, ''),
    ('compressor_amps',    27.1, false, ''),
    ('voltage',            223.0, false, ''),
    ('ambient_temp',       65.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- JOB-H026  2026-02  End of life — replacement ordered
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_jh26, v_e10, v_tech2_id, rt.id, vals.val, rt.unit, 'manual',
         vals.flagged, NULLIF(vals.reason, ''), '2026-02-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   44.0, true,  'Critically low. Compressor no longer able to maintain pressure differential.'),
    ('discharge_pressure', 300.0, true,  'Critically high. Safety high-pressure cutout tripping intermittently.'),
    ('superheat',          31.0, true,  'Critically high. Severe undercharge and compressor inefficiency.'),
    ('subcooling',          5.0, true,  'Critically low. Liquid line not fully subcooled.'),
    ('return_air_temp',    73.0, false, ''),
    ('supply_air_temp',    55.0, false, ''),
    ('delta_t',            18.0, false, ''),
    ('compressor_amps',    27.9, false, ''),
    ('voltage',            222.0, false, ''),
    ('ambient_temp',       68.0, false, '')
  ) AS vals(key, val, flagged, reason) JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- DIAGNOSTIC RESULTS for flagged visits
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, severity, title, description, recommendation, source)
  VALUES
    -- Apr 2024
    (v_tenant_id, v_jh04, v_e10, 'warning',
     'Low suction pressure indicates refrigerant undercharge',
     'Suction 54 PSI (normal 55–75 PSI). Added 1.2 lbs R-410A.',
     'Inspect for refrigerant leak. Pressure-test system before next recharge.', 'rules'),

    -- Nov 2024
    (v_tenant_id, v_jh11, v_e10, 'warning',
     'Recurring low suction pressure — second event in 7 months',
     'Suction 51 PSI. Pattern suggests active slow leak.',
     'Perform leak search and repair before recharging again.', 'rules'),
    (v_tenant_id, v_jh11, v_e10, 'warning',
     'High superheat consistent with low refrigerant charge',
     'Superheat 23°F (normal 10–20°F).',
     'Restore refrigerant charge to manufacturer spec.', 'rules'),

    -- May 2025
    (v_tenant_id, v_jh17, v_e10, 'critical',
     'Third low-charge event — active refrigerant leak confirmed',
     'Suction 52 PSI. Three recharges in 13 months.',
     'Locate and repair leak immediately. Further recharges without repair are not cost-effective.', 'rules'),
    (v_tenant_id, v_jh17, v_e10, 'warning',
     'High discharge pressure suggests compressor valve wear',
     'Discharge 265 PSI (normal 225–260). Independent of refrigerant charge.',
     'Monitor compressor amps trend. Plan for compressor or unit replacement.', 'rules'),

    -- Jun 2025
    (v_tenant_id, v_jh18, v_e10, 'warning',
     'Discharge pressure remains elevated after recharge',
     'Discharge 269 PSI post-recharge confirms mechanical high-side issue.',
     'Evaluate compressor condition. High-side issue is independent of charge level.', 'rules'),

    -- Jul–Sep 2025
    (v_tenant_id, v_jh19, v_e10, 'warning',
     'Escalating discharge pressure — compressor valve degradation',
     'Discharge 272 PSI. Trend: +3 PSI/month since May.',
     'Schedule compressor replacement or full unit replacement.', 'rules'),
    (v_tenant_id, v_jh20, v_e10, 'critical',
     'High discharge pressure with elevated compressor amps',
     'Discharge 275 PSI, amps 24.0A. Combined indicators of compressor failure.',
     'Replace compressor or full unit. Operating in this condition risks complete failure.', 'rules'),
    (v_tenant_id, v_jh21, v_e10, 'critical',
     'Discharge pressure trend indicates imminent compressor failure',
     'Discharge 277 PSI. Amps 24.4A.',
     'Immediate replacement recommended. Continued operation risks sudden failure.', 'rules'),

    -- Oct 2025
    (v_tenant_id, v_jh22, v_e10, 'critical',
     'Fourth low-charge event — leak repair or unit replacement required',
     'Suction 53 PSI. Leak unresolved across 4 recharges.',
     'Further recharges without leak repair or unit replacement are not justified.', 'rules'),
    (v_tenant_id, v_jh22, v_e10, 'critical',
     'Critical discharge pressure — compressor near end of service life',
     'Discharge 281 PSI. Compressor replacement or full unit replacement required.',
     'Do not defer replacement. Risk of sudden complete failure is high.', 'rules'),

    -- Nov 2025
    (v_tenant_id, v_jh23, v_e10, 'critical',
     'Severe refrigerant undercharge across all pressure readings',
     'Suction 50 PSI, subcooling 7°F. Unit at ~60% rated capacity.',
     'Unit replacement approved. Expedite installation of replacement unit.', 'rules'),
    (v_tenant_id, v_jh23, v_e10, 'critical',
     'Discharge pressure critical — compressor at end of service life',
     'Discharge 285 PSI. Amps 25.7A.',
     'Unit condemned. Proceed with scheduled replacement.', 'rules'),

    -- Dec 2025
    (v_tenant_id, v_jh24, v_e10, 'critical',
     'Discharge pressure continues to climb — unit failure imminent',
     'Discharge 290 PSI. Replacement ETA 3 weeks.',
     'Monitor daily. Have backup cooling available in case of sudden failure.', 'rules'),

    -- Jan 2026
    (v_tenant_id, v_jh25, v_e10, 'critical',
     'Unit operating at critical undercharge — near failure state',
     'Suction 46 PSI. Compressor efficiency severely degraded.',
     'Expedite replacement unit delivery. Minimize runtime to extend until replacement.', 'rules'),
    (v_tenant_id, v_jh25, v_e10, 'critical',
     'High-pressure cutout tripping — immediate replacement required',
     'Discharge 295 PSI. Safety device activating intermittently.',
     'Do not reset cutout repeatedly. Install replacement unit as soon as possible.', 'rules'),

    -- Feb 2026
    (v_tenant_id, v_jh26, v_e10, 'critical',
     'End-of-life: compressor unable to maintain pressure differential',
     'Suction 44 PSI. Replacement unit scheduled.',
     'Decommission upon arrival of replacement unit.', 'rules'),
    (v_tenant_id, v_jh26, v_e10, 'critical',
     'End-of-life: discharge pressure at 300 PSI — unit condemned',
     'Discharge 300 PSI. Safety cutout tripping on every cycle.',
     'Unit is at end of life. Replace immediately.', 'rules')

  ON CONFLICT DO NOTHING;

END $$;
