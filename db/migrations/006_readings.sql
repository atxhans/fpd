-- =====================================================
-- Migration 006: Readings & Measurements
-- =====================================================

-- Reading type definitions (configurable per platform)
CREATE TABLE reading_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  label TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'pressure', 'temperature', 'electrical', 'airflow',
    'refrigerant', 'humidity', 'other'
  )),
  unit TEXT NOT NULL,
  unit_label TEXT,
  min_value DECIMAL,
  max_value DECIMAL,
  normal_min DECIMAL,
  normal_max DECIMAL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard HVAC reading types
INSERT INTO reading_types (key, label, category, unit, unit_label, normal_min, normal_max) VALUES
  ('suction_pressure',     'Suction Pressure',         'pressure',    'psi',  'PSI',    55,   75),
  ('discharge_pressure',   'Discharge Pressure',       'pressure',    'psi',  'PSI',   225,  260),
  ('superheat',            'Superheat',                'temperature', 'F',    '°F',     10,   20),
  ('subcooling',           'Subcooling',               'temperature', 'F',    '°F',     8,   14),
  ('return_air_temp',      'Return Air Temp',          'temperature', 'F',    '°F',     70,   80),
  ('supply_air_temp',      'Supply Air Temp',          'temperature', 'F',    '°F',     52,   58),
  ('delta_t',              'Delta T (ΔT)',              'temperature', 'F',    '°F',     15,   22),
  ('ambient_temp',         'Ambient Outdoor Temp',     'temperature', 'F',    '°F',   NULL, NULL),
  ('indoor_temp',          'Indoor Temperature',       'temperature', 'F',    '°F',     70,   78),
  ('humidity',             'Relative Humidity',        'humidity',    '%',    '%',      30,   60),
  ('static_pressure',      'Static Pressure',          'pressure',    'in_wg','in WG', 0.5, 0.8),
  ('airflow_cfm',          'Airflow / CFM',            'airflow',     'cfm',  'CFM',  NULL, NULL),
  ('compressor_amps',      'Compressor Amps',          'electrical',  'A',    'A',    NULL, NULL),
  ('fan_amps',             'Fan Amps',                 'electrical',  'A',    'A',    NULL, NULL),
  ('voltage',              'Supply Voltage',           'electrical',  'V',    'V',     208,  240),
  ('leak_indicator',       'Leak Detected',            'refrigerant', 'bool', '',     NULL, NULL),
  ('refrigerant_added',    'Refrigerant Added',        'refrigerant', 'lbs',  'lbs',  NULL, NULL),
  ('refrigerant_recovered','Refrigerant Recovered',    'refrigerant', 'lbs',  'lbs',  NULL, NULL);

-- Readings (actual captured measurements)
CREATE TABLE readings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),
  technician_id UUID NOT NULL REFERENCES profiles(id),
  reading_type_id UUID NOT NULL REFERENCES reading_types(id),

  -- Values
  raw_value JSONB,          -- Original captured value (for future device ingestion)
  value DECIMAL,            -- Normalized numeric value
  bool_value BOOLEAN,       -- For boolean readings (leak_indicator)
  text_value TEXT,          -- For freeform readings
  unit TEXT,                -- Unit at time of capture

  -- Context
  refrigerant_type TEXT,
  technician_notes TEXT,
  is_flagged BOOLEAN NOT NULL DEFAULT false,
  flag_reason TEXT,

  -- Source
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'device', 'import', 'api')),
  device_id TEXT,           -- Future: tool/device identifier

  captured_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_readings_job ON readings(job_id);
CREATE INDEX idx_readings_equipment ON readings(equipment_id);
CREATE INDEX idx_readings_technician ON readings(technician_id);
CREATE INDEX idx_readings_tenant ON readings(tenant_id);
CREATE INDEX idx_readings_captured ON readings(tenant_id, captured_at);
