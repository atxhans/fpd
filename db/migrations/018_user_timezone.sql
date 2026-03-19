-- Add per-user timezone preference to profiles
-- Defaults to America/Chicago (US Central)
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS timezone TEXT NOT NULL DEFAULT 'America/Chicago';
