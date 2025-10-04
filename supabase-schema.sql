-- HUNT WET AI DATABASE SCHEMA
-- Core principle: CAPTURE EVERYTHING, ANALYZE LATER
-- Every search, every interaction, every outcome = DATA = MOAT

-- =============================================================================
-- TABLE: locations
-- Purpose: Track every unique location users search
-- Data value: Search frequency, popular hunting areas, geographic patterns
-- =============================================================================
CREATE TABLE IF NOT EXISTS locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Core location data (lat/lon primary)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  display_name TEXT NOT NULL,  -- "Baltimore, MD"
  display_zip TEXT,             -- "21286"

  -- Geographic metadata
  city TEXT,
  state_code TEXT,              -- "MD"
  state_name TEXT,              -- "Maryland"
  county TEXT,

  -- Usage tracking (DATA GOLD)
  search_count INTEGER DEFAULT 0,
  last_searched_at TIMESTAMP WITH TIME ZONE,
  unique_users INTEGER DEFAULT 0,

  -- Indexes for performance
  UNIQUE(latitude, longitude)
);

CREATE INDEX IF NOT EXISTS idx_locations_state ON locations(state_code);
CREATE INDEX IF NOT EXISTS idx_locations_zip ON locations(display_zip);
CREATE INDEX IF NOT EXISTS idx_locations_search_count ON locations(search_count DESC);

-- =============================================================================
-- TABLE: hunting_sessions (UPDATED)
-- Purpose: Every chat interaction = learning data
-- Data value: User behavior, question patterns, seasonal trends
-- =============================================================================
CREATE TABLE IF NOT EXISTS hunting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User identification (anonymous for now)
  user_id TEXT,
  session_fingerprint TEXT,  -- Browser fingerprint for tracking without login

  -- Location data (LAT/LON PRIMARY)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  zip_code TEXT,              -- Legacy/display
  location_id UUID REFERENCES locations(id),

  -- Hunt context
  game_type TEXT,
  hunt_date DATE,
  weapon_type TEXT,

  -- Interaction data
  user_message TEXT NOT NULL,
  user_context JSONB,
  ai_response TEXT NOT NULL,
  ai_confidence_score INTEGER DEFAULT 75,
  response_time_ms INTEGER,

  -- Environmental data (CAPTURE EVERYTHING)
  weather_data JSONB,
  moon_phase_data JSONB,
  barometric_pressure DECIMAL,
  temperature_f INTEGER,
  wind_speed_mph INTEGER,
  wind_direction TEXT,

  -- Regulatory tracking
  regulations_checked BOOLEAN DEFAULT false,

  -- Outcome tracking (PREMIUM FEATURE - THE REAL GOLD)
  hunt_outcome TEXT,  -- 'success', 'no_success', 'no_hunt'
  outcome_details JSONB,
  outcome_logged_at TIMESTAMP WITH TIME ZONE,

  -- User feedback (learning loop)
  user_feedback TEXT,
  feedback_score INTEGER,
  feedback_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_sessions_location ON hunting_sessions(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_sessions_zip ON hunting_sessions(zip_code);
CREATE INDEX IF NOT EXISTS idx_sessions_game_type ON hunting_sessions(game_type);
CREATE INDEX IF NOT EXISTS idx_sessions_outcome ON hunting_sessions(hunt_outcome) WHERE hunt_outcome IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_sessions_date ON hunting_sessions(hunt_date);

-- =============================================================================
-- TABLE: hunt_outcomes (NEW - PREMIUM TIER DATA)
-- Purpose: User-logged hunt results - THE DATA MOAT
-- Data value: Pattern recognition, success prediction, competitive advantage
-- =============================================================================
CREATE TABLE IF NOT EXISTS hunt_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User tracking
  user_id TEXT NOT NULL,
  session_id UUID REFERENCES hunting_sessions(id),

  -- Location (LAT/LON PRIMARY)
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_id UUID REFERENCES locations(id),

  -- Hunt details
  hunt_date DATE NOT NULL,
  game_type TEXT NOT NULL,
  weapon_type TEXT,

  -- Outcome (SIMPLE BUTTON LOGGING)
  outcome TEXT NOT NULL,  -- 'saw_game', 'shot_missed', 'shot_hit', 'harvested', 'saw_nothing'
  animals_seen INTEGER DEFAULT 0,
  shots_taken INTEGER DEFAULT 0,
  harvested BOOLEAN DEFAULT false,

  -- Environmental conditions AT TIME OF HUNT
  temperature_f INTEGER,
  barometric_pressure DECIMAL,
  wind_speed_mph INTEGER,
  wind_direction TEXT,
  moon_phase TEXT,
  moon_illumination INTEGER,
  weather_conditions TEXT,

  -- Hunt metadata
  time_of_day TEXT,  -- 'dawn', 'morning', 'midday', 'afternoon', 'dusk', 'night'
  duration_hours DECIMAL,
  stand_location TEXT,
  notes TEXT
);

