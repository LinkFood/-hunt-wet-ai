# Hunt Wet AI - Premium Database Schema

## Philosophy
Capture EVERYTHING about each hunt so in 25 years with 1,000+ logs, patterns are crystal clear.
No predictions - only pattern matching based on YOUR actual data.

---

## Table: `hunt_logs`

**Core hunt information + complete environmental snapshot**

```sql
CREATE TABLE hunt_logs (
  -- Identity
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Hunt Details
  hunt_date DATE NOT NULL,
  hunt_time TIME NOT NULL,
  location_name TEXT NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,

  species TEXT NOT NULL, -- 'deer', 'duck', 'turkey', etc.
  outcome TEXT NOT NULL, -- 'success', 'failure', 'scouting'
  animals_seen INTEGER DEFAULT 0,
  animals_killed INTEGER DEFAULT 0,
  user_notes TEXT,

  -- Weather Snapshot (from Visual Crossing at exact hunt time)
  temperature DECIMAL(5, 2), -- Fahrenheit
  feels_like DECIMAL(5, 2),
  humidity INTEGER, -- Percentage
  dew_point DECIMAL(5, 2),

  -- Pressure (CRITICAL for hunting)
  barometric_pressure DECIMAL(6, 2), -- Millibars
  pressure_1hr_ago DECIMAL(6, 2),
  pressure_3hr_ago DECIMAL(6, 2),
  pressure_6hr_ago DECIMAL(6, 2),
  pressure_trend TEXT, -- 'rising', 'falling', 'steady'
  pressure_change_3hr DECIMAL(5, 2), -- mb change over 3 hours
  pressure_change_6hr DECIMAL(5, 2), -- mb change over 6 hours

  -- Wind
  wind_speed DECIMAL(5, 2), -- MPH
  wind_gust DECIMAL(5, 2),
  wind_direction TEXT, -- 'N', 'NE', 'E', etc.
  wind_degrees INTEGER, -- 0-360

  -- Precipitation
  precipitation_amount DECIMAL(5, 2), -- Inches
  precipitation_type TEXT, -- 'rain', 'snow', 'none'
  cloud_cover INTEGER, -- Percentage
  visibility DECIMAL(5, 2), -- Miles

  -- Sky conditions
  conditions TEXT, -- 'Clear', 'Cloudy', 'Rain', etc.
  uvi INTEGER, -- UV index

  -- Sun timing (critical for dawn/dusk hunts)
  sunrise TIME,
  sunset TIME,
  minutes_from_sunrise INTEGER, -- Negative = before sunrise
  minutes_from_sunset INTEGER,

  -- Lunar data
  moon_phase TEXT, -- 'new', 'waxing_crescent', 'first_quarter', etc.
  moon_illumination INTEGER, -- 0-100 percentage
  moon_age INTEGER, -- Days since new moon
  solunar_score INTEGER, -- 1-10 hunting activity score

  -- Additional context
  season TEXT, -- 'archery', 'firearm', 'muzzleloader', etc.
  hunting_method TEXT, -- 'stand', 'stalk', 'blind', 'drive', etc.
  photo_urls TEXT[], -- Array of photo URLs (kills, conditions, etc.)

  -- Indexes for pattern matching
  CONSTRAINT valid_outcome CHECK (outcome IN ('success', 'failure', 'scouting'))
);

-- Indexes for fast pattern matching queries
CREATE INDEX idx_hunt_logs_user_date ON hunt_logs(user_id, hunt_date DESC);
CREATE INDEX idx_hunt_logs_user_species ON hunt_logs(user_id, species);
CREATE INDEX idx_hunt_logs_user_outcome ON hunt_logs(user_id, outcome);
CREATE INDEX idx_hunt_logs_pressure_trend ON hunt_logs(user_id, pressure_trend);
CREATE INDEX idx_hunt_logs_temperature ON hunt_logs(user_id, temperature);
CREATE INDEX idx_hunt_logs_moon_phase ON hunt_logs(user_id, moon_phase);
CREATE INDEX idx_hunt_logs_location ON hunt_logs(user_id, latitude, longitude);
```

---

## Table: `user_patterns`

**Pre-computed patterns for fast lookups (updated after each new log)**

