-- Cache historical weather queries to reduce Visual Crossing API calls
-- Store daily weather data for locations users query

CREATE TABLE IF NOT EXISTS historical_weather_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  date DATE NOT NULL,
  
  -- Weather data snapshot
  temperature DECIMAL(5, 2),
  feels_like DECIMAL(5, 2),
  dew_point DECIMAL(5, 2),
  humidity DECIMAL(5, 2),
  
  -- Pressure data
  barometric_pressure DECIMAL(6, 2),
  pressure_trend TEXT,
  
  -- Wind data
  wind_speed DECIMAL(5, 2),
  wind_gust DECIMAL(5, 2),
  wind_direction TEXT,
  wind_direction_degrees INTEGER,
  
  -- Precipitation & sky
  precipitation DECIMAL(5, 2),
  precipitation_type TEXT,
  cloud_cover DECIMAL(5, 2),
  visibility DECIMAL(5, 2),
  
  -- Moon data
  moon_phase TEXT,
  moon_phase_value DECIMAL(4, 3),
  moon_illumination DECIMAL(5, 2),
  
  -- Time data
  sunrise TIME,
  sunset TIME,
  
  -- Cache metadata
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Composite unique constraint
  UNIQUE(latitude, longitude, date)
);

-- Index for fast lookups
CREATE INDEX idx_historical_cache_location_date ON historical_weather_cache(latitude, longitude, date);
CREATE INDEX idx_historical_cache_date ON historical_weather_cache(date);

-- Index for pattern matching queries
CREATE INDEX idx_historical_cache_temp ON historical_weather_cache(temperature);
CREATE INDEX idx_historical_cache_pressure ON historical_weather_cache(barometric_pressure);
CREATE INDEX idx_historical_cache_pressure_trend ON historical_weather_cache(pressure_trend);
CREATE INDEX idx_historical_cache_moon ON historical_weather_cache(moon_phase);
