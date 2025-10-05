/**
 * Hunt Logger - Comprehensive environmental snapshot system
 *
 * When user logs a hunt, we capture EVERYTHING:
 * - Hunt details (date, time, location, species, outcome)
 * - Weather data (40+ data points from Visual Crossing)
 * - Lunar data (moon phase, solunar score)
 * - Time context (sunrise/sunset, minutes from sun)
 *
 * This is the foundation of pattern recognition.
 */

import { createClient } from '@supabase/supabase-js'
import {
  getHistoricalWeather,
  getPressureTrend,
  calculateMinutesFromSun
} from './weather-visual-crossing'
import { getLunarData } from './lunar'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export interface HuntLogInput {
  // Required
  user_id: string
  hunt_date: string // YYYY-MM-DD
  hunt_time: string // HH:MM:SS
  location_name: string
  latitude: number
  longitude: number
  species: string // 'deer', 'duck', 'turkey', etc.
  outcome: 'success' | 'failure' | 'scouting'

  // Optional
  animals_seen?: number
  animals_killed?: number
  user_notes?: string
  season?: string // 'archery', 'firearm', 'muzzleloader'
  hunting_method?: string // 'stand', 'stalk', 'blind', 'drive'
  photo_urls?: string[]
}

export interface HuntLogComplete extends HuntLogInput {
  // Weather snapshot
  temperature: number
  feels_like: number
  humidity: number
  dew_point: number

  // Pressure (critical for hunting)
  barometric_pressure: number
  pressure_1hr_ago: number
  pressure_3hr_ago: number
  pressure_6hr_ago: number
  pressure_trend: 'rising' | 'falling' | 'steady'
  pressure_change_3hr: number
  pressure_change_6hr: number

  // Wind
  wind_speed: number
  wind_gust?: number
  wind_direction: string
  wind_degrees: number

  // Precipitation
  precipitation_amount: number
  precipitation_type: string
  cloud_cover: number
  visibility: number

  // Sky conditions
  conditions: string
  uvi?: number

  // Sun timing
  sunrise: string
  sunset: string
  minutes_from_sunrise: number
  minutes_from_sunset: number

  // Lunar
  moon_phase: string
  moon_illumination: number
  moon_age?: number
  solunar_score: number
}

/**
 * Log a hunt with complete environmental snapshot
 *
 * This is the core function that:
 * 1. Takes user's hunt input
 * 2. Fetches historical weather for that exact moment
 * 3. Calculates pressure trends
 * 4. Gets lunar data
 * 5. Stores everything in Supabase
 */
