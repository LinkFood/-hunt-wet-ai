// Supabase database setup and initialization
import { supabase } from './supabase'

export async function initializeDatabase() {
  try {
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

// Data insertion helpers
export async function createHuntingSession(sessionData: {
  user_id?: string
  zip_code: string
  game_type?: string
  hunt_date?: string
  weapon_type?: string
  user_message: string
  ai_response: string
  ai_confidence_score?: number
  weather_data?: object
  moon_phase_data?: object
}) {
  const { data, error } = await supabase
    .from('hunting_sessions')
    .insert([{
      user_id: sessionData.user_id || null,
      zip_code: sessionData.zip_code,
      game_type: sessionData.game_type,
      hunt_date: sessionData.hunt_date,
      weapon_type: sessionData.weapon_type,
      user_message: sessionData.user_message,
      ai_response: sessionData.ai_response,
      ai_confidence_score: sessionData.ai_confidence_score || 75,
      weather_data: sessionData.weather_data,
      moon_phase_data: sessionData.moon_phase_data,
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

export async function getSuccessPatterns(zipCode: string, gameType: string) {
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
  const { data, error } = await supabase
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