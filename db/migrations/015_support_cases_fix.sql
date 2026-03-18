-- Fix support_cases schema to match server actions
-- Adds missing description + reported_by columns, and aligns priority values

ALTER TABLE support_cases ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE support_cases ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES profiles(id);

-- Add 'medium' to the priority check (original only had low/normal/high/urgent)
ALTER TABLE support_cases DROP CONSTRAINT IF EXISTS support_cases_priority_check;
ALTER TABLE support_cases ADD CONSTRAINT support_cases_priority_check
  CHECK (priority IN ('low', 'medium', 'normal', 'high', 'urgent'));
