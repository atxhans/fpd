-- =====================================================
-- Migration 007: Diagnostics
-- =====================================================

-- Diagnostic rules (platform-configurable)
CREATE TABLE diagnostic_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  condition_expression JSONB NOT NULL, -- JSON-encoded rule conditions
  severity TEXT NOT NULL DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  category TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seed standard diagnostic rules
INSERT INTO diagnostic_rules (key, name, severity, category, condition_expression, recommendation) VALUES
  ('low_refrigerant',
   'Possible Low Refrigerant',
   'warning',
   'refrigerant',
   '{"type": "range", "reading": "suction_pressure", "max": 55}',
   'Suction pressure is below normal range. Inspect for refrigerant leak, check TXV, and verify charge level.'),
  ('high_discharge_pressure',
   'High Discharge Pressure',
   'warning',
   'pressure',
   '{"type": "range", "reading": "discharge_pressure", "min": 280}',
   'Discharge pressure elevated. Check for restricted condenser airflow, dirty coil, or overcharge.'),
  ('low_superheat',
   'Low Superheat',
   'warning',
   'refrigerant',
   '{"type": "range", "reading": "superheat", "max": 8}',
   'Superheat is low. Possible overcharge or TXV issue. Risk of liquid slugging the compressor.'),
  ('high_superheat',
   'High Superheat',
   'warning',
   'refrigerant',
   '{"type": "range", "reading": "superheat", "min": 25}',
   'Superheat is high. Possible low charge, restricted metering device, or low airflow across evaporator.'),
  ('airflow_restriction',
   'Possible Airflow Restriction',
   'warning',
   'airflow',
   '{"type": "range", "reading": "delta_t", "max": 10}',
   'Delta T is low. Check filter, evaporator coil, and blower operation. Possible duct restriction.'),
  ('compressor_high_amps',
   'Compressor Amperage High',
   'critical',
   'electrical',
   '{"type": "above_nameplate", "reading": "compressor_amps", "threshold": 1.1}',
   'Compressor drawing above nameplate amps. Check voltage, refrigerant charge, and compressor condition.'),
  ('low_voltage',
   'Low Supply Voltage',
   'warning',
   'electrical',
   '{"type": "range", "reading": "voltage", "max": 200}',
   'Supply voltage is low. Contact utility or inspect electrical supply to equipment.'),
  ('leak_detected',
   'Refrigerant Leak Detected',
   'critical',
   'refrigerant',
   '{"type": "boolean", "reading": "leak_indicator", "value": true}',
   'Refrigerant leak detected. Locate and repair leak before adding refrigerant. Document per EPA regulations.');

-- Diagnostic results per job
CREATE TABLE diagnostic_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id),
  rule_id UUID REFERENCES diagnostic_rules(id),

  -- For AI-generated results (future)
  source TEXT NOT NULL DEFAULT 'rules' CHECK (source IN ('rules', 'ai', 'manual')),
  ai_model TEXT,
  ai_prompt_version TEXT,

  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  recommendation TEXT NOT NULL,
  confidence DECIMAL(4, 3) DEFAULT 1.0, -- 0–1 confidence score

  is_acknowledged BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES profiles(id),
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_diagnostic_results_job ON diagnostic_results(job_id);
CREATE INDEX idx_diagnostic_results_equipment ON diagnostic_results(equipment_id);

-- Attachments (photos, files on jobs/equipment)
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES profiles(id),
  storage_path TEXT NOT NULL,
  filename TEXT NOT NULL,
  content_type TEXT,
  size_bytes INTEGER,
  caption TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_attachments_job ON attachments(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_attachments_equipment ON attachments(equipment_id) WHERE deleted_at IS NULL;

CREATE TRIGGER diagnostic_rules_updated_at BEFORE UPDATE ON diagnostic_rules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
