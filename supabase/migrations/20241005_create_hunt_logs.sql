-- Hunt Logs Table - Complete environmental snapshot system
-- This is the CORE table that captures 40+ data points for every hunt

CREATE TABLE IF NOT EXISTS hunt_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL, -- Simple string ID for now (no auth yet)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Hunt Details
  hunt_date DATE NOT NULL,
  hunt_time TIME NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,

  species TEXT NOT NULL,
  outcome TEXT NOT NULL CHECK (outcome IN ('success', 'failure', 'scouting')),
  animals_seen INTEGER DEFAULT 0,
  animals_killed INTEGER DEFAULT 0,
  user_notes TEXT,

  -- Weather Snapshot (from Visual Crossing at exact hunt time)
  temperature DECIMAL(5, 2),
  feels_like DECIMAL(5, 2),
  humidity INTEGER,
  dew_point DECIMAL(5, 2),

  -- Pressure (CRITICAL for hunting)
  barometric_pressure DECIMAL(6, 2),
  pressure_1hr_ago DECIMAL(6, 2),
  pressure_3hr_ago DECIMAL(6, 2),
  pressure_6hr_ago DECIMAL(6, 2),
  pressure_trend TEXT CHECK (pressure_trend IN ('rising', 'falling', 'steady')),
  pressure_change_3hr DECIMAL(5, 2),
  pressure_change_6hr DECIMAL(5, 2),

  -- Wind
  wind_speed DECIMAL(5, 2),
  wind_gust DECIMAL(5, 2),
  wind_direction TEXT,
  wind_degrees INTEGER,

  -- Precipitation
  precipitation_amount DECIMAL(5, 2),
  precipitation_type TEXT,
  cloud_cover INTEGER,
  visibility DECIMAL(5, 2),

  -- Sky conditions
  conditions TEXT,
  uvi INTEGER,

  -- Sun timing (critical for dawn/dusk hunts)
  sunrise TIME,
  sunset TIME,
  minutes_from_sunrise INTEGER,
  minutes_from_sunset INTEGER,

  -- Lunar data
  moon_phase TEXT,
  moon_illumination INTEGER,
  moon_age INTEGER,
  solunar_score INTEGER,

  -- Additional context
  season TEXT,
  hunting_method TEXT,
  photo_urls TEXT[]
);

-- Indexes for fast pattern matching queries
CREATE INDEX IF NOT EXISTS idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_user_species ON hunt_logs(user_id, species);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_user_outcome ON hunt_logs(user_id, outcome);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_pressure_trend ON hunt_logs(user_id, pressure_trend);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_temperature ON hunt_logs(user_id, temperature);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_moon_phase ON hunt_logs(user_id, moon_phase);
CREATE INDEX IF NOT EXISTS idx_hunt_logs_location ON hunt_logs(user_id, latitude, longitude);
