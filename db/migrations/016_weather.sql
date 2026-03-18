-- Add weather snapshot to jobs
-- Captures conditions at the time of the service visit (fetched from OpenWeather API)
-- Schema: { temp_f, feels_like_f, humidity, conditions, description, icon, wind_mph, fetched_at }

ALTER TABLE jobs ADD COLUMN IF NOT EXISTS weather_snapshot JSONB;
