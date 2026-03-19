-- ============================================================
-- Two failure-profile units — bi-monthly visits Jan 2024 – Mar 2026
--
-- Unit A: Trane 4TWR5030H1  serial TR16H88776  (ELECTRICAL FAILURE)
--   Van Nuys, CA · 2.5 ton split AC, R-410A, installed 2016
--   Story: persistent low utility voltage in the San Fernando Valley
--   causes repeated capacitor failures and progressive motor winding
--   damage. Refrigerant readings stay NORMAL throughout — the problem
--   is 100% electrical. Signature: falling voltage + rising amps.
--
-- Unit B: York YH048C10FS  serial YK18D24680  (CONDENSER FOULING)
--   Downey, CA · 4 ton rooftop, R-410A, installed 2018
--   Story: heavy industrial particulate in Downey causes the condenser
--   coils to foul 3-4× faster than normal. High discharge pressure,
--   HIGH subcooling (refrigerant backing up in the fouled condenser),
--   rising amps. DISTINCT from the Carrier refrigerant leak: suction
--   is NORMAL and subcooling is HIGH, not low.
--
-- Job series:  33000000 (Trane electrical)  44000000 (York condenser)
-- ============================================================

DO $$
DECLARE
  v_tenant_id UUID := 'a0000000-0000-0000-0000-000000000001';

  -- Equipment (new records, inserted below)
  v_e15 UUID := 'd0000000-0000-0000-0000-000000000015'; -- Trane electrical
  v_e16 UUID := 'd0000000-0000-0000-0000-000000000016'; -- York condenser

  -- Customers/sites from readings-seed (already exist)
  v_c11 UUID := 'b0000000-0000-0000-0000-000000000011'; -- Van Nuys customer
  v_s11 UUID := 'c0000000-0000-0000-0000-000000000011';
  v_c8  UUID := 'b0000000-0000-0000-0000-000000000008'; -- Downey customer
  v_s8  UUID := 'c0000000-0000-0000-0000-000000000008';

  v_tech1_id UUID;
  v_tech2_id UUID;
  v_owner_id UUID;

  -- Trane electrical job IDs (33xx series, 11 visits)
  v_el01 UUID := '33000000-0000-0000-0000-000000000001';
  v_el02 UUID := '33000000-0000-0000-0000-000000000002';
  v_el03 UUID := '33000000-0000-0000-0000-000000000003';
  v_el04 UUID := '33000000-0000-0000-0000-000000000004';
  v_el05 UUID := '33000000-0000-0000-0000-000000000005';
  v_el06 UUID := '33000000-0000-0000-0000-000000000006';
  v_el07 UUID := '33000000-0000-0000-0000-000000000007';
  v_el08 UUID := '33000000-0000-0000-0000-000000000008';
  v_el09 UUID := '33000000-0000-0000-0000-000000000009';
  v_el10 UUID := '33000000-0000-0000-0000-000000000010';
  v_el11 UUID := '33000000-0000-0000-0000-000000000011';

  -- York condenser job IDs (44xx series, 14 visits incl. emergency cleanings)
  v_cf01 UUID := '44000000-0000-0000-0000-000000000001';
  v_cf02 UUID := '44000000-0000-0000-0000-000000000002';
  v_cf03 UUID := '44000000-0000-0000-0000-000000000003';
  v_cf04 UUID := '44000000-0000-0000-0000-000000000004';
  v_cf05 UUID := '44000000-0000-0000-0000-000000000005';
  v_cf06 UUID := '44000000-0000-0000-0000-000000000006';
  v_cf07 UUID := '44000000-0000-0000-0000-000000000007';
  v_cf08 UUID := '44000000-0000-0000-0000-000000000008';
  v_cf09 UUID := '44000000-0000-0000-0000-000000000009';
  v_cf10 UUID := '44000000-0000-0000-0000-000000000010';
  v_cf11 UUID := '44000000-0000-0000-0000-000000000011';
  v_cf12 UUID := '44000000-0000-0000-0000-000000000012';
  v_cf13 UUID := '44000000-0000-0000-0000-000000000013';
  v_cf14 UUID := '44000000-0000-0000-0000-000000000014';

