// Supabase database setup and initialization
import { supabase } from './supabase'

export async function initializeDatabase() {
  try {
    if (!supabase) {
      console.warn('Supabase not configured')
      return false
    }

    console.log('Initializing Hunt Wet AI database...')

    // Test connection
    const { error } = await supabase.from('users').select('count').limit(1)
    if (error && error.code === '42P01') {
      console.log('Tables do not exist yet. Need to run migrations.')
      return false
    }

    console.log('Database connection successful!')
    return true

  } catch (error) {
    console.error('Database initialization failed:', error)
    return false
  }
}

// Data insertion helpers (UPDATED FOR LAT/LON)
export async function createHuntingSession(sessionData: {
  user_id?: string
  session_fingerprint?: string
  latitude?: number
  longitude?: number
  zip_code: string
  game_type?: string
  hunt_date?: string
  weapon_type?: string
  user_message: string
  ai_response: string
  ai_confidence_score?: number
  weather_data?: object
  moon_phase_data?: object
  barometric_pressure?: number
  temperature_f?: number
  wind_speed_mph?: number
  wind_direction?: string
}) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping session logging')
    return null
  }

  const { data, error } = await supabase
    .from('hunting_sessions')
    .insert([{
      user_id: sessionData.user_id || null,
      session_fingerprint: sessionData.session_fingerprint || null,
      latitude: sessionData.latitude,
      longitude: sessionData.longitude,
      zip_code: sessionData.zip_code,
      game_type: sessionData.game_type,
      hunt_date: sessionData.hunt_date,
      weapon_type: sessionData.weapon_type,
      user_message: sessionData.user_message,
      ai_response: sessionData.ai_response,
      ai_confidence_score: sessionData.ai_confidence_score || 75,
      weather_data: sessionData.weather_data,
      moon_phase_data: sessionData.moon_phase_data,
      barometric_pressure: sessionData.barometric_pressure,
      temperature_f: sessionData.temperature_f,
      wind_speed_mph: sessionData.wind_speed_mph,
      wind_direction: sessionData.wind_direction,
      regulations_checked: false
    }])
    .select()
    .single()

  if (error) {
    console.error('Error creating hunting session:', error)
    throw error
  }

  return data
}

// TRACK LOCATION SEARCHES (DATA COLLECTION)
export async function trackLocationSearch(locationData: {
  latitude: number
  longitude: number
  display_name: string
  display_zip?: string
  city?: string
  state_code?: string
  state_name?: string
  county?: string
}) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping location tracking')
    return null
  }

  // First, upsert the location
  const { data: location, error: locationError } = await supabase
    .from('locations')
    .upsert({
      latitude: locationData.latitude,
      longitude: locationData.longitude,
      display_name: locationData.display_name,
      display_zip: locationData.display_zip,
      city: locationData.city,
      state_code: locationData.state_code,
      state_name: locationData.state_name,
      county: locationData.county,
      last_searched_at: new Date().toISOString()
    }, {
      onConflict: 'latitude,longitude',
      ignoreDuplicates: false
    })
    .select()
    .single()

  if (locationError) {
    console.error('Error tracking location:', locationError)
    return null
  }

  // Increment search count
  const { error: updateError } = await supabase
    .from('locations')
    .update({
      search_count: (location?.search_count || 0) + 1,
      last_searched_at: new Date().toISOString()
    })
    .eq('id', location.id)

  if (updateError) {
    console.error('Error updating search count:', updateError)
  }

  return location
}

// STORE WEATHER SNAPSHOTS (HISTORICAL DATA COLLECTION)
export async function storeWeatherSnapshot(weatherData: {
  latitude: number
  longitude: number
  location_id?: string
  temperature_f: number
  feels_like_f?: number
  barometric_pressure: number
  pressure_trend?: string
  humidity?: number
  wind_speed_mph: number
  wind_direction: string
  conditions: string
  cold_front?: boolean
  warm_front?: boolean
  pressure_drop_24h?: number
  temp_drop_24h?: number
}) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping weather snapshot')
    return null
  }

  const { data, error } = await supabase
    .from('location_weather_history')
    .insert([weatherData])
    .select()
    .single()

  if (error) {
    console.error('Error storing weather snapshot:', error)
    return null
  }

  return data
}

// Track chat messages for data collection
export async function trackChatMessage(chatData: {
  location_name: string
  latitude: number
  longitude: number
  game_type?: string
  user_message: string
}) {
  if (!supabase) {
    console.warn('Supabase not configured, skipping chat message tracking')
    return null
  }

  const { data, error } = await supabase
    .from('chat_messages')
    .insert([{
      location_name: chatData.location_name,
      latitude: chatData.latitude,
      longitude: chatData.longitude,
      game_type: chatData.game_type,
      user_message: chatData.user_message,
      created_at: new Date().toISOString()
    }])
    .select()
    .single()

  if (error) {
    console.error('Error tracking chat message:', error)
    return null
  }

  return data
}

export async function getSuccessPatterns(zipCode: string, gameType: string) {
  if (!supabase) return []

  const { data, error } = await supabase
    .from('success_patterns')
    .select('*')
    .eq('zip_code', zipCode)
    .eq('game_type', gameType)
    .gte('total_hunts', 3) // Minimum sample size
    .order('success_rate', { ascending: false })

  if (error) {
    console.error('Error fetching success patterns:', error)
    return []
  }

  return data
}

export async function updateHuntOutcome(sessionId: string, outcome: 'success' | 'no_success' | 'no_hunt', details?: object) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('hunting_sessions')
    .update({ 
      hunt_outcome: outcome,
      outcome_details: details 
    })
    .eq('id', sessionId)
    .select()
    .single()

  if (error) {
    console.error('Error updating hunt outcome:', error)
    throw error
  }

  return data
}

export async function getZipCodeInfo(zipCode: string) {
  if (!supabase) return null

  const { data, error} = await supabase
    .from('zip_code_locations')
    .select('*')
    .eq('zip_code', zipCode)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching ZIP code info:', error)
  }

  return data
}

export async function getHuntingRegulations(stateCode: string, gameType: string, huntDate?: string) {
  if (!supabase) return []

  let query = supabase
    .from('hunting_regulations')
    .select('*')
    .eq('state_code', stateCode)
    .eq('game_type', gameType)
    .eq('is_verified', true)

  if (huntDate) {
    query = query
      .lte('season_start', huntDate)
      .gte('season_end', huntDate)
  }

  const { data, error } = await query.order('season_start', { ascending: false })

  if (error) {
    console.error('Error fetching hunting regulations:', error)
    return []
  }

  return data
}