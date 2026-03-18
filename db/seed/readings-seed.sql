-- =====================================================
-- Readings Seed Data — Extended sample data
-- Run AFTER dev-seed.sql (requires existing tenant + tech users)
-- Creates 10 new customers/sites/jobs with varied readings
-- and diagnostic results for jobs with anomalies.
-- =====================================================

DO $$
DECLARE
  v_tenant_id  UUID := 'a0000000-0000-0000-0000-000000000001';
  v_tech1_id   UUID;
  v_tech2_id   UUID;
  v_tech3_id   UUID;
  v_owner_id   UUID;

  -- Customers b004–b013
  v_c4  UUID := 'b0000000-0000-0000-0000-000000000004';
  v_c5  UUID := 'b0000000-0000-0000-0000-000000000005';
  v_c6  UUID := 'b0000000-0000-0000-0000-000000000006';
  v_c7  UUID := 'b0000000-0000-0000-0000-000000000007';
  v_c8  UUID := 'b0000000-0000-0000-0000-000000000008';
  v_c9  UUID := 'b0000000-0000-0000-0000-000000000009';
  v_c10 UUID := 'b0000000-0000-0000-0000-000000000010';
  v_c11 UUID := 'b0000000-0000-0000-0000-000000000011';
  v_c12 UUID := 'b0000000-0000-0000-0000-000000000012';
  v_c13 UUID := 'b0000000-0000-0000-0000-000000000013';

  -- Sites c004–c013
  v_s4  UUID := 'c0000000-0000-0000-0000-000000000004';
  v_s5  UUID := 'c0000000-0000-0000-0000-000000000005';
  v_s6  UUID := 'c0000000-0000-0000-0000-000000000006';
  v_s7  UUID := 'c0000000-0000-0000-0000-000000000007';
  v_s8  UUID := 'c0000000-0000-0000-0000-000000000008';
  v_s9  UUID := 'c0000000-0000-0000-0000-000000000009';
  v_s10 UUID := 'c0000000-0000-0000-0000-000000000010';
  v_s11 UUID := 'c0000000-0000-0000-0000-000000000011';
  v_s12 UUID := 'c0000000-0000-0000-0000-000000000012';
  v_s13 UUID := 'c0000000-0000-0000-0000-000000000013';

  -- Equipment d005–d014
  v_e5  UUID := 'd0000000-0000-0000-0000-000000000005';
  v_e6  UUID := 'd0000000-0000-0000-0000-000000000006';
  v_e7  UUID := 'd0000000-0000-0000-0000-000000000007';
  v_e8  UUID := 'd0000000-0000-0000-0000-000000000008';
  v_e9  UUID := 'd0000000-0000-0000-0000-000000000009';
  v_e10 UUID := 'd0000000-0000-0000-0000-000000000010';
  v_e11 UUID := 'd0000000-0000-0000-0000-000000000011';
  v_e12 UUID := 'd0000000-0000-0000-0000-000000000012';
  v_e13 UUID := 'd0000000-0000-0000-0000-000000000013';
  v_e14 UUID := 'd0000000-0000-0000-0000-000000000014';

  -- Jobs e004–e013
  v_j4  UUID := 'e0000000-0000-0000-0000-000000000004';
  v_j5  UUID := 'e0000000-0000-0000-0000-000000000005';
  v_j6  UUID := 'e0000000-0000-0000-0000-000000000006';
  v_j7  UUID := 'e0000000-0000-0000-0000-000000000007';
  v_j8  UUID := 'e0000000-0000-0000-0000-000000000008';
  v_j9  UUID := 'e0000000-0000-0000-0000-000000000009';
  v_j10 UUID := 'e0000000-0000-0000-0000-000000000010';
  v_j11 UUID := 'e0000000-0000-0000-0000-000000000011';
  v_j12 UUID := 'e0000000-0000-0000-0000-000000000012';
  v_j13 UUID := 'e0000000-0000-0000-0000-000000000013';