BEGIN

  SELECT id INTO v_tech1_id FROM auth.users WHERE email = 'mike@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech2_id FROM auth.users WHERE email = 'sarah@abchvac.com'  LIMIT 1;
  SELECT id INTO v_owner_id  FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;
  IF v_tech1_id IS NULL THEN
    RAISE EXCEPTION 'Seed users not found — run base seed first';
  END IF;

  -- ──────────────────────────────────────────────────────────────────────────
  -- EQUIPMENT RECORDS
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO equipment (id, tenant_id, site_id, customer_id,
    manufacturer, model_number, serial_number, unit_type,
    refrigerant_type, tonnage, install_date, location, status)
  VALUES
    (v_e15, v_tenant_id, v_s11, v_c11,
     'Trane', '4TWR5030H1', 'TR16H88776', 'split_ac',
     'R-410A', 2.5, '2016-05-12', 'outdoor', 'active'),
    (v_e16, v_tenant_id, v_s8, v_c8,
     'York', 'YH048C10FS', 'YK18D24680', 'rooftop_unit',
     'R-410A', 4.0, '2018-09-03', 'outdoor', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- JOBS — Trane TR16H88776  (electrical failure progression)
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id,
                    assigned_technician_id, created_by,
                    service_category, priority, problem_description, resolution_summary,
                    status, scheduled_at, started_at, completed_at)
  VALUES
    (v_el01, v_tenant_id, 'JOB-EL01', v_c11, v_s11, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Annual maintenance.',
     'All readings within spec. Voltage 230V, amps 13.0A. No issues.',
     'completed', '2024-01-10 09:00:00', '2024-01-10 09:30:00', '2024-01-10 11:00:00'),

    (v_el02, v_tenant_id, 'JOB-EL02', v_c11, v_s11, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Bi-monthly inspection.',
     'Voltage 227V — slight downward trend. Amps normal. Monitoring.',
     'completed', '2024-03-12 09:00:00', '2024-03-12 09:30:00', '2024-03-12 11:00:00'),

    (v_el03, v_tenant_id, 'JOB-EL03', v_c11, v_s11, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Pre-summer check.',
     'Voltage 223V. Amps 13.6A — within spec. Voltage trend flagged in log.',
     'completed', '2024-05-14 09:00:00', '2024-05-14 09:30:00', '2024-05-14 11:00:00'),

    (v_el04, v_tenant_id, 'JOB-EL04', v_c11, v_s11, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Summer inspection.',
     'Voltage 219V. Summer load pushing amps to 14.5A. Still within normal range but voltage continues declining.',
     'completed', '2024-07-09 10:00:00', '2024-07-09 10:30:00', '2024-07-09 12:00:00'),

    (v_el05, v_tenant_id, 'JOB-EL05', v_c11, v_s11, v_tech1_id, v_owner_id,
     'maintenance', 'high', 'Reported hard starts. Unit struggling to come on.',
     'Voltage 213V. Compressor amps 17.8A at startup — capacitor weakening. Low voltage accelerating capacitor degradation. Advised customer of utility voltage issue.',
     'completed', '2024-09-10 09:00:00', '2024-09-10 09:30:00', '2024-09-10 12:00:00'),

    (v_el06, v_tenant_id, 'JOB-EL06', v_c11, v_s11, v_tech2_id, v_owner_id,
     'repair', 'emergency', 'Unit will not start. Compressor locked out.',
     'Capacitor failed — run capacitor 45/5 µF open circuit. Replaced capacitor. Amps normalised to 13.4A after replacement. Voltage 211V — discussed utility company contact with customer.',
     'completed', '2024-11-19 09:00:00', '2024-11-19 09:30:00', '2024-11-19 12:30:00'),

    (v_el07, v_tenant_id, 'JOB-EL07', v_c11, v_s11, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Post-repair follow-up.',
     'Amps 13.4A — capacitor replacement effective. Voltage 216V. Utility still low — customer pursuing panel upgrade.',
     'completed', '2025-01-14 09:00:00', '2025-01-14 09:30:00', '2025-01-14 11:00:00'),

    (v_el08, v_tenant_id, 'JOB-EL08', v_c11, v_s11, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Bi-monthly inspection.',
     'Voltage 210V. Amps 15.2A — elevated but within range. Contactor showing burn marks. Recommend contactor replacement.',
     'completed', '2025-03-11 09:00:00', '2025-03-11 09:30:00', '2025-03-11 11:30:00'),

    (v_el09, v_tenant_id, 'JOB-EL09', v_c11, v_s11, v_tech1_id, v_owner_id,
     'repair', 'high', 'Intermittent lockouts. Unit cycling off on high-pressure cutout.',
     'Voltage 205V — below 208V minimum. Amps erratic (16–19A range). Replaced contactor (arc damage confirmed). Voltage sag is stressing the motor windings. Customer approved panel rewiring quote.',
     'completed', '2025-06-10 09:00:00', '2025-06-10 09:30:00', '2025-06-10 13:00:00'),

    (v_el10, v_tenant_id, 'JOB-EL10', v_c11, v_s11, v_tech2_id, v_owner_id,
     'maintenance', 'high', 'Monthly check while awaiting panel work.',
     'Voltage 203V. Amps 19.5A — compressor motor drawing excessive current. Winding resistance check indicates early insulation breakdown. Winding degradation confirmed.',
     'completed', '2025-10-07 09:00:00', '2025-10-07 09:30:00', '2025-10-07 12:30:00'),

    (v_el11, v_tenant_id, 'JOB-EL11', v_c11, v_s11, v_tech1_id, v_owner_id,
     'repair', 'emergency', 'Compressor not running. Tripping breaker on startup.',
     'Voltage 200V — critically low. Compressor drawing 22.4A (well above RLA). Motor winding insulation failure confirmed by megohm test. Unit requires compressor replacement or full replacement. Customer approved full unit replacement.',
     'completed', '2026-01-21 09:00:00', '2026-01-21 09:30:00', '2026-01-21 13:00:00')

  ON CONFLICT (id) DO NOTHING;

  -- Link Trane electrical jobs to equipment
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_el01, v_e15, v_tenant_id), (v_el02, v_e15, v_tenant_id),
    (v_el03, v_e15, v_tenant_id), (v_el04, v_e15, v_tenant_id),
    (v_el05, v_e15, v_tenant_id), (v_el06, v_e15, v_tenant_id),
    (v_el07, v_e15, v_tenant_id), (v_el08, v_e15, v_tenant_id),
    (v_el09, v_e15, v_tenant_id), (v_el10, v_e15, v_tenant_id),
    (v_el11, v_e15, v_tenant_id)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- JOBS — York YK18D24680  (condenser fouling)
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id,
                    assigned_technician_id, created_by,
                    service_category, priority, problem_description, resolution_summary,
                    status, scheduled_at, started_at, completed_at)
  VALUES
    (v_cf01, v_tenant_id, 'JOB-CF01', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Quarterly inspection.',
     'All readings within spec. Condenser coils moderately dirty — cleaned. Discharge 252 PSI, amps 23.5A.',
     'completed', '2024-02-06 09:00:00', '2024-02-06 09:30:00', '2024-02-06 12:00:00'),

    (v_cf02, v_tenant_id, 'JOB-CF02', v_c8, v_s8, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Quarterly inspection.',
     'Discharge 258 PSI — slightly elevated. Coils accumulating particulate faster than average. Downey industrial air quality noted.',
     'completed', '2024-04-09 09:00:00', '2024-04-09 09:30:00', '2024-04-09 11:30:00'),

    (v_cf03, v_tenant_id, 'JOB-CF03', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'high', 'Customer reports reduced cooling. Unit running long cycles.',
     'Discharge 271 PSI — above normal. Condenser severely fouled with industrial particulate and cotton debris. Emergency coil cleaning performed. Discharge dropped to 256 PSI post-cleaning. Recommend bi-monthly coil cleaning for this location.',
     'completed', '2024-06-11 09:00:00', '2024-06-11 09:30:00', '2024-06-11 14:00:00'),

    (v_cf04, v_tenant_id, 'JOB-CF04', v_c8, v_s8, v_tech1_id, v_owner_id,
     'maintenance', 'normal', 'Post-cleaning follow-up + quarterly inspection.',
     'Discharge 255 PSI post-cleaning — within normal range. Coils already showing light reaccumulation after 6 weeks.',
     'completed', '2024-08-13 09:00:00', '2024-08-13 09:30:00', '2024-08-13 11:30:00'),

    (v_cf05, v_tenant_id, 'JOB-CF05', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Bi-monthly inspection.',
     'Discharge 266 PSI — creeping above normal. Fouling returning quickly. Coil cleaning performed.',
     'completed', '2024-10-08 09:00:00', '2024-10-08 09:30:00', '2024-10-08 12:30:00'),

    (v_cf06, v_tenant_id, 'JOB-CF06', v_c8, v_s8, v_tech1_id, v_owner_id,
     'maintenance', 'high', 'Discharge pressure alarm triggered.',
     'Discharge 276 PSI — significantly above normal. Coils fouled despite cleaning 8 weeks ago. Full chemical coil cleaning performed. Discharge dropped to 258 PSI. Fouling rate is 3-4× normal — site-specific issue.',
     'completed', '2024-12-10 09:00:00', '2024-12-10 09:30:00', '2024-12-10 14:00:00'),

    (v_cf07, v_tenant_id, 'JOB-CF07', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Post-cleaning follow-up.',
     'Discharge 258 PSI post chemical clean. Amps 23.8A. Coils clean but site conditions require aggressive schedule.',
     'completed', '2025-02-11 09:00:00', '2025-02-11 09:30:00', '2025-02-11 11:30:00'),

    (v_cf08, v_tenant_id, 'JOB-CF08', v_c8, v_s8, v_tech1_id, v_owner_id,
     'maintenance', 'high', 'Reduced cooling capacity. Customer complaint.',
     'Discharge 270 PSI — fouling already significant only 8 weeks post-clean. Amps 26.0A. Coil cleaning performed. Discussed coil coating and protective screen options with customer.',
     'completed', '2025-04-08 09:00:00', '2025-04-08 09:30:00', '2025-04-08 13:00:00'),

    (v_cf09, v_tenant_id, 'JOB-CF09', v_c8, v_s8, v_tech2_id, v_owner_id,
     'repair', 'high', 'High head pressure fault. Unit cycling on high-pressure cutout.',
     'Discharge 282 PSI before cleaning. Condenser face completely blocked. Emergency cleaning — discharge dropped to 262 PSI. Subcooling persistently elevated (15°F) even post-clean, suggesting tube fouling starting inside coil. Recommend pressure-wash + chemical soak.',
     'completed', '2025-06-10 09:00:00', '2025-06-10 09:30:00', '2025-06-10 14:00:00'),

    (v_cf10, v_tenant_id, 'JOB-CF10', v_c8, v_s8, v_tech1_id, v_owner_id,
     'repair', 'emergency', 'Unit tripped off on high-pressure lockout. Critical cooling needed.',
     'Discharge 293 PSI — critical. Amps 29.5A — above RLA. Internal condenser tube fouling suspected alongside external coil fouling. Emergency cleaning reduced to 268 PSI but unit struggled to reach normal operating range. Customer approving condenser section replacement.',
     'completed', '2025-08-12 09:00:00', '2025-08-12 09:30:00', '2025-08-12 15:00:00'),

    (v_cf11, v_tenant_id, 'JOB-CF11', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'normal', 'Post-emergency follow-up.',
     'Discharge 265 PSI after prior emergency cleaning. Amps 24.8A. Improvement but not to baseline — internal tube fouling limiting full recovery.',
     'completed', '2025-09-09 09:00:00', '2025-09-09 09:30:00', '2025-09-09 11:30:00'),

    (v_cf12, v_tenant_id, 'JOB-CF12', v_c8, v_s8, v_tech1_id, v_owner_id,
     'maintenance', 'high', 'Discharge pressure climbing again. Customer concerned.',
     'Discharge 275 PSI — fouling at an accelerating rate. Internal coil deposits confirmed by borescope. External cleaning alone insufficient. Condenser coil section replacement estimate provided.',
     'completed', '2025-11-11 09:00:00', '2025-11-11 09:30:00', '2025-11-11 13:00:00'),

    (v_cf13, v_tenant_id, 'JOB-CF13', v_c8, v_s8, v_tech2_id, v_owner_id,
     'maintenance', 'high', 'Monthly check while awaiting condenser replacement.',
     'Discharge 279 PSI despite recent cleaning. Amps 27.2A. Internal tube deposits confirmed — cleaning no longer fully effective. Condenser section replacement parts on order.',
     'completed', '2026-01-13 09:00:00', '2026-01-13 09:30:00', '2026-01-13 12:00:00'),

    (v_cf14, v_tenant_id, 'JOB-CF14', v_c8, v_s8, v_tech1_id, v_owner_id,
     'repair', 'emergency', 'Unit off on high-pressure lockout. Facility down.',
     'Discharge 287 PSI. Amps 29.1A. Subcooling 16°F — refrigerant stacking in fouled condenser. Unit unable to maintain capacity. Emergency cleaning partial relief only (to 278 PSI). Condenser section replacement approved — parts ETA 2 weeks.',
     'completed', '2026-03-04 09:00:00', '2026-03-04 09:30:00', '2026-03-04 14:30:00')

  ON CONFLICT (id) DO NOTHING;

  -- Link York condenser jobs to equipment
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_cf01, v_e16, v_tenant_id), (v_cf02, v_e16, v_tenant_id),
    (v_cf03, v_e16, v_tenant_id), (v_cf04, v_e16, v_tenant_id),
    (v_cf05, v_e16, v_tenant_id), (v_cf06, v_e16, v_tenant_id),
    (v_cf07, v_e16, v_tenant_id), (v_cf08, v_e16, v_tenant_id),
    (v_cf09, v_e16, v_tenant_id), (v_cf10, v_e16, v_tenant_id),
    (v_cf11, v_e16, v_tenant_id), (v_cf12, v_e16, v_tenant_id),
    (v_cf13, v_e16, v_tenant_id), (v_cf14, v_e16, v_tenant_id)
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- READINGS — Trane TR16H88776 (electrical failure)
  -- Normal ranges: suction 65–75, discharge 240–265, superheat 10–20,
  --   subcooling 8–14, compressor_amps 12–16 (2.5 ton), voltage 208–240
  -- Flagged: voltage < 208V, compressor_amps > 17A
  -- ──────────────────────────────────────────────────────────────────────────

  -- EL01  Jan 2024 — Baseline, all normal
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el01, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual', false, '2024-01-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   67.0), ('discharge_pressure', 244.0),
    ('superheat',          13.0), ('subcooling',          11.0),
    ('return_air_temp',    74.0), ('supply_air_temp',     55.0),
    ('delta_t',            19.0), ('compressor_amps',     13.0),
    ('voltage',           230.0), ('ambient_temp',        65.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL02  Mar 2024 — Voltage dipping slightly, still normal
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el02, v_e15, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2024-03-12 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 246.0),
    ('superheat',          13.0), ('subcooling',          11.0),
    ('return_air_temp',    75.0), ('supply_air_temp',     56.0),
    ('delta_t',            19.0), ('compressor_amps',     13.2),
    ('voltage',           227.0), ('ambient_temp',        68.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL03  May 2024 — Voltage 223V, amps normal
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el03, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual', false, '2024-05-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 247.0),
    ('superheat',          14.0), ('subcooling',          11.0),
    ('return_air_temp',    75.0), ('supply_air_temp',     56.0),
    ('delta_t',            19.0), ('compressor_amps',     13.6),
    ('voltage',           223.0), ('ambient_temp',        75.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL04  Jul 2024 — Summer heat, voltage 219V, amps elevated (summer normal)
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el04, v_e15, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2024-07-09 11:00:00'
  FROM (VALUES
    ('suction_pressure',   67.0), ('discharge_pressure', 256.0),
    ('superheat',          15.0), ('subcooling',          10.0),
    ('return_air_temp',    78.0), ('supply_air_temp',     58.0),
    ('delta_t',            20.0), ('compressor_amps',     14.5),
    ('voltage',           219.0), ('ambient_temp',        92.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL05  Sep 2024 — Capacitor weakening; amps spike, voltage 213V
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_el05, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2024-09-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   67.0, false, ''),
    ('discharge_pressure', 250.0, false, ''),
    ('superheat',          14.0, false, ''),
    ('subcooling',         11.0, false, ''),
    ('return_air_temp',    76.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    17.8, true,  'Above normal range. Hard-start condition — capacitor beginning to fail under sustained low voltage.'),
    ('voltage',           213.0, false, ''),
    ('ambient_temp',       85.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL06  Nov 2024 — Capacitor failed; emergency repair. Amps 19.2A pre-repair
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_el06, v_e15, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2024-11-19 10:30:00'
  FROM (VALUES
    ('suction_pressure',   67.0, false, ''),
    ('discharge_pressure', 248.0, false, ''),
    ('superheat',          13.0, false, ''),
    ('subcooling',         11.0, false, ''),
    ('return_air_temp',    74.0, false, ''),
    ('supply_air_temp',    55.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    19.2, true,  'Above normal range. Capacitor open-circuit — compressor drawing locked-rotor amperage on startup. Capacitor replaced; post-repair amps 13.4A.'),
    ('voltage',           211.0, false, ''),
    ('ambient_temp',       68.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL07  Jan 2025 — Post-replacement, amps normalised
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el07, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual', false, '2025-01-14 10:30:00'
  FROM (VALUES
    ('suction_pressure',   67.0), ('discharge_pressure', 243.0),
    ('superheat',          13.0), ('subcooling',          11.0),
    ('return_air_temp',    74.0), ('supply_air_temp',     55.0),
    ('delta_t',            19.0), ('compressor_amps',     13.4),
    ('voltage',           216.0), ('ambient_temp',        65.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL08  Mar 2025 — Voltage 210V, amps 15.2A, contactor burn marks
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_el08, v_e15, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2025-03-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 245.0),
    ('superheat',          13.0), ('subcooling',          11.0),
    ('return_air_temp',    74.0), ('supply_air_temp',     55.0),
    ('delta_t',            19.0), ('compressor_amps',     15.2),
    ('voltage',           210.0), ('ambient_temp',        70.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL09  Jun 2025 — Voltage 205V FLAGGED; amps erratic, contactor replaced
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_el09, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-06-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   67.0, false, ''),
    ('discharge_pressure', 258.0, false, ''),
    ('superheat',          15.0, false, ''),
    ('subcooling',         10.0, false, ''),
    ('return_air_temp',    77.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    18.4, true,  'Above normal range. Erratic amp draw indicating contactor arc damage and motor winding stress from sustained low voltage.'),
    ('voltage',           205.0, true,  'Below minimum supply voltage (208V). Chronic low voltage is accelerating capacitor and contactor failures.'),
    ('ambient_temp',       88.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL10  Oct 2025 — Voltage 203V, amps 19.5A; winding insulation breakdown
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_el10, v_e15, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-10-07 10:30:00'
  FROM (VALUES
    ('suction_pressure',   66.0, false, ''),
    ('discharge_pressure', 248.0, false, ''),
    ('superheat',          14.0, false, ''),
    ('subcooling',         11.0, false, ''),
    ('return_air_temp',    75.0, false, ''),
    ('supply_air_temp',    56.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    19.5, true,  'Significantly above normal range. Motor drawing excess current — winding insulation breakdown confirmed by megohm test.'),
    ('voltage',           203.0, true,  'Below minimum supply voltage (208V). Motor operating under severe voltage stress.'),
    ('ambient_temp',       78.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- EL11  Jan 2026 — Voltage 200V, amps 22.4A; compressor failed
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_el11, v_e15, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2026-01-21 10:30:00'
  FROM (VALUES
    ('suction_pressure',   66.0, false, ''),
    ('discharge_pressure', 244.0, false, ''),
    ('superheat',          13.0, false, ''),
    ('subcooling',         11.0, false, ''),
    ('return_air_temp',    74.0, false, ''),
    ('supply_air_temp',    55.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    22.4, true,  'Critically above normal range. Motor winding insulation failure — compressor tripping breaker on startup. Unit requires compressor replacement.'),
    ('voltage',           200.0, true,  'Critically below minimum supply voltage (208V). 10-year low voltage history has caused progressive motor and component failure.'),
    ('ambient_temp',       65.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- READINGS — York YK18D24680 (condenser fouling)
  -- Normal: suction 65–75, discharge 240–265, superheat 10–20,
  --   subcooling 8–14, compressor_amps 22–26 (4-ton), voltage 208–240
  -- Flagged: discharge > 265, subcooling > 14, amps > 28
  -- Key signature: NORMAL suction, HIGH discharge, HIGH subcooling, HIGH amps
  -- ──────────────────────────────────────────────────────────────────────────

  -- CF01  Feb 2024 — Clean coils after winter, baseline
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_cf01, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2024-02-06 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 252.0),
    ('superheat',          13.0), ('subcooling',          12.0),
    ('return_air_temp',    76.0), ('supply_air_temp',     56.0),
    ('delta_t',            20.0), ('compressor_amps',     23.5),
    ('voltage',           231.0), ('ambient_temp',        62.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF02  Apr 2024 — Slight discharge rise, particulate accumulating
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_cf02, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual', false, '2024-04-09 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 258.0),
    ('superheat',          13.0), ('subcooling',          12.0),
    ('return_air_temp',    77.0), ('supply_air_temp',     57.0),
    ('delta_t',            20.0), ('compressor_amps',     23.8),
    ('voltage',           231.0), ('ambient_temp',        70.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF03  Jun 2024 — Significant fouling, discharge FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf03, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2024-06-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   69.0, false, ''),
    ('discharge_pressure', 271.0, true,  'Above normal range. Condenser coils heavily fouled with industrial particulate — restricting airflow and heat rejection.'),
    ('superheat',          12.0, false, ''),
    ('subcooling',         13.0, false, ''),
    ('return_air_temp',    79.0, false, ''),
    ('supply_air_temp',    59.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    25.8, false, ''),
    ('voltage',           230.0, false, ''),
    ('ambient_temp',       85.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF04  Aug 2024 — Post-cleaning follow-up, readings recovered
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_cf04, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual', false, '2024-08-13 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 255.0),
    ('superheat',          13.0), ('subcooling',          12.0),
    ('return_air_temp',    78.0), ('supply_air_temp',     57.0),
    ('delta_t',            21.0), ('compressor_amps',     23.8),
    ('voltage',           231.0), ('ambient_temp',        88.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF05  Oct 2024 — Fouling returning, discharge creeping back up
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf05, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2024-10-08 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0, false, ''),
    ('discharge_pressure', 268.0, true,  'Above normal range. Condenser fouling re-established within 8 weeks. Discharge pressure above 265 PSI threshold.'),
    ('superheat',          13.0, false, ''),
    ('subcooling',         13.0, false, ''),
    ('return_air_temp',    77.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    25.0, false, ''),
    ('voltage',           231.0, false, ''),
    ('ambient_temp',       75.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF06  Dec 2024 — Significant fouling again, discharge + amps elevated
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf06, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2024-12-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0, false, ''),
    ('discharge_pressure', 276.0, true,  'Significantly above normal range. Condenser coils fouled within 8 weeks. Compressor working against sustained high head pressure.'),
    ('superheat',          12.0, false, ''),
    ('subcooling',         14.0, false, ''),
    ('return_air_temp',    76.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    26.2, false, ''),
    ('voltage',           231.0, false, ''),
    ('ambient_temp',       65.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF07  Feb 2025 — Post chemical clean, baseline restored
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_cf07, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2025-02-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 258.0),
    ('superheat',          13.0), ('subcooling',          12.0),
    ('return_air_temp',    76.0), ('supply_air_temp',     56.0),
    ('delta_t',            20.0), ('compressor_amps',     23.8),
    ('voltage',           231.0), ('ambient_temp',        62.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF08  Apr 2025 — Already fouling again, discharge FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf08, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-04-08 10:30:00'
  FROM (VALUES
    ('suction_pressure',   69.0, false, ''),
    ('discharge_pressure', 270.0, true,  'Above normal range. Fouling re-established in only 8 weeks post-cleaning — industrial particulate load is extreme for this location.'),
    ('superheat',          12.0, false, ''),
    ('subcooling',         13.0, false, ''),
    ('return_air_temp',    78.0, false, ''),
    ('supply_air_temp',    58.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    26.0, false, ''),
    ('voltage',           230.0, false, ''),
    ('ambient_temp',       75.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF09  Jun 2025 — Emergency call; pre-clean readings, discharge + subcooling FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf09, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-06-10 10:30:00'
  FROM (VALUES
    ('suction_pressure',   69.0, false, ''),
    ('discharge_pressure', 282.0, true,  'Significantly above normal range. Condenser coil face fully blocked. Refrigerant unable to condense — liquid backing up in condenser.'),
    ('superheat',          11.0, false, ''),
    ('subcooling',         15.0, true,  'Above normal range. High subcooling confirms refrigerant stacking in the condenser due to restricted airflow — characteristic of severe condenser fouling.'),
    ('return_air_temp',    80.0, false, ''),
    ('supply_air_temp',    60.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    27.0, false, ''),
    ('voltage',           230.0, false, ''),
    ('ambient_temp',       87.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF10  Aug 2025 — Critical; discharge + amps + subcooling all FLAGGED
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf10, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-08-12 10:30:00'
  FROM (VALUES
    ('suction_pressure',   70.0, false, ''),
    ('discharge_pressure', 293.0, true,  'Critically above normal range. Safety high-pressure cutout tripping repeatedly. Internal coil tube fouling suspected alongside external blockage.'),
    ('superheat',          11.0, false, ''),
    ('subcooling',         16.0, true,  'Critically high. Liquid refrigerant stacking heavily in the condenser. Condenser unable to complete the refrigeration cycle at normal capacity.'),
    ('return_air_temp',    81.0, false, ''),
    ('supply_air_temp',    61.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    29.5, true,  'Above RLA (rated load amps). Compressor sustained operation against critical head pressure is causing motor overload.'),
    ('voltage',           229.0, false, ''),
    ('ambient_temp',       94.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF11  Sep 2025 — Post-emergency clean, partial recovery (tubes still fouled)
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, captured_at)
  SELECT v_tenant_id, v_cf11, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual', false, '2025-09-09 10:30:00'
  FROM (VALUES
    ('suction_pressure',   68.0), ('discharge_pressure', 265.0),
    ('superheat',          13.0), ('subcooling',          13.0),
    ('return_air_temp',    79.0), ('supply_air_temp',     58.0),
    ('delta_t',            21.0), ('compressor_amps',     24.8),
    ('voltage',           230.0), ('ambient_temp',        84.0)
  ) AS v(key, val) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF12  Nov 2025 — Fouling accelerating; discharge FLAGGED, internal damage
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf12, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2025-11-11 10:30:00'
  FROM (VALUES
    ('suction_pressure',   69.0, false, ''),
    ('discharge_pressure', 275.0, true,  'Above normal range. Fouling re-established in under 10 weeks. Borescope confirms internal tube deposits — external cleaning alone no longer sufficient.'),
    ('superheat',          12.0, false, ''),
    ('subcooling',         14.0, false, ''),
    ('return_air_temp',    77.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            20.0, false, ''),
    ('compressor_amps',    26.8, false, ''),
    ('voltage',           230.0, false, ''),
    ('ambient_temp',       72.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF13  Jan 2026 — High discharge despite recent clean; internal tube deposits
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf13, v_e16, v_tech2_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2026-01-13 10:30:00'
  FROM (VALUES
    ('suction_pressure',   69.0, false, ''),
    ('discharge_pressure', 279.0, true,  'Above normal range despite cleaning 8 weeks ago. Discharge floor rising — internal tube scale deposits are reducing effective heat-transfer surface.'),
    ('superheat',          12.0, false, ''),
    ('subcooling',         14.0, false, ''),
    ('return_air_temp',    76.0, false, ''),
    ('supply_air_temp',    57.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    27.2, false, ''),
    ('voltage',           231.0, false, ''),
    ('ambient_temp',       65.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- CF14  Mar 2026 — Critical; condenser section replacement required
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_cf14, v_e16, v_tech1_id, rt.id, v.val, rt.unit, 'manual',
         v.flagged, NULLIF(v.reason, ''), '2026-03-04 10:30:00'
  FROM (VALUES
    ('suction_pressure',   70.0, false, ''),
    ('discharge_pressure', 287.0, true,  'Critically above normal range. Emergency cleaning provided only marginal relief (to 278 PSI). Internal coil tube deposits have reduced effective capacity. Condenser section replacement required.'),
    ('superheat',          11.0, false, ''),
    ('subcooling',         16.0, true,  'Critically high. Refrigerant stacking in the fouled condenser. Even after partial cleaning the subcooling floor is 16°F, indicating permanently reduced coil surface.'),
    ('return_air_temp',    78.0, false, ''),
    ('supply_air_temp',    59.0, false, ''),
    ('delta_t',            19.0, false, ''),
    ('compressor_amps',    29.1, true,  'Above RLA. Compressor operating at dangerous amperage due to sustained high head pressure. Overload protection risk.'),
    ('voltage',           231.0, false, ''),
    ('ambient_temp',       72.0, false, '')
  ) AS v(key, val, flagged, reason) JOIN reading_types rt ON rt.key = v.key
  ON CONFLICT DO NOTHING;

  -- ──────────────────────────────────────────────────────────────────────────
  -- DIAGNOSTIC RESULTS
  -- ──────────────────────────────────────────────────────────────────────────

  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, severity, title, description, recommendation, source)
  VALUES
    -- Trane electrical failure ─────────────────────────────────────────────

    -- Sep 2024 (EL05)
    (v_tenant_id, v_el05, v_e15, 'warning',
     'Hard-start condition — capacitor weakening under low voltage',
     'Compressor amps 17.8A on startup (above 16A threshold). Supply voltage 213V driving premature capacitor failure.',
     'Test and replace run/start capacitor. Contact utility company regarding sustained low voltage supply.',
     'rules'),

    -- Nov 2024 (EL06)
    (v_tenant_id, v_el06, v_e15, 'critical',
     'Run capacitor open-circuit — compressor locked out',
     'Amps 19.2A at startup (locked-rotor amperage). Capacitor 45/5 µF confirmed open. Low utility voltage is primary cause.',
     'Replace capacitor immediately. Install hard-start kit to reduce startup amp draw under low-voltage conditions.',
     'rules'),

    -- Jun 2025 (EL09)
    (v_tenant_id, v_el09, v_e15, 'critical',
     'Supply voltage below 208V minimum — chronic undervoltage',
     'Voltage 205V. Below IEEE 1159 minimum threshold of 208V for 240V-rated equipment. Root cause of repeated capacitor failures.',
     'Contact utility company for voltage investigation. Consider installing a buck-boost transformer or voltage stabilizer.',
     'rules'),
    (v_tenant_id, v_el09, v_e15, 'warning',
     'Contactor arc damage from sustained low voltage',
     'Contactor contacts pitted and arcing — low voltage causes sustained high current draw, burning contacts.',
     'Replace contactor. Install hard-start kit. Address root-cause voltage issue to prevent recurrence.',
     'rules'),

    -- Oct 2025 (EL10)
    (v_tenant_id, v_el10, v_e15, 'critical',
     'Motor winding insulation failure — progressive dielectric breakdown',
     'Amps 19.5A and rising. Megohm test shows insulation resistance below 1 MΩ. Chronic undervoltage has caused thermal degradation of motor windings.',
     'Compressor replacement or full unit replacement required. Continued operation risks complete motor failure and refrigerant contamination.',
     'rules'),
    (v_tenant_id, v_el10, v_e15, 'critical',
     'Voltage 203V — severely below minimum operating threshold',
     'Three consecutive readings below 208V spanning 16 months. Motor failure directly attributable to sustained undervoltage.',
     'Do not continue operation until voltage supply is corrected. Install replacement unit and require utility-grade voltage stabilization.',
     'rules'),

    -- Jan 2026 (EL11)
    (v_tenant_id, v_el11, v_e15, 'critical',
     'Compressor motor winding failure — unit at end of service life',
     'Amps 22.4A (40% above RLA). Compressor tripping breaker on every start attempt. Motor insulation completely failed.',
     'Decommission compressor. Replace full unit — compressor alone is not cost-effective at this age given ongoing voltage issues.',
     'rules'),

    -- York condenser fouling ───────────────────────────────────────────────

    -- Jun 2024 (CF03)
    (v_tenant_id, v_cf03, v_e16, 'warning',
     'Condenser fouling causing elevated discharge pressure',
     'Discharge 271 PSI (above 265 PSI threshold). Industrial particulate load at Downey location causing accelerated coil fouling.',
     'Perform coil cleaning immediately. Increase inspection frequency to bi-monthly. Consider protective coil screen installation.',
     'rules'),

    -- Oct 2024 (CF05)
    (v_tenant_id, v_cf05, v_e16, 'warning',
     'Abnormal fouling rate — re-fouled within 8 weeks of last cleaning',
     'Discharge 268 PSI. Fouling rate 3-4× above normal. Industrial environment contributing to rapid reaccumulation.',
     'Increase cleaning schedule. Evaluate coil coating or protective screens to reduce fouling rate.',
     'rules'),

    -- Dec 2024 (CF06)
    (v_tenant_id, v_cf06, v_e16, 'warning',
     'Discharge pressure trend indicates persistent condenser airflow restriction',
     'Discharge 276 PSI and rising each cycle despite regular cleaning. Compressor amps elevated at 26.2A.',
     'Full chemical coil cleaning recommended. Consider physical coil protection measures to reduce fouling frequency.',
     'rules'),

    -- Jun 2025 (CF09)
    (v_tenant_id, v_cf09, v_e16, 'critical',
     'Severe condenser fouling — refrigerant stacking in condenser (high subcooling)',
     'Discharge 282 PSI. Subcooling 15°F (above 14°F threshold). High subcooling confirms liquid refrigerant unable to drain from condenser due to heat-rejection failure.',
     'Emergency coil cleaning required immediately. Inspect for internal tube fouling using borescope — external cleaning may no longer be sufficient.',
     'rules'),

    -- Aug 2025 (CF10)
    (v_tenant_id, v_cf10, v_e16, 'critical',
     'Critical head pressure — condenser capacity severely compromised',
     'Discharge 293 PSI, amps 29.5A (above RLA), subcooling 16°F. High-pressure safety cutout tripping.',
     'Emergency cleaning required. Evaluate condenser section replacement — internal tube fouling is limiting maximum achievable performance.',
     'rules'),
    (v_tenant_id, v_cf10, v_e16, 'critical',
     'Compressor operating above RLA — overload risk from sustained high head pressure',
     'Amps 29.5A in sustained operation. Running above rated load amps accelerates motor winding degradation.',
     'Reduce head pressure immediately. Do not operate at above-RLA conditions for extended periods.',
     'rules'),

    -- Nov 2025 (CF12)
    (v_tenant_id, v_cf12, v_e16, 'warning',
     'Internal condenser tube fouling — external cleaning no longer fully effective',
     'Discharge 275 PSI despite recent cleaning. Borescope confirms internal scale deposits reducing heat-transfer surface.',
     'Chemical descaling or condenser section replacement required. External cleaning alone will not restore performance.',
     'rules'),

    -- Jan 2026 (CF13)
    (v_tenant_id, v_cf13, v_e16, 'critical',
     'Discharge pressure floor rising — permanent loss of condenser capacity',
     'Discharge 279 PSI 8 weeks post-clean. Pre-cleaning baselines have risen 27 PSI over 2 years. Internal fouling is compounding external fouling.',
     'Condenser section replacement is the only lasting solution. Continued operation accelerates compressor wear.',
     'rules'),

    -- Mar 2026 (CF14)
    (v_tenant_id, v_cf14, v_e16, 'critical',
     'Condenser section at end of effective service life — replacement required',
     'Discharge 287 PSI, subcooling 16°F, amps 29.1A. Emergency cleaning reduced to 278 PSI only. Internal tube deposits have permanently reduced effective surface area by an estimated 35%.',
     'Replace condenser coil section. Do not defer — continued operation risks compressor failure and refrigerant loss.',
     'rules'),
    (v_tenant_id, v_cf14, v_e16, 'critical',
     'Compressor overload risk — sustained high head pressure',
     'Amps 29.1A with no path to recovery without condenser replacement. Compressor overload protection may be inadequate for this failure mode.',
     'Verify overload protection settings. Limit runtime until condenser replacement. Consider temporary capacity reduction.',
     'rules')

  ON CONFLICT DO NOTHING;

END $$;
