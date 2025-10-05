// Cache layer for historical weather queries
// Reduces Visual Crossing API calls by storing queried data in Supabase

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CachedWeatherDay {
  date: string
  temperature: number
  feels_like: number
  dew_point: number
  humidity: number
  barometric_pressure: number
  pressure_trend: string
  wind_speed: number
  wind_gust: number
  wind_direction: string
  wind_direction_degrees: number
  precipitation: number
  precipitation_type: string
  cloud_cover: number
  visibility: number
  moon_phase: string
  moon_phase_value: number
  moon_illumination: number
  sunrise: string
  sunset: string
}

/**
 * Check if historical weather data is cached for a date range
 * Returns array of dates that are cached
 */
export async function getCachedWeatherDates(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<CachedWeatherDay[]> {

  const { data, error } = await supabase
    .from('historical_weather_cache')
    .select('*')
    .eq('latitude', latitude)
    .eq('longitude', longitude)
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true })

  if (error) {
    console.error('Error fetching cached weather:', error)
    return []
  }

  return data || []
}

/**
 * Cache historical weather data from Visual Crossing response
 */
export async function cacheWeatherData(
  latitude: number,
  longitude: number,
  weatherDays: any[]
): Promise<void> {

  const cacheRecords = weatherDays.map(day => ({
    latitude,
    longitude,
    date: day.datetime,
    temperature: day.temp,
    feels_like: day.feelslike,
    dew_point: day.dew,
    humidity: day.humidity,
    barometric_pressure: day.pressure,
    pressure_trend: calculatePressureTrend(day.pressure),
    wind_speed: day.windspeed,
    wind_gust: day.windgust,
    wind_direction: getWindDirection(day.winddir),
    wind_direction_degrees: day.winddir,
    precipitation: day.precip || 0,
    precipitation_type: day.preciptype ? day.preciptype.join(',') : '',
    cloud_cover: day.cloudcover,
    visibility: day.visibility,
    moon_phase: getMoonPhaseName(day.moonphase),
    moon_phase_value: day.moonphase,
    moon_illumination: day.moonphase * 100,
    sunrise: day.sunrise,
    sunset: day.sunset
  }))

  // Use upsert to handle duplicates
  const { error } = await supabase
    .from('historical_weather_cache')
    .upsert(cacheRecords, {
      onConflict: 'latitude,longitude,date',
      ignoreDuplicates: false
    })

  if (error) {
    console.error('Error caching weather data:', error)
  }
}

/**
 * Get missing date ranges that need to be fetched from API
 * Returns array of [startDate, endDate] ranges
 */
export function getMissingDateRanges(
  requestedStart: string,
  requestedEnd: string,
  cachedDates: string[]
): Array<[string, string]> {

  if (cachedDates.length === 0) {
    return [[requestedStart, requestedEnd]]
  }

  const ranges: Array<[string, string]> = []
  const sortedCached = [...cachedDates].sort()

  // Check if there's a gap at the start
  if (sortedCached[0] > requestedStart) {
    const gapEnd = subtractDays(sortedCached[0], 1)
    ranges.push([requestedStart, gapEnd])
  }

  // Check for gaps in the middle
  for (let i = 0; i < sortedCached.length - 1; i++) {
    const current = sortedCached[i]
    const next = sortedCached[i + 1]
    const expectedNext = addDays(current, 1)

    if (next > expectedNext) {
      ranges.push([expectedNext, subtractDays(next, 1)])
    }
  }

  // Check if there's a gap at the end
  const lastCached = sortedCached[sortedCached.length - 1]
  if (lastCached < requestedEnd) {
    const gapStart = addDays(lastCached, 1)
    ranges.push([gapStart, requestedEnd])
  }

  return ranges
}

function calculatePressureTrend(pressure: number): string {
  if (pressure < 29.8) return 'falling'
  if (pressure > 30.2) return 'rising'
  return 'steady'
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

function getMoonPhaseName(phase: number): string {
  if (phase === 0) return 'New Moon'
  if (phase < 0.25) return 'Waxing Crescent'
  if (phase === 0.25) return 'First Quarter'
  if (phase < 0.5) return 'Waxing Gibbous'
  if (phase === 0.5) return 'Full Moon'
  if (phase < 0.75) return 'Waning Gibbous'
  if (phase === 0.75) return 'Last Quarter'
  return 'Waning Crescent'
}

function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr)
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

function subtractDays(dateStr: string, days: number): string {
  return addDays(dateStr, -days)
}
