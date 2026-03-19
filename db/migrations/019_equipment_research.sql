-- AI-generated model research cache: manufacturer info, specs, common repairs, recalls, manuals
ALTER TABLE equipment
  ADD COLUMN IF NOT EXISTS research_data JSONB,
  ADD COLUMN IF NOT EXISTS research_at   TIMESTAMPTZ;
