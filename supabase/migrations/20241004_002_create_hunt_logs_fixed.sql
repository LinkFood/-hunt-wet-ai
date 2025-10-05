-- Hunt Wet AI Database Migration (Fixed)
-- Created: 2024-10-04
-- Purpose: Core hunt logging system with complete environmental snapshots
-- Philosophy: Capture EVERYTHING. In 25 years with 1,000 hunts = bulletproof patterns.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- TABLE: hunt_logs
-- =============================================================================
-- Complete snapshot of every hunt with 40+ environmental data points
-- This is the foundation of our pattern recognition system

CREATE TABLE hunt_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,  -- Removed FK constraint for now
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Hunt Core Details
  hunt_date DATE NOT NULL,
  hunt_time TIME NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,

  species TEXT NOT NULL, -- 'deer', 'duck', 'turkey', 'bear', etc.
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'scouting')),
  animals_seen INTEGER DEFAULT 0 CHECK (animals_seen >= 0),
  animals_killed INTEGER DEFAULT 0 CHECK (animals_killed >= 0),
  user_notes TEXT,

  -- Weather Snapshot (from Visual Crossing at exact hunt time)
  temperature DECIMAL(5, 2) NOT NULL, -- Fahrenheit
  feels_like DECIMAL(5, 2) NOT NULL,
  humidity DECIMAL(5, 2) NOT NULL CHECK (humidity >= 0 AND humidity <= 100),
  dew_point DECIMAL(5, 2) NOT NULL,

  -- Barometric Pressure (CRITICAL for hunting pattern analysis)
  barometric_pressure DECIMAL(6, 2) NOT NULL, -- Millibars
  pressure_1hr_ago DECIMAL(6, 2),
  pressure_3hr_ago DECIMAL(6, 2),
  pressure_6hr_ago DECIMAL(6, 2),
  pressure_trend TEXT CHECK (pressure_trend IN ('rising', 'falling', 'steady')),
  pressure_change_3hr DECIMAL(5, 2), -- mb change over 3 hours
  pressure_change_6hr DECIMAL(5, 2), -- mb change over 6 hours

  -- Wind
  wind_speed DECIMAL(5, 2) NOT NULL CHECK (wind_speed >= 0), -- MPH
  wind_gust DECIMAL(5, 2) CHECK (wind_gust >= 0),
  wind_direction TEXT NOT NULL, -- 'N', 'NE', 'E', etc.
  wind_degrees INTEGER NOT NULL CHECK (wind_degrees >= 0 AND wind_degrees < 360),

  -- Precipitation
  precipitation_amount DECIMAL(5, 2) DEFAULT 0 CHECK (precipitation_amount >= 0), -- Inches
  precipitation_type TEXT DEFAULT 'none',
  cloud_cover DECIMAL(5, 2) DEFAULT 0 CHECK (cloud_cover >= 0 AND cloud_cover <= 100), -- Percentage
  visibility DECIMAL(5, 2) CHECK (visibility >= 0), -- Miles

  -- Sky Conditions
  conditions TEXT NOT NULL, -- 'Clear', 'Cloudy', 'Rain', 'Snow', etc.
  uvi INTEGER CHECK (uvi >= 0), -- UV index

  -- Sun Timing (critical for dawn/dusk hunts)
  sunrise TIME NOT NULL,
  sunset TIME NOT NULL,
  minutes_from_sunrise INTEGER NOT NULL, -- Negative = before sunrise
  minutes_from_sunset INTEGER NOT NULL,

  -- Lunar Data (moon phase impacts game activity)
  moon_phase TEXT NOT NULL, -- 'new', 'waxing_crescent', 'first_quarter', etc.
  moon_illumination INTEGER NOT NULL CHECK (moon_illumination >= 0 AND moon_illumination <= 100),
  moon_age INTEGER CHECK (moon_age >= 0 AND moon_age <= 29), -- Days since new moon
  solunar_score INTEGER NOT NULL CHECK (solunar_score >= 1 AND solunar_score <= 10),

  -- Additional Context
  season TEXT, -- 'archery', 'firearm', 'muzzleloader', etc.
  hunting_method TEXT, -- 'stand', 'stalk', 'blind', 'drive', etc.
  photo_urls TEXT[], -- Array of photo URLs

  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    latitude >= -90 AND latitude <= 90 AND
    longitude >= -180 AND longitude <= 180
  ),
  CONSTRAINT valid_animals CHECK (animals_killed <= animals_seen)
);

-- =============================================================================
-- INDEXES for fast pattern matching queries
-- =============================================================================

-- Primary lookups
CREATE INDEX idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);
CREATE INDEX idx_hunt_logs_user_species ON hunt_logs(user_id, species);
CREATE INDEX idx_hunt_logs_user_outcome ON hunt_logs(user_id, outcome);
CREATE INDEX idx_hunt_logs_created_at ON hunt_logs(created_at DESC);

-- Pattern matching indexes (for finding similar hunts)
CREATE INDEX idx_hunt_logs_pressure_trend ON hunt_logs(user_id, pressure_trend) WHERE outcome = 'success';
CREATE INDEX idx_hunt_logs_temperature ON hunt_logs(user_id, temperature) WHERE outcome = 'success';
CREATE INDEX idx_hunt_logs_moon_phase ON hunt_logs(user_id, moon_phase) WHERE outcome = 'success';
CREATE INDEX idx_hunt_logs_wind_direction ON hunt_logs(user_id, wind_direction) WHERE outcome = 'success';

