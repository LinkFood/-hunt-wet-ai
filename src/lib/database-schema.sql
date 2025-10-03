-- Hunt Wet AI Database Schema
-- Phase 1: Core hunting data architecture

-- User profiles and preferences
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Hunter profile data
  experience_level VARCHAR(50), -- 'beginner', 'intermediate', 'expert'
  preferred_weapon VARCHAR(50), -- 'rifle', 'bow', 'shotgun', 'muzzleloader'
  home_zip_code VARCHAR(10),
  hunting_style JSONB -- flexible JSON for hunting preferences
);

-- Every hunting conversation/session
CREATE TABLE hunting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Hunt context
  zip_code VARCHAR(10) NOT NULL,
  game_type VARCHAR(100), -- 'whitetail', 'elk', 'dove', 'turkey', etc.
  hunt_date DATE,
  weapon_type VARCHAR(50),
  
  -- User input
  user_message TEXT NOT NULL,
  user_context JSONB, -- additional context from user
  
  -- AI response
  ai_response TEXT NOT NULL,
  ai_confidence_score INTEGER, -- 1-100
  response_time_ms INTEGER,
  
  -- External data at time of request
  weather_data JSONB,
  moon_phase_data JSONB,
  regulations_checked BOOLEAN DEFAULT false,
  
  -- Learning data
  user_feedback INTEGER, -- 1-5 rating
  hunt_outcome VARCHAR(50), -- 'success', 'no_success', 'no_hunt', 'pending'
  outcome_details JSONB,
  
  -- Indexes for fast querying
  INDEX idx_zip_game (zip_code, game_type),
  INDEX idx_hunt_date (hunt_date),
  INDEX idx_user_sessions (user_id, created_at)
);

-- Success patterns by location and conditions
CREATE TABLE success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location
  zip_code VARCHAR(10) NOT NULL,
  game_type VARCHAR(100) NOT NULL,
  
  -- Conditions
  weather_pattern JSONB, -- temp, pressure, wind, precipitation
  moon_illumination INTEGER, -- 0-100
  season VARCHAR(50), -- 'early', 'peak', 'late'
  time_of_day TIME,
  
  -- Success metrics
  total_hunts INTEGER DEFAULT 0,
  successful_hunts INTEGER DEFAULT 0,
  success_rate DECIMAL(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_hunts > 0 
    THEN (successful_hunts::decimal / total_hunts::decimal) * 100 
    ELSE 0 END
  ) STORED,
  
  -- Statistical significance
  confidence_level DECIMAL(5,2), -- statistical confidence
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Indexes for pattern matching
  INDEX idx_location_game (zip_code, game_type),
  INDEX idx_success_rate (success_rate DESC),
  INDEX idx_statistical_significance (total_hunts DESC, confidence_level DESC)
);

-- Hunting regulations by state/county (Phase 1: basic structure)
CREATE TABLE hunting_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Location
  state_code VARCHAR(2) NOT NULL,
  county_name VARCHAR(100),
  zip_codes TEXT[], -- array of ZIP codes this applies to
  
  -- Game and season
  game_type VARCHAR(100) NOT NULL,
  season_name VARCHAR(100), -- 'archery', 'firearm', 'muzzleloader'
  
  -- Dates and times
  season_start DATE NOT NULL,
  season_end DATE NOT NULL,
  daily_start_time TIME, -- when hunting can start each day
  daily_end_time TIME, -- when hunting must end each day
  
  -- Restrictions
  bag_limit INTEGER,
  possession_limit INTEGER,
  weapon_restrictions JSONB,
  special_rules JSONB,
  
  -- Data source and validation
  source_url TEXT,
  last_verified TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false,
  
  -- Indexes for fast regulation lookup
  INDEX idx_state_game_season (state_code, game_type, season_start, season_end),
  INDEX idx_zip_lookup (zip_codes) USING GIN
);

-- ZIP code to state/county mapping for fast lookups
CREATE TABLE zip_code_locations (
  zip_code VARCHAR(10) PRIMARY KEY,
  state_code VARCHAR(2) NOT NULL,
  state_name VARCHAR(50) NOT NULL,
  county_name VARCHAR(100),
  city VARCHAR(100),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  timezone VARCHAR(50),
  
  -- Hunting-specific data
  hunting_zones TEXT[], -- state hunting zones/units
  land_type VARCHAR(50), -- 'urban', 'suburban', 'rural', 'wilderness'
  
  INDEX idx_state_county (state_code, county_name)
);

-- AI learning feedback for continuous improvement
CREATE TABLE ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hunting_session_id UUID REFERENCES hunting_sessions(id),
  
  -- Feedback type
  feedback_type VARCHAR(50), -- 'accuracy', 'helpfulness', 'safety', 'legality'
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  
  -- Detailed feedback
  feedback_text TEXT,
  improvement_suggestion TEXT,
  
  -- Follow-up data
  actual_hunt_outcome JSONB,
  would_recommend BOOLEAN,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Views for common queries

-- Success rates by ZIP and game type
CREATE VIEW zip_success_rates AS
SELECT 
  zip_code,
  game_type,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE hunt_outcome = 'success') as successful_hunts,
  ROUND(
    (COUNT(*) FILTER (WHERE hunt_outcome = 'success')::decimal / COUNT(*)::decimal) * 100, 
    2
  ) as success_rate
FROM hunting_sessions 
WHERE hunt_outcome IN ('success', 'no_success')
GROUP BY zip_code, game_type
HAVING COUNT(*) >= 3; -- minimum sample size

-- AI performance metrics
CREATE VIEW ai_performance AS
SELECT 
  DATE_TRUNC('week', created_at) as week,
  COUNT(*) as total_responses,
  AVG(user_feedback) as avg_feedback_score,
  AVG(ai_confidence_score) as avg_confidence,
  AVG(response_time_ms) as avg_response_time_ms
FROM hunting_sessions 
WHERE user_feedback IS NOT NULL
GROUP BY DATE_TRUNC('week', created_at)
ORDER BY week DESC;