BEGIN

  -- Get technician IDs from existing auth users
  SELECT id INTO v_tech1_id FROM auth.users WHERE email = 'mike@abchvac.com'   LIMIT 1;
  SELECT id INTO v_tech2_id FROM auth.users WHERE email = 'sarah@abchvac.com'  LIMIT 1;
  SELECT id INTO v_tech3_id FROM auth.users WHERE email = 'david@abchvac.com'  LIMIT 1;
  SELECT id INTO v_owner_id  FROM auth.users WHERE email = 'owner@abchvac.com' LIMIT 1;

  IF v_tech1_id IS NULL THEN
    RAISE EXCEPTION 'Technician users not found. Run dev-seed.sql first and ensure auth users exist.';
  END IF;

  -- ─────────────────────────────────────────────────────────────────────────
  -- CUSTOMERS
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO customers (id, tenant_id, name, email, phone, customer_type) VALUES
    (v_c4,  v_tenant_id, 'Johnson Residence',        'johnson@gmail.com',          '(310) 555-0401', 'residential'),
    (v_c5,  v_tenant_id, 'Plaza Hotel & Suites',     'engineering@plazahotel.com', '(213) 555-0502', 'commercial'),
    (v_c6,  v_tenant_id, 'Westside Elementary',      'facilities@westside.edu',    '(310) 555-0603', 'commercial'),
    (v_c7,  v_tenant_id, 'Harbor Medical Center',    'plant@harbormed.org',        '(213) 555-0704', 'commercial'),
    (v_c8,  v_tenant_id, 'Pacific Coast Mall',       'hvac@pacificmall.com',       '(310) 555-0805', 'commercial'),
    (v_c9,  v_tenant_id, 'Central Warehouse Co.',    'ops@centralwarehouse.com',   '(213) 555-0906', 'commercial'),
    (v_c10, v_tenant_id, 'Vista Office Park',        'mgmt@vistaofc.com',          '(310) 555-1007', 'commercial'),
    (v_c11, v_tenant_id, 'Sunset Grill & Bar',       'owner@sunsetgrill.com',      '(213) 555-1108', 'commercial'),
    (v_c12, v_tenant_id, 'Marina Bay Apartments',    'super@marinabay.com',        '(310) 555-1209', 'residential'),
    (v_c13, v_tenant_id, 'Riverside Industrial',     'maint@riverside-ind.com',    '(213) 555-1310', 'commercial')
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────────────────────────────────
  -- SITES
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO sites (id, tenant_id, customer_id, name, address_line1, city, state, zip, site_type) VALUES
    (v_s4,  v_tenant_id, v_c4,  'Johnson Home',              '2210 Maple Dr',          'Culver City',    'CA', '90230', 'residential'),
    (v_s5,  v_tenant_id, v_c5,  'Plaza Hotel - Roof Plant',  '800 Wilshire Blvd',      'Los Angeles',    'CA', '90017', 'commercial'),
    (v_s6,  v_tenant_id, v_c6,  'Westside Elementary',       '450 School Rd',          'West Los Angeles','CA', '90025', 'commercial'),
    (v_s7,  v_tenant_id, v_c7,  'Harbor Medical - HVAC',     '3500 Harbor View Dr',    'Long Beach',     'CA', '90802', 'commercial'),
    (v_s8,  v_tenant_id, v_c8,  'Pacific Mall - Food Court', '12200 Pacific Coast Hwy','Malibu',         'CA', '90265', 'commercial'),
    (v_s9,  v_tenant_id, v_c9,  'Central Warehouse',         '7777 Industrial Way',    'Compton',        'CA', '90221', 'commercial'),
    (v_s10, v_tenant_id, v_c10, 'Vista Office - Suite 200',  '3900 Wilshire Blvd',     'Los Angeles',    'CA', '90010', 'commercial'),
    (v_s11, v_tenant_id, v_c11, 'Sunset Grill',              '1040 Sunset Blvd',       'Hollywood',      'CA', '90028', 'commercial'),
    (v_s12, v_tenant_id, v_c12, 'Marina Bay - Building A',   '500 Marina Del Rey Ave', 'Marina Del Rey', 'CA', '90292', 'residential'),
    (v_s13, v_tenant_id, v_c13, 'Riverside Plant Floor',     '9900 Riverside Pkwy',    'Riverside',      'CA', '92501', 'commercial')
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────────────────────────────────
  -- EQUIPMENT
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO equipment (id, tenant_id, site_id, customer_id, manufacturer, model_number, serial_number, unit_type, refrigerant_type, tonnage, install_date, location, status) VALUES
    (v_e5,  v_tenant_id, v_s4,  v_c4,  'Rheem',    'RA1836AJ1NA',   'RH21A44321', 'split_ac',    'R-410A', 3.0, '2021-05-10', 'outdoor', 'active'),
    (v_e6,  v_tenant_id, v_s5,  v_c5,  'Carrier',  '50XCQ12A3A5',   'CR19B77654', 'rooftop_unit','R-410A', 10.0,'2019-03-22', 'outdoor', 'active'),
    (v_e7,  v_tenant_id, v_s6,  v_c6,  'Trane',    '4TTR4036H1',    'TR22C13579', 'split_ac',    'R-410A', 3.0, '2022-09-01', 'outdoor', 'active'),
    (v_e8,  v_tenant_id, v_s7,  v_c7,  'York',     'ZH060N0BNA21',  'YK18D24680', 'package_unit','R-410A', 5.0, '2018-11-14', 'outdoor', 'active'),
    (v_e9,  v_tenant_id, v_s8,  v_c8,  'Lennox',   'XC21-048-230',  'LX20E98765', 'split_ac',    'R-410A', 4.0, '2020-07-30', 'outdoor', 'active'),
    (v_e10, v_tenant_id, v_s9,  v_c9,  'Carrier',  '38AUD042310',   'CR17F11223', 'split_ac',    'R-410A', 3.5, '2017-04-18', 'outdoor', 'active'),
    (v_e11, v_tenant_id, v_s10, v_c10, 'Daikin',   'RZQ36TAVJU',    'DK23G55443', 'mini_split',  'R-410A', 3.0, '2023-01-20', 'both',    'active'),
    (v_e12, v_tenant_id, v_s11, v_c11, 'Trane',    'TTK060C100A2',  'TR16H88776', 'rooftop_unit','R-410A', 5.0, '2016-06-05', 'outdoor', 'active'),
    (v_e13, v_tenant_id, v_s12, v_c12, 'Goodman',  'GSX160481',     'GD22I33219', 'split_ac',    'R-410A', 4.0, '2022-03-11', 'outdoor', 'active'),
    (v_e14, v_tenant_id, v_s13, v_c13, 'Carrier',  '50XC060300',    'CR15J66654', 'rooftop_unit','R-410A', 20.0,'2015-09-08', 'outdoor', 'active')
  ON CONFLICT (id) DO NOTHING;

  -- ─────────────────────────────────────────────────────────────────────────
  -- JOBS (all completed so readings are meaningful)
  -- ─────────────────────────────────────────────────────────────────────────
  INSERT INTO jobs (id, tenant_id, job_number, customer_id, site_id, assigned_technician_id, created_by,
                    service_category, priority, problem_description, resolution_summary,
                    status, scheduled_at, started_at, completed_at) VALUES
    -- J4: Normal annual maintenance
    (v_j4,  v_tenant_id, 'JOB-0004', v_c4,  v_s4,  v_tech1_id, v_owner_id,
     'maintenance', 'normal',
     'Annual maintenance. No reported issues.',
     'Performed full maintenance inspection. All readings within spec. Filter replaced.',
     'completed', now()-'7 days'::interval, now()-'7 days'::interval+'1 hour'::interval, now()-'7 days'::interval+'3 hours'::interval),

    -- J5: High discharge pressure (dirty condenser)
    (v_j5,  v_tenant_id, 'JOB-0005', v_c5,  v_s5,  v_tech2_id, v_owner_id,
     'repair', 'high',
     'Rooftop unit running but not reaching setpoint. High head pressure alarm on BAS.',
     'Found condenser coil severely fouled. Cleaned coil, verified charge. Discharge pressure returned to normal.',
     'completed', now()-'5 days'::interval, now()-'5 days'::interval+'30 minutes'::interval, now()-'5 days'::interval+'2.5 hours'::interval),

    -- J6: Low refrigerant charge
    (v_j6,  v_tenant_id, 'JOB-0006', v_c6,  v_s6,  v_tech1_id, v_owner_id,
     'repair', 'normal',
     'System not cooling effectively. Student classrooms warm.',
     'Found low refrigerant charge. Located and repaired Schrader valve leak. Added 1.5 lbs R-410A.',
     'completed', now()-'4 days'::interval, now()-'4 days'::interval+'45 minutes'::interval, now()-'4 days'::interval+'3 hours'::interval),

    -- J7: Refrigerant leak detected
    (v_j7,  v_tenant_id, 'JOB-0007', v_c7,  v_s7,  v_tech3_id, v_owner_id,
     'repair', 'high',
     'Possible refrigerant leak. System not maintaining temp, slight odor reported.',
     'Electronic leak detector confirmed leak at evaporator coil. Brazed repair, pressure tested, recharged with 2 lbs R-410A. Documented per EPA 608.',
     'completed', now()-'3 days'::interval, now()-'3 days'::interval+'1 hour'::interval, now()-'3 days'::interval+'5 hours'::interval),

    -- J8: Low superheat / possible TXV issue
    (v_j8,  v_tenant_id, 'JOB-0008', v_c8,  v_s8,  v_tech2_id, v_owner_id,
     'repair', 'normal',
     'System short-cycling. Ice formation observed on suction line.',
     'Found TXV stuck open causing overfeeding. Replaced TXV, adjusted superheat to 12°F. System operating normally.',
     'completed', now()-'6 days'::interval, now()-'6 days'::interval+'1 hour'::interval, now()-'6 days'::interval+'4 hours'::interval),

    -- J9: High superheat / low charge + airflow restriction
    (v_j9,  v_tenant_id, 'JOB-0009', v_c9,  v_s9,  v_tech1_id, v_owner_id,
     'repair', 'normal',
     'Unit not cooling. Warm air from supply registers. Filter reportedly unchanged for 1 year.',
     'Found severely clogged filter causing airflow restriction and elevated superheat. Replaced filter, added 0.5 lbs R-410A for minor charge loss.',
     'completed', now()-'2 days'::interval, now()-'2 days'::interval+'30 minutes'::interval, now()-'2 days'::interval+'2 hours'::interval),

    -- J10: Airflow restriction only (low delta T)
    (v_j10, v_tenant_id, 'JOB-0010', v_c10, v_s10, v_tech3_id, v_owner_id,
     'maintenance', 'normal',
     'Recent renovation added walls — tenant complaints of uneven cooling.',
     'Found duct dampers nearly closed on two branches from renovation work. Adjusted dampers, verified airflow balancing.',
     'completed', now()-'8 days'::interval, now()-'8 days'::interval+'1 hour'::interval, now()-'8 days'::interval+'3 hours'::interval),

    -- J11: Low voltage issue
    (v_j11, v_tenant_id, 'JOB-0011', v_c11, v_s11, v_tech2_id, v_owner_id,
     'repair', 'high',
     'Compressor trips on overload repeatedly. Unit shutting down during peak hours.',
     'Found supply voltage dropping to 187V under load due to undersized wiring. Coordinated with electrician to upgrade service feed to unit.',
     'completed', now()-'10 days'::interval, now()-'10 days'::interval+'1 hour'::interval, now()-'10 days'::interval+'2 hours'::interval),

    -- J12: Normal repair, all readings good post-fix
    (v_j12, v_tenant_id, 'JOB-0012', v_c12, v_s12, v_tech1_id, v_owner_id,
     'repair', 'normal',
     'Condenser fan motor failed. Unit locked out.',
     'Replaced condenser fan motor and capacitor. Verified all readings within normal range before leaving.',
     'completed', now()-'1 day'::interval, now()-'1 day'::interval+'30 minutes'::interval, now()-'1 day'::interval+'2 hours'::interval),

    -- J13: Multiple issues — high discharge + high compressor amps
    (v_j13, v_tenant_id, 'JOB-0013', v_c13, v_s13, v_tech3_id, v_owner_id,
     'repair', 'high',
     'Large rooftop unit not cooling main production floor. Compressor running hot.',
     'Found overcharge of 3 lbs refrigerant combined with heavily fouled condenser causing high head pressure and compressor stress. Recovered excess refrigerant, cleaned condenser. System returned to spec.',
     'completed', now()-'12 days'::interval, now()-'12 days'::interval+'1 hour'::interval, now()-'12 days'::interval+'6 hours'::interval)
  ON CONFLICT (id) DO NOTHING;

  -- Job equipment links
  INSERT INTO job_equipment (job_id, equipment_id, tenant_id) VALUES
    (v_j4,  v_e5,  v_tenant_id),
    (v_j5,  v_e6,  v_tenant_id),
    (v_j6,  v_e7,  v_tenant_id),
    (v_j7,  v_e8,  v_tenant_id),
    (v_j8,  v_e9,  v_tenant_id),
    (v_j9,  v_e10, v_tenant_id),
    (v_j10, v_e11, v_tenant_id),
    (v_j11, v_e12, v_tenant_id),
    (v_j12, v_e13, v_tenant_id),
    (v_j13, v_e14, v_tenant_id)
  ON CONFLICT (job_id, equipment_id) DO NOTHING;

  -- ─────────────────────────────────────────────────────────────────────────
  -- READINGS
  -- Each job has a full set of readings. Values are tuned to reflect the
  -- scenario described in the job (normal, faulted, etc.)
  -- ─────────────────────────────────────────────────────────────────────────

  -- J4: Normal maintenance — all readings in spec
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j4, v_e5, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', now()-'7 days'::interval
  FROM (VALUES
    ('suction_pressure',   67.0),
    ('discharge_pressure', 245.0),
    ('superheat',          13.5),
    ('subcooling',         10.0),
    ('return_air_temp',    75.0),
    ('supply_air_temp',    54.5),
    ('delta_t',            20.5),
    ('ambient_temp',       85.0),
    ('voltage',            230.0),
    ('compressor_amps',    14.2),
    ('static_pressure',    0.65)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J5: High discharge pressure — condenser fouled
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j5, v_e6, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', now()-'5 days'::interval
  FROM (VALUES
    ('suction_pressure',   70.0),
    ('discharge_pressure', 292.0),  -- HIGH — triggers high_discharge_pressure alert
    ('superheat',          16.0),
    ('subcooling',         18.0),   -- elevated subcooling with high head
    ('return_air_temp',    78.0),
    ('supply_air_temp',    61.0),   -- warm supply due to high head
    ('delta_t',            17.0),
    ('ambient_temp',       92.0),
    ('voltage',            228.0),
    ('compressor_amps',    22.5),   -- elevated amps under high head load
    ('static_pressure',    0.72)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J6: Low refrigerant — low suction pressure, high superheat
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j6, v_e7, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', now()-'4 days'::interval
  FROM (VALUES
    ('suction_pressure',   48.5),   -- LOW — triggers low_refrigerant alert
    ('discharge_pressure', 215.0),  -- low head with low charge
    ('superheat',          31.0),   -- HIGH — triggers high_superheat alert
    ('subcooling',          4.5),   -- low subcooling with undercharge
    ('return_air_temp',    79.0),
    ('supply_air_temp',    64.0),   -- warm supply
    ('delta_t',            15.0),
    ('ambient_temp',       88.0),
    ('voltage',            232.0),
    ('compressor_amps',    11.0),
    ('refrigerant_added',   1.5)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J7: Refrigerant leak — leak_indicator true + low suction
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j7, v_e8, v_tech3_id, rt.id, vals.val, rt.unit, 'manual', now()-'3 days'::interval
  FROM (VALUES
    ('suction_pressure',   42.0),   -- LOW — triggers low_refrigerant
    ('discharge_pressure', 205.0),
    ('superheat',          38.0),   -- very HIGH — triggers high_superheat
    ('subcooling',          2.0),
    ('return_air_temp',    81.0),
    ('supply_air_temp',    69.0),
    ('delta_t',            12.0),
    ('ambient_temp',       87.0),
    ('voltage',            229.0),
    ('compressor_amps',    10.5),
    ('refrigerant_added',   2.0),
    ('refrigerant_recovered', 0.5)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J7: Leak indicator boolean reading
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, bool_value, unit, source, is_flagged, flag_reason, captured_at)
  SELECT v_tenant_id, v_j7, v_e8, v_tech3_id, rt.id, true, '', 'manual', true, 'Electronic leak detector confirmed at evaporator coil', now()-'3 days'::interval
  FROM reading_types rt WHERE rt.key = 'leak_indicator'
  ON CONFLICT DO NOTHING;

  -- J8: Low superheat — TXV overfeeding
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j8, v_e9, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', now()-'6 days'::interval
  FROM (VALUES
    ('suction_pressure',   78.0),   -- elevated suction with flooding
    ('discharge_pressure', 240.0),
    ('superheat',           4.5),   -- LOW — triggers low_superheat alert
    ('subcooling',         16.0),   -- high subcooling with overfeeding
    ('return_air_temp',    74.0),
    ('supply_air_temp',    53.0),
    ('delta_t',            21.0),
    ('ambient_temp',       86.0),
    ('voltage',            234.0),
    ('compressor_amps',    17.5),
    ('static_pressure',    0.61)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J9: High superheat + low delta T (clogged filter, slight undercharge)
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j9, v_e10, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', now()-'2 days'::interval
  FROM (VALUES
    ('suction_pressure',   52.0),   -- slightly low
    ('discharge_pressure', 238.0),
    ('superheat',          27.5),   -- HIGH — triggers high_superheat
    ('subcooling',          6.5),
    ('return_air_temp',    80.0),
    ('supply_air_temp',    69.0),
    ('delta_t',             8.0),   -- LOW — triggers airflow_restriction
    ('ambient_temp',       90.0),
    ('voltage',            231.0),
    ('compressor_amps',    13.8),
    ('static_pressure',    1.20),   -- HIGH static pressure — blocked filter
    ('refrigerant_added',   0.5)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J10: Airflow restriction (duct dampers closed — low delta T)
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j10, v_e11, v_tech3_id, rt.id, vals.val, rt.unit, 'manual', now()-'8 days'::interval
  FROM (VALUES
    ('suction_pressure',   65.0),
    ('discharge_pressure', 242.0),
    ('superheat',          22.0),
    ('subcooling',          9.0),
    ('return_air_temp',    76.0),
    ('supply_air_temp',    67.0),
    ('delta_t',             7.5),   -- LOW — triggers airflow_restriction
    ('ambient_temp',       82.0),
    ('indoor_temp',        77.0),
    ('voltage',            227.0),
    ('compressor_amps',    12.1),
    ('static_pressure',    1.05),   -- elevated static
    ('airflow_cfm',        580.0)   -- reduced CFM
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J11: Low voltage
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j11, v_e12, v_tech2_id, rt.id, vals.val, rt.unit, 'manual', now()-'10 days'::interval
  FROM (VALUES
    ('suction_pressure',   63.0),
    ('discharge_pressure', 252.0),
    ('superheat',          14.0),
    ('subcooling',         11.0),
    ('return_air_temp',    77.0),
    ('supply_air_temp',    57.0),
    ('delta_t',            20.0),
    ('ambient_temp',       88.0),
    ('voltage',            187.0),  -- LOW — triggers low_voltage alert
    ('compressor_amps',    24.0),   -- HIGH amps from low voltage (P=VI)
    ('fan_amps',            5.8)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J12: Normal post-repair (condenser fan replaced) — all in spec
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j12, v_e13, v_tech1_id, rt.id, vals.val, rt.unit, 'manual', now()-'1 day'::interval
  FROM (VALUES
    ('suction_pressure',   64.5),
    ('discharge_pressure', 238.0),
    ('superheat',          11.0),
    ('subcooling',          9.5),
    ('return_air_temp',    74.0),
    ('supply_air_temp',    53.5),
    ('delta_t',            20.5),
    ('ambient_temp',       84.0),
    ('voltage',            233.0),
    ('compressor_amps',    16.2),
    ('fan_amps',            3.4)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- J13: Multiple issues — overcharge (high discharge) + high compressor amps
  INSERT INTO readings (tenant_id, job_id, equipment_id, technician_id, reading_type_id, value, unit, source, captured_at)
  SELECT v_tenant_id, v_j13, v_e14, v_tech3_id, rt.id, vals.val, rt.unit, 'manual', now()-'12 days'::interval
  FROM (VALUES
    ('suction_pressure',   73.0),   -- elevated suction with overcharge
    ('discharge_pressure', 305.0),  -- HIGH — triggers high_discharge_pressure
    ('superheat',           6.0),   -- LOW — triggers low_superheat (overcharge)
    ('subcooling',         22.0),   -- very high subcooling = overcharged
    ('return_air_temp',    80.0),
    ('supply_air_temp',    62.0),
    ('delta_t',            18.0),
    ('ambient_temp',       95.0),
    ('voltage',            226.0),
    ('compressor_amps',    38.5),   -- HIGH — triggers compressor_high_amps
    ('fan_amps',            8.2),
    ('refrigerant_recovered', 3.0)
  ) AS vals(key, val)
  JOIN reading_types rt ON rt.key = vals.key
  ON CONFLICT DO NOTHING;

  -- ─────────────────────────────────────────────────────────────────────────
  -- DIAGNOSTIC RESULTS
  -- Generated for jobs where readings triggered rules
  -- ─────────────────────────────────────────────────────────────────────────

  -- J5: High discharge pressure
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j5, v_e6, dr.id, 'rules', dr.severity,
    dr.name,
    'Discharge pressure measured at 292 PSI — 12 PSI above the critical threshold of 280 PSI. Condenser coil fouling confirmed visually.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'high_discharge_pressure'
  ON CONFLICT DO NOTHING;

  -- J6: Low refrigerant
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j6, v_e7, dr.id, 'rules', dr.severity,
    dr.name,
    'Suction pressure at 48.5 PSI — well below the normal minimum of 55 PSI. System is approximately 1.5 lbs undercharged on R-410A.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'low_refrigerant'
  ON CONFLICT DO NOTHING;

  -- J6: High superheat (from low charge)
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j6, v_e7, dr.id, 'rules', dr.severity,
    dr.name,
    'Superheat measured at 31°F — significantly above the normal maximum of 20°F, consistent with low refrigerant charge.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'high_superheat'
  ON CONFLICT DO NOTHING;

  -- J7: Refrigerant leak
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j7, v_e8, dr.id, 'rules', dr.severity,
    dr.name,
    'Electronic leak detector alarmed positive at evaporator coil. Suction pressure 42 PSI (normal 55–75). System approximately 2 lbs undercharged.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'leak_detected'
  ON CONFLICT DO NOTHING;

  -- J7: Low refrigerant (from leak)
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j7, v_e8, dr.id, 'rules', dr.severity,
    dr.name,
    'Suction pressure at 42 PSI — severely below normal range. Directly caused by confirmed refrigerant leak at evaporator coil.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'low_refrigerant'
  ON CONFLICT DO NOTHING;

  -- J7: High superheat (from leak/undercharge)
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j7, v_e8, dr.id, 'rules', dr.severity,
    dr.name,
    'Superheat at 38°F — critically high. Consistent with severe undercharge from active leak.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'high_superheat'
  ON CONFLICT DO NOTHING;

  -- J8: Low superheat
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j8, v_e9, dr.id, 'rules', dr.severity,
    dr.name,
    'Superheat at 4.5°F — below the minimum safe threshold of 8°F. TXV is overfeeding the evaporator, risking liquid slugging.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'low_superheat'
  ON CONFLICT DO NOTHING;

  -- J9: High superheat
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j9, v_e10, dr.id, 'rules', dr.severity,
    dr.name,
    'Superheat at 27.5°F — above normal maximum of 20°F. Combined with low delta T, indicates both airflow restriction and slight undercharge.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'high_superheat'
  ON CONFLICT DO NOTHING;

  -- J9: Airflow restriction
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j9, v_e10, dr.id, 'rules', dr.severity,
    dr.name,
    'Delta T at 8°F — below the minimum of 15°F. Static pressure reading of 1.20 in WG confirms heavily restricted airflow. Filter replacement required.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'airflow_restriction'
  ON CONFLICT DO NOTHING;

  -- J10: Airflow restriction (duct dampers)
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j10, v_e11, dr.id, 'rules', dr.severity,
    dr.name,
    'Delta T at 7.5°F with static pressure of 1.05 in WG. Airflow measuring 580 CFM versus expected 1,050 CFM. Duct restriction identified from recent renovation.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'airflow_restriction'
  ON CONFLICT DO NOTHING;

  -- J11: Low voltage
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j11, v_e12, dr.id, 'rules', dr.severity,
    dr.name,
    'Supply voltage measured at 187V — 13V below the minimum acceptable 200V. Unit drawing 24A as a result of voltage sag, causing repeated overload trips.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'low_voltage'
  ON CONFLICT DO NOTHING;

  -- J13: High discharge pressure
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j13, v_e14, dr.id, 'rules', dr.severity,
    dr.name,
    'Discharge pressure at 305 PSI — 25 PSI above critical threshold. System overcharged by approximately 3 lbs R-410A. Condenser coil also fouled, compounding the issue.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'high_discharge_pressure'
  ON CONFLICT DO NOTHING;

  -- J13: Low superheat (overcharge)
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j13, v_e14, dr.id, 'rules', dr.severity,
    dr.name,
    'Superheat at 6°F with subcooling at 22°F — consistent with significant overcharge condition. Compressor liquid slugging risk.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'low_superheat'
  ON CONFLICT DO NOTHING;

  -- J13: High compressor amps
  INSERT INTO diagnostic_results (tenant_id, job_id, equipment_id, rule_id, source, severity, title, description, recommendation)
  SELECT v_tenant_id, v_j13, v_e14, dr.id, 'rules', dr.severity,
    dr.name,
    'Compressor drawing 38.5A under combined stress of overcharge and condenser fouling. Compressor operating well above nameplate rating.',
    dr.recommendation
  FROM diagnostic_rules dr WHERE dr.key = 'compressor_high_amps'
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Readings seed data inserted successfully — 10 sites, 10 jobs, varied readings and diagnostics.';

END $$;