-- Location-based search
CREATE INDEX idx_hunt_logs_location ON hunt_logs(user_id, latitude, longitude);

-- Composite index for common queries
CREATE INDEX idx_hunt_logs_user_species_outcome ON hunt_logs(user_id, species, outcome, hunt_date DESC);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
-- Users can only see and modify their own data

ALTER TABLE hunt_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Allow all for authenticated users (we'll handle auth in app layer for now)
CREATE POLICY "allow_all_authenticated" ON hunt_logs
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- COMMENTS for documentation
-- =============================================================================

COMMENT ON TABLE hunt_logs IS 'Complete environmental snapshot for every hunt. Foundation of pattern recognition system. Capture EVERYTHING - in 25 years this is gold.';

COMMENT ON COLUMN hunt_logs.barometric_pressure IS 'Current pressure at hunt time. CRITICAL: Falling pressure = prime hunting.';
COMMENT ON COLUMN hunt_logs.pressure_trend IS 'Direction of pressure change. Most important predictor of game activity.';
COMMENT ON COLUMN hunt_logs.minutes_from_sunrise IS 'Negative = before sunrise. Most successful hunts within 90 min of sunrise.';
COMMENT ON COLUMN hunt_logs.moon_illumination IS 'Percentage of moon visible. Impacts nocturnal feeding patterns.';
COMMENT ON COLUMN hunt_logs.solunar_score IS 'Hunting activity score 1-10. Higher = better predicted activity.';

-- =============================================================================
-- FUNCTIONS for analytics
-- =============================================================================

-- Function: Get user's success rate by pressure trend
CREATE OR REPLACE FUNCTION get_success_rate_by_pressure(
  p_user_id UUID,
  p_species TEXT DEFAULT NULL
)
RETURNS TABLE (
  pressure_trend TEXT,
  total_hunts BIGINT,
  successful_hunts BIGINT,
  success_rate DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.pressure_trend,
    COUNT(*) as total_hunts,
    COUNT(*) FILTER (WHERE h.outcome = 'success') as successful_hunts,
    ROUND(
      (COUNT(*) FILTER (WHERE h.outcome = 'success')::DECIMAL / COUNT(*)) * 100,
      2
    ) as success_rate
  FROM hunt_logs h
  WHERE h.user_id = p_user_id
    AND (p_species IS NULL OR h.species = p_species)
    AND h.pressure_trend IS NOT NULL
  GROUP BY h.pressure_trend
  ORDER BY success_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get user's success rate by moon phase
CREATE OR REPLACE FUNCTION get_success_rate_by_moon_phase(
  p_user_id UUID,
  p_species TEXT DEFAULT NULL
)
RETURNS TABLE (
  moon_phase TEXT,
  total_hunts BIGINT,
  successful_hunts BIGINT,
  success_rate DECIMAL(5, 2),
  avg_moon_illumination DECIMAL(5, 2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.moon_phase,
    COUNT(*) as total_hunts,
    COUNT(*) FILTER (WHERE h.outcome = 'success') as successful_hunts,
    ROUND(
      (COUNT(*) FILTER (WHERE h.outcome = 'success')::DECIMAL / COUNT(*)) * 100,
      2
    ) as success_rate,
    ROUND(AVG(h.moon_illumination), 2) as avg_moon_illumination
  FROM hunt_logs h
  WHERE h.user_id = p_user_id
    AND (p_species IS NULL OR h.species = p_species)
  GROUP BY h.moon_phase
  ORDER BY success_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Find similar past hunts (pattern matching)
CREATE OR REPLACE FUNCTION find_similar_hunts(
  p_user_id UUID,
  p_species TEXT,
  p_temperature DECIMAL,
  p_pressure_trend TEXT,
  p_moon_phase TEXT,
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  hunt_date DATE,
  outcome TEXT,
  animals_killed INTEGER,
  temperature DECIMAL,
  pressure_trend TEXT,
  moon_phase TEXT,
  similarity_score INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    h.hunt_date,
    h.outcome,
    h.animals_killed,
    h.temperature,
    h.pressure_trend,
    h.moon_phase,
    (
      -- Calculate similarity score (0-100)
      (CASE WHEN h.pressure_trend = p_pressure_trend THEN 40 ELSE 0 END) +
      (CASE WHEN ABS(h.temperature - p_temperature) <= 5 THEN 30 ELSE 0 END) +
      (CASE WHEN h.moon_phase = p_moon_phase THEN 30 ELSE 0 END)
    ) as similarity_score
  FROM hunt_logs h
  WHERE h.user_id = p_user_id
    AND h.species = p_species
    AND ABS(h.temperature - p_temperature) <= 10 -- Within 10°F
  ORDER BY
    similarity_score DESC,
    CASE WHEN h.outcome = 'success' THEN 0 ELSE 1 END,
    h.hunt_date DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT permissions
-- =============================================================================

-- Grant usage on functions to all (we'll handle auth in app)
GRANT EXECUTE ON FUNCTION get_success_rate_by_pressure(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_success_rate_by_moon_phase(UUID, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION find_similar_hunts(UUID, TEXT, DECIMAL, TEXT, TEXT, INTEGER) TO anon, authenticated;
