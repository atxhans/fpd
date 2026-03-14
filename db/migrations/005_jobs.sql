-- =====================================================
-- Migration 005: Jobs & Service Visits
-- =====================================================

CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_number TEXT NOT NULL,

  -- References
  customer_id UUID NOT NULL REFERENCES customers(id),
  site_id UUID NOT NULL REFERENCES sites(id),
  assigned_technician_id UUID REFERENCES profiles(id),
  created_by UUID NOT NULL REFERENCES profiles(id),

  -- Classification
  service_category TEXT NOT NULL DEFAULT 'maintenance' CHECK (service_category IN (
    'maintenance', 'repair', 'installation', 'inspection',
    'emergency', 'warranty', 'estimate', 'other'
  )),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'emergency')),

  -- Details
  problem_description TEXT,
  resolution_summary TEXT,
  follow_up_required BOOLEAN NOT NULL DEFAULT false,
  follow_up_notes TEXT,

  -- Scheduling
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Status
  status TEXT NOT NULL DEFAULT 'assigned' CHECK (status IN (
    'unassigned', 'assigned', 'in_progress', 'paused', 'completed', 'cancelled'
  )),

  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,

  UNIQUE(tenant_id, job_number)
);

CREATE INDEX idx_jobs_tenant ON jobs(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_technician ON jobs(assigned_technician_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_status ON jobs(tenant_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_jobs_scheduled ON jobs(tenant_id, scheduled_at) WHERE deleted_at IS NULL;

-- Auto-increment job number per tenant
CREATE SEQUENCE job_number_seq;

-- Job equipment associations (a job can cover multiple units)
CREATE TABLE job_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, equipment_id)
);

CREATE INDEX idx_job_equipment_job ON job_equipment(job_id);
CREATE INDEX idx_job_equipment_equipment ON job_equipment(equipment_id);

-- Notes (associated with job or equipment)
CREATE TABLE notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
  equipment_id UUID REFERENCES equipment(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES profiles(id),
  body TEXT NOT NULL,
  is_internal BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_notes_job ON notes(job_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_notes_equipment ON notes(equipment_id) WHERE deleted_at IS NULL;

-- Parts used / needed
CREATE TABLE job_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  part_number TEXT,
  description TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'needed' CHECK (status IN ('needed', 'ordered', 'installed', 'returned')),
  created_by UUID NOT NULL REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_job_parts_job ON job_parts(job_id);

CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER notes_updated_at BEFORE UPDATE ON notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER job_parts_updated_at BEFORE UPDATE ON job_parts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
