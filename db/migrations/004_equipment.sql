-- =====================================================
-- Migration 004: Equipment
-- =====================================================

CREATE TABLE equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  site_id UUID NOT NULL REFERENCES sites(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,

  -- Identity
  manufacturer TEXT NOT NULL,
  model_number TEXT,
  serial_number TEXT,
  unit_name TEXT,

  -- Classification
  unit_type TEXT NOT NULL CHECK (unit_type IN (
    'split_ac', 'heat_pump', 'package_unit', 'mini_split',
    'furnace', 'boiler', 'chiller', 'air_handler',
    'condenser', 'evaporator_coil', 'rooftop_unit', 'other'
  )),
  location TEXT CHECK (location IN ('indoor', 'outdoor', 'both')),
  refrigerant_type TEXT,
  tonnage DECIMAL(6, 2),
  capacity_btu INTEGER,

  -- Dates & Warranty
  install_date DATE,
  warranty_expiry DATE,
  warranty_notes TEXT,

  -- Status
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired', 'decommissioned')),

  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_equipment_tenant ON equipment(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_equipment_site ON equipment(site_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_equipment_customer ON equipment(customer_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_equipment_serial ON equipment(serial_number) WHERE serial_number IS NOT NULL;

CREATE TRIGGER equipment_updated_at BEFORE UPDATE ON equipment
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