```sql
CREATE TABLE user_patterns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  species TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Success statistics
  total_hunts INTEGER DEFAULT 0,
  successful_hunts INTEGER DEFAULT 0,
  success_rate DECIMAL(5, 2), -- Percentage

  -- Pressure patterns
  success_rate_falling_pressure DECIMAL(5, 2),
  success_rate_rising_pressure DECIMAL(5, 2),
  success_rate_steady_pressure DECIMAL(5, 2),
  avg_pressure_successful DECIMAL(6, 2),
  avg_pressure_change_successful DECIMAL(5, 2),

  -- Temperature patterns
  temp_range_low_successful DECIMAL(5, 2),
  temp_range_high_successful DECIMAL(5, 2),
  avg_temp_successful DECIMAL(5, 2),

  -- Wind patterns
  best_wind_direction TEXT[],
  avg_wind_speed_successful DECIMAL(5, 2),

  -- Moon patterns
  success_rate_by_moon_phase JSONB, -- {"new": 0.45, "waxing_crescent": 0.83, ...}
  best_moon_illumination_range JSONB, -- {"low": 30, "high": 60}

  -- Time patterns
  best_time_from_sunrise_min INTEGER,
  best_time_from_sunrise_max INTEGER,
  best_time_from_sunset_min INTEGER,
  best_time_from_sunset_max INTEGER,

  -- Location patterns
  best_locations JSONB, -- [{"lat": 39.xx, "lon": -76.xx, "success_rate": 0.87, "name": "..."}, ...]

  UNIQUE(user_id, species)
);
```

---

## Table: `pattern_alerts`

**Track alerts sent to user (prevent spam)**

```sql
CREATE TABLE pattern_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  alert_date DATE NOT NULL,
  alert_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  conditions_summary JSONB, -- Store the conditions that triggered alert
  match_count INTEGER, -- How many past hunts matched
  pattern_confidence DECIMAL(5, 2), -- Success rate under these conditions

  sent BOOLEAN DEFAULT FALSE,
  viewed BOOLEAN DEFAULT FALSE,

  UNIQUE(user_id, alert_date) -- Only one alert per day per user
);
```

---

## Table: `calendar_reminders`

**User can mark future dates as "want to hunt" for condition tracking**

```sql
CREATE TABLE calendar_reminders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  target_date DATE NOT NULL,
  species TEXT,
  location_name TEXT,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  notes TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reminded BOOLEAN DEFAULT FALSE,

  UNIQUE(user_id, target_date)
);
```

---

## Row Level Security (RLS)

```sql
-- Users can only see their own data
ALTER TABLE hunt_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own hunt logs" ON hunt_logs
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own hunt logs" ON hunt_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own patterns" ON user_patterns
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE pattern_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own alerts" ON pattern_alerts
  FOR SELECT USING (auth.uid() = user_id);

ALTER TABLE calendar_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders" ON calendar_reminders
  FOR ALL USING (auth.uid() = user_id);
```

---

## Data Capture Flow

1. **User logs hunt:** "Oct 15, 2024, 6:30 AM, Deer, Success, Towson MD"

2. **System fetches Visual Crossing historical data:**
   - Weather at 6:30 AM on Oct 15, 2024
   - Weather at 3:30 AM (3 hours before) for pressure trend
   - Weather at 12:30 AM (6 hours before) for pressure trend

3. **System calculates lunar data:**
   - Moon phase for Oct 15, 2024
   - Solunar score for that day

4. **System stores complete snapshot:**
   - All 40+ data points saved to `hunt_logs`

5. **System updates patterns:**
   - Recalculates `user_patterns` for that species
   - Updates success rates by pressure, temp, moon, etc.

6. **Future lookups:**
   - Check next 7 days' forecasted conditions
   - Match against user's proven patterns
   - Send alert if high confidence match found

---

## Example Pattern Matching Query

```sql
-- Find all past hunts with similar conditions to upcoming day
SELECT
  hunt_date,
  outcome,
  animals_killed,
  temperature,
  pressure_trend,
  moon_phase,
  user_notes
FROM hunt_logs
WHERE user_id = 'xxx'
  AND species = 'deer'
  AND temperature BETWEEN 55 AND 61 -- Within 3°F of forecast
  AND pressure_trend = 'falling'
  AND moon_phase IN ('waxing_crescent', 'first_quarter')
  AND minutes_from_sunrise BETWEEN -60 AND 90
ORDER BY
  CASE WHEN outcome = 'success' THEN 0 ELSE 1 END,
  hunt_date DESC
LIMIT 10;
```

---

## Data Points Captured (40+)

1. Hunt date, time, location
2. Species, outcome, animals seen/killed
3. User notes
4. Temperature, feels like, humidity, dew point
5. Pressure (current, 1hr ago, 3hr ago, 6hr ago)
6. Pressure trend (rising/falling/steady)
7. Pressure change rates (3hr, 6hr)
8. Wind speed, gust, direction, degrees
9. Precipitation amount, type
10. Cloud cover, visibility, conditions, UV
11. Sunrise, sunset, minutes from sunrise/sunset
12. Moon phase, illumination, age, solunar score
13. Season, hunting method
14. Photos

**Every hunt = Complete environmental DNA**

In 25 years with 1,000 hunts = 40,000+ data points to analyze YOUR patterns.