export async function logHunt(input: HuntLogInput): Promise<{
  success: boolean
  hunt_id?: string
  data?: HuntLogComplete
  error?: string
}> {
  try {
    console.log(`Logging hunt: ${input.hunt_date} ${input.hunt_time} - ${input.species} - ${input.outcome}`)

    // STEP 1: Get historical weather for exact hunt time
    const weather = await getHistoricalWeather(
      input.latitude,
      input.longitude,
      input.hunt_date,
      input.hunt_time
    )

    if (!weather) {
      return {
        success: false,
        error: 'Failed to fetch weather data for hunt date/time'
      }
    }

    // STEP 2: Calculate pressure trends
    const pressureTrend = await getPressureTrend(
      input.latitude,
      input.longitude,
      input.hunt_date,
      input.hunt_time
    )

    // STEP 3: Get lunar data
    const lunarData = await getLunarData()

    // STEP 4: Calculate sun timing
    const sunTiming = calculateMinutesFromSun(
      input.hunt_time,
      weather.sunrise || '06:00:00',
      weather.sunset || '18:00:00'
    )

    // STEP 5: Build complete hunt log
    const completeLog: HuntLogComplete = {
      // User input
      ...input,

      // Weather snapshot
      temperature: weather.temperature,
      feels_like: weather.feels_like,
      humidity: weather.humidity,
      dew_point: weather.dew_point,

      // Pressure
      barometric_pressure: pressureTrend.current,
      pressure_1hr_ago: pressureTrend.current - pressureTrend.trend_1hr,
      pressure_3hr_ago: pressureTrend.current - pressureTrend.trend_3hr,
      pressure_6hr_ago: pressureTrend.current - pressureTrend.trend_6hr,
      pressure_trend: pressureTrend.direction,
      pressure_change_3hr: pressureTrend.trend_3hr,
      pressure_change_6hr: pressureTrend.trend_6hr,

      // Wind
      wind_speed: weather.wind_speed,
      wind_gust: weather.wind_gust,
      wind_direction: weather.wind_direction_cardinal,
      wind_degrees: weather.wind_direction,

      // Precipitation
      precipitation_amount: weather.precip,
      precipitation_type: weather.precip_type || 'none',
      cloud_cover: weather.cloud_cover,
      visibility: weather.visibility,

      // Conditions
      conditions: weather.conditions,
      uvi: weather.uv_index,

      // Sun
      sunrise: weather.sunrise || '06:00:00',
      sunset: weather.sunset || '18:00:00',
      minutes_from_sunrise: sunTiming.minutes_from_sunrise,
      minutes_from_sunset: sunTiming.minutes_from_sunset,

      // Lunar
      moon_phase: lunarData.phase,
      moon_illumination: lunarData.illumination,
      moon_age: lunarData.age,
      solunar_score: lunarData.huntingScore
    }

    // STEP 6: Save to Supabase
    const { data, error } = await supabase
      .from('hunt_logs')
      .insert([completeLog])
      .select()
      .single()

    if (error) {
      console.error('Supabase insert error:', error)
      return {
        success: false,
        error: `Database error: ${error.message}`
      }
    }

    console.log(`✅ Hunt logged successfully! ID: ${data.id}`)
    console.log(`   Temperature: ${completeLog.temperature}°F`)
    console.log(`   Pressure: ${completeLog.barometric_pressure}mb (${completeLog.pressure_trend})`)
    console.log(`   Wind: ${completeLog.wind_speed}mph ${completeLog.wind_direction}`)
    console.log(`   Moon: ${completeLog.moon_phase} (${completeLog.moon_illumination}%)`)

    return {
      success: true,
      hunt_id: data.id,
      data: completeLog
    }

  } catch (error) {
    console.error('Hunt logging error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

/**
 * Get user's hunt history
 */
export async function getUserHunts(
  userId: string,
  species?: string,
  limit: number = 50
): Promise<HuntLogComplete[]> {
  try {
    let query = supabase
      .from('hunt_logs')
      .select('*')
      .eq('user_id', userId)
      .order('hunt_date', { ascending: false })
      .limit(limit)

    if (species) {
      query = query.eq('species', species)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching hunt history:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('Get user hunts error:', error)
    return []
  }
}

/**
 * Get user's success stats
 */
export async function getUserStats(
  userId: string,
  species?: string
): Promise<{
  total_hunts: number
  successful_hunts: number
  success_rate: number
  animals_seen_total: number
  animals_killed_total: number
}> {
  try {
    let query = supabase
      .from('hunt_logs')
      .select('outcome, animals_seen, animals_killed')
      .eq('user_id', userId)

    if (species) {
      query = query.eq('species', species)
    }

    const { data, error } = await query

    if (error || !data) {
      return {
        total_hunts: 0,
        successful_hunts: 0,
        success_rate: 0,
        animals_seen_total: 0,
        animals_killed_total: 0
      }
    }

    const total = data.length
    const successful = data.filter(h => h.outcome === 'success').length
    const animalsSeen = data.reduce((sum, h) => sum + (h.animals_seen || 0), 0)
    const animalsKilled = data.reduce((sum, h) => sum + (h.animals_killed || 0), 0)

    return {
      total_hunts: total,
      successful_hunts: successful,
      success_rate: total > 0 ? (successful / total) * 100 : 0,
      animals_seen_total: animalsSeen,
      animals_killed_total: animalsKilled
    }
  } catch (error) {
    console.error('Get user stats error:', error)
    return {
      total_hunts: 0,
      successful_hunts: 0,
      success_rate: 0,
      animals_seen_total: 0,
      animals_killed_total: 0
    }
  }
}