CREATE INDEX IF NOT EXISTS idx_outcomes_user ON hunt_outcomes(user_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_location ON hunt_outcomes(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_outcomes_date ON hunt_outcomes(hunt_date DESC);
CREATE INDEX IF NOT EXISTS idx_outcomes_game ON hunt_outcomes(game_type);
CREATE INDEX IF NOT EXISTS idx_outcomes_success ON hunt_outcomes(harvested);

-- =============================================================================
-- TABLE: success_patterns (MATERIALIZED VIEW - COMPUTED DATA)
-- Purpose: Aggregated success rates by location + conditions
-- Data value: AI can reference "83% success rate when..."
-- =============================================================================
CREATE TABLE IF NOT EXISTS success_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  computed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Location grouping
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_radius_miles INTEGER DEFAULT 10,

  -- Hunt type
  game_type TEXT NOT NULL,

  -- Pattern conditions
  weather_pattern JSONB,
  moon_phase_pattern TEXT,
  time_of_day_pattern TEXT,

  -- Success metrics (THE INSIGHTS)
  total_hunts INTEGER NOT NULL,
  successful_hunts INTEGER NOT NULL,
  success_rate DECIMAL(5,2) NOT NULL,
  avg_animals_seen DECIMAL(5,2),

  -- Confidence scoring
  confidence_score INTEGER,  -- Based on sample size
  last_hunt_date DATE,

  UNIQUE(latitude, longitude, game_type, weather_pattern, moon_phase_pattern)
);

CREATE INDEX IF NOT EXISTS idx_patterns_location ON success_patterns(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_patterns_success ON success_patterns(success_rate DESC);

-- =============================================================================
-- TABLE: location_weather_history (NEW - WEATHER DATA COLLECTION)
-- Purpose: Build historical weather database for pattern analysis
-- Data value: "Last 5 cold fronts in this area produced X deer movement"
-- =============================================================================
CREATE TABLE IF NOT EXISTS location_weather_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Location
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  location_id UUID REFERENCES locations(id),

  -- Weather snapshot
  temperature_f INTEGER,
  feels_like_f INTEGER,
  barometric_pressure DECIMAL,
  pressure_trend TEXT,  -- 'rising', 'falling', 'steady'
  humidity INTEGER,
  wind_speed_mph INTEGER,
  wind_direction TEXT,
  conditions TEXT,

  -- Derived insights
  cold_front BOOLEAN DEFAULT false,
  warm_front BOOLEAN DEFAULT false,
  pressure_drop_24h DECIMAL,
  temp_drop_24h INTEGER
);

CREATE INDEX IF NOT EXISTS idx_weather_history_location ON location_weather_history(latitude, longitude, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_weather_history_fronts ON location_weather_history(cold_front) WHERE cold_front = true;

-- =============================================================================
-- TABLE: hunting_regulations (DATA AGGREGATION TARGET)
-- Purpose: Scraped/API data from state wildlife agencies
-- Data value: Free tier hook, replaces 20+ websites
-- =============================================================================
CREATE TABLE IF NOT EXISTS hunting_regulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Geographic scope
  state_code TEXT NOT NULL,
  state_name TEXT NOT NULL,
  county TEXT,
  zone TEXT,

  -- Game type
  game_type TEXT NOT NULL,
  species TEXT,

  -- Season dates
  season_start DATE,
  season_end DATE,
  season_name TEXT,

  -- Rules
  bag_limit TEXT,
  daily_start_time TEXT,
  daily_end_time TEXT,
  legal_weapons TEXT[],
  special_restrictions TEXT,

  -- License requirements
  license_required BOOLEAN DEFAULT true,
  license_types TEXT[],
  tags_required BOOLEAN DEFAULT false,

  -- Data source tracking
  source_url TEXT,
  source_agency TEXT,
  last_verified_at TIMESTAMP WITH TIME ZONE,
  is_verified BOOLEAN DEFAULT false
);

CREATE INDEX IF NOT EXISTS idx_regs_state_game ON hunting_regulations(state_code, game_type);
CREATE INDEX IF NOT EXISTS idx_regs_dates ON hunting_regulations(season_start, season_end);

-- =============================================================================
-- TABLE: user_profiles (FUTURE - PREMIUM TIER)
-- Purpose: Store user preferences, saved locations, subscription status
-- Data value: User retention, personalization, revenue tracking
-- =============================================================================
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Auth
  user_id TEXT UNIQUE NOT NULL,
  email TEXT,

  -- Subscription
  subscription_tier TEXT DEFAULT 'free',  -- 'free', 'premium'
  subscription_start DATE,
  subscription_end DATE,

  -- Preferences
  primary_game_types TEXT[],
  saved_locations UUID[] REFERENCES locations(id),
  notification_preferences JSONB,

  -- Usage tracking
  total_searches INTEGER DEFAULT 0,
  total_hunts_logged INTEGER DEFAULT 0,
  last_active_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_users_subscription ON user_profiles(subscription_tier);
CREATE INDEX IF NOT EXISTS idx_users_active ON user_profiles(last_active_at DESC);

-- =============================================================================
-- FUNCTIONS: Auto-update timestamps
-- =============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_locations_updated_at BEFORE UPDATE ON locations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_regulations_updated_at BEFORE UPDATE ON hunting_regulations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- DATA PHILOSOPHY NOTES
-- =============================================================================

-- EVERY INTERACTION CAPTURED:
-- - User searches location → locations table updated
-- - User asks question → hunting_sessions logged with full context
-- - User logs outcome → hunt_outcomes + success_patterns computed
-- - Weather fetched → location_weather_history stored
-- - Free tier user becomes premium → all historical data linked

-- DATA MOAT TIMELINE:
-- Month 1-3: Collect search patterns, questions, locations
-- Month 4-6: Premium users logging outcomes (THE GOLD)
-- Month 7-12: Enough outcome data for pattern recognition
-- Month 13-18: Success patterns = competitive advantage
-- Month 19-24: Network effects = defensible moat

-- REVENUE FROM DATA:
-- - Premium tier: $4.99/month for YOUR pattern insights
-- - Display ads: Traffic from free tier (SEO location pages)
-- - Affiliate links: Hunting gear recommendations
-- - API access: Sell aggregated (anonymized) hunting data
-- - Acquisition: OnX/HuntStand buys for data moat
