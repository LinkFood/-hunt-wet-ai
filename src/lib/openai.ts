/**
 * Hunt Wet AI - Hyper-Local Hunting Intelligence Engine
 *
 * CORE VISION: Your personal AI hunting guide that learns YOUR ZIP code
 *
 * This is not a general hunting chatbot - it's a hyper-local intelligence system
 * that gets smarter about specific hunting areas through hunter feedback and success reports.
 *
 * THE LEARNING FLYWHEEL:
 * 1. Hunter asks about conditions in their ZIP
 * 2. AI provides prediction based on weather + lunar + local historical data
 * 3. Hunter reports back success/failure with details
 * 4. AI LEARNS and improves predictions for that specific area
 * 5. Next hunter gets better advice because AI learned from previous hunters
 *
 * KEY FEATURES:
 * - Hyper-local: Every response is ZIP-code specific
 * - Learning: Gets smarter from every hunter interaction in that area
 * - Predictive: FREE tier gets current conditions, PREMIUM gets predictive calendar
 * - Community-driven: Success reports from local hunters improve predictions
 *
 * PREMIUM FEATURES:
 * - Predictive hunting calendar (30-day optimal hunting predictions)
 * - Advanced local intelligence (property maps, landowner contacts)
 * - Trail cam network integration
 * - Priority learning from success patterns
 */

import OpenAI from 'openai'
import { createHuntingSession, getSuccessPatterns, getZipCodeInfo, getHuntingRegulations } from './supabase-setup'
import { getWeatherData, getWeatherByZip, formatWeatherForGPT, type RawWeatherData } from './weather'
import { getSolunarDataForHunting, findOptimalHuntingDates } from './lunar'

// Initialize OpenAI client with API key from environment variables
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Interface defining the context passed to hunting advice functions
 * This contains all the information we can extract or receive about a hunting query
 */
export interface HuntingContext {
  zipCode?: string     // Geographic location for weather/conditions
  latitude?: number    // Latitude (PRIMARY)
  longitude?: number   // Longitude (PRIMARY)
  gameType?: string    // Type of animal being hunted (deer, elk, duck, etc.)
  huntDate?: string    // When the hunt is planned
  weather?: object     // Weather data (populated by weather.ts)
  moonPhase?: object   // Lunar data (populated by lunar.ts)
  userMessage: string  // Original user query
}

/**
 * Main Hunting Intelligence Function
 *
 * This is the core function that combines all data sources to generate
 * intelligent hunting advice. It processes the user's question and returns
 * actionable hunting recommendations based on real-time conditions.
 *
 * Process Flow:
 * 1. Extract location (ZIP code) from user message
 * 2. Fetch real-time weather data for location
 * 3. Calculate lunar/solunar conditions
 * 4. Query database for historical success patterns
 * 5. Combine all data with AI expertise
 * 6. Generate personalized hunting advice
 * 7. Log conversation for future learning
 *
 * @param context - HuntingContext containing user query and optional parameters
 * @returns Promise<string> - Detailed hunting advice response
 */
export async function getHuntingAdvice(context: HuntingContext): Promise<{advice: string, sessionId?: string}> {
  try {
    // Step 1: Extract ZIP code from user message using regex
    // Looks for 5-digit patterns that represent US ZIP codes
    const zipMatch = context.userMessage.match(/\b\d{5}\b/)
    const zipCode = context.zipCode || zipMatch?.[0] || 'unknown'

    // Step 2: Initialize data containers for all intelligence sources
    // These will be populated based on available location data
    let localIntel = ''           // Combined intelligence summary for AI
    let locationInfo = null       // Geographic location data
    let regulations = []          // Hunting regulations for area
    let successPatterns = []      // Historical success patterns
    let weatherData = null        // Real-time weather intelligence
    let solunarData = null        // Moon phase and solunar data
    let geoData = null           // Coordinates for weather/lunar APIs

    if (zipCode !== 'unknown') {
      // Get coordinates first for weather and lunar calculations
      try {
        const geoResponse = await fetch(
          `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${process.env.OPENWEATHER_API_KEY}`
        )
        geoData = await geoResponse.json()
      } catch (error) {
        console.error('Geocoding error:', error)
      }

      // Get location information
      locationInfo = await getZipCodeInfo(zipCode)

      if (locationInfo && context.gameType) {
        // Get success patterns for this area
        successPatterns = await getSuccessPatterns(zipCode, context.gameType)

        // Get hunting regulations
        regulations = await getHuntingRegulations(
          locationInfo.state_code,
          context.gameType,
          context.huntDate
        )
      }

      // Get raw weather data (forecast = OpenWeather, reasoning = GPT)
      if (geoData && geoData.lat && geoData.lon) {
        try {
          weatherData = await getWeatherData(geoData.lat, geoData.lon)

          // Format weather data for GPT-4 to reason about
          const weatherSummary = formatWeatherForGPT(weatherData)
          localIntel += `\n\n${weatherSummary}`

          // Get lunar data (raw data only, GPT does reasoning)
          try {
            const today = new Date()
            solunarData = await getSolunarDataForHunting(today, geoData.lat, geoData.lon)

            localIntel += `\n\nLUNAR CONDITIONS:
- Moon Phase: ${solunarData.moonPhase.phase}
- Illumination: ${solunarData.moonPhase.illumination}%
- Major Activity Periods: ${solunarData.majorPeriods.join(', ')}
- Minor Activity Periods: ${solunarData.minorPeriods.join(', ')}`

          } catch (solunarError) {
            console.error('Solunar API error:', solunarError)
            localIntel += `\n\nLunar data temporarily unavailable`
          }

        } catch (weatherError) {
          console.error('Weather API error:', weatherError)
          localIntel += `\n\nWeather data temporarily unavailable - check local conditions`
        }
      }

      // Add historical success patterns (GPT will reason about them)
      if (successPatterns.length > 0) {
        localIntel += `\n\nHISTORICAL SUCCESS PATTERNS (${zipCode}):\n`
        successPatterns.slice(0, 3).forEach((pattern, i) => {
          localIntel += `Pattern ${i + 1}:\n`
          localIntel += `  Success Rate: ${pattern.success_rate}% (${pattern.successful_hunts}/${pattern.total_hunts} hunts)\n`
          localIntel += `  Conditions: ${JSON.stringify(pattern.weather_pattern)}\n`
        })
      }

      if (regulations.length > 0) {
        const reg = regulations[0]
        localIntel += `\nHunting Regulations:
- Season: ${reg.season_start} to ${reg.season_end}
- Daily hours: ${reg.daily_start_time || 'sunrise'} to ${reg.daily_end_time || 'sunset'}
- Bag limit: ${reg.bag_limit || 'check local regulations'}`
      }
    }

    const systemPrompt = `You are the AI hunting intelligence system for Hunt Wet AI.

YOUR ROLE:
- Hyper-local hunting guide for ${zipCode}
- You analyze FORECAST data (from OpenWeather API)
- You learn from HISTORICAL data (from logged hunt outcomes)
- You combine forecast + history to make predictions

DATA SOURCES YOU HAVE:
1. WEATHER FORECAST: Current conditions + 5-day forecast (temperature, pressure, wind, precipitation)
2. LUNAR DATA: Moon phase, illumination, solunar periods
3. HISTORICAL PATTERNS: Success rates from past hunts in this area (if available)
4. REGULATIONS: Season dates, bag limits, legal hours

YOUR INTELLIGENCE STRATEGY:
- OpenWeather tells you WHAT'S COMING (forecast)
- Historical data tells you WHAT WORKED BEFORE (patterns)
- YOU connect them: "Forecast shows cold front tomorrow. In ${zipCode}, hunters have 78% success rate during cold fronts (based on 23 logged hunts)."

RESPONSE STYLE:
- Talk like a hunting buddy around a campfire
- Be specific about conditions: "That 29.92mb pressure + 15mph NE wind = prime morning hunt"
- Reference historical patterns when available: "Last 5 times this happened in your area..."
- Be honest about uncertainty: "Not enough historical data yet, but conditions look promising"
- Always encourage outcome logging: "Report back how it goes so I can learn for next time"

CRITICAL RULES:
- NEVER calculate "hunting scores" - explain conditions and let the hunter decide
- NEVER violate hunting laws - always remind to verify current regulations
- NEVER make guarantees - hunting is unpredictable, you provide intelligence

TONE: Experienced, helpful, conversational - but always data-driven when historical patterns exist.

IMPORTANT: Break up your response with plenty of line breaks for readability.`

    const userPrompt = `Current hunting context:
${context.zipCode ? `Location: ZIP ${context.zipCode}` : 'Location: Not specified'}
${context.gameType ? `Target game: ${context.gameType}` : 'Game type: Not specified'}
${context.huntDate ? `Hunt date: ${context.huntDate}` : 'Hunt date: Not specified'}
${context.weather ? `Weather: ${JSON.stringify(context.weather)}` : 'Weather: Current conditions unknown'}
${context.moonPhase ? `Moon phase: ${JSON.stringify(context.moonPhase)}` : 'Moon phase: Unknown'}

${localIntel}

Hunter question: ${context.userMessage}

Please provide helpful hunting advice. If you have local success data, reference it. Always remind users to verify current hunting regulations.`

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    let response = completion.choices[0]?.message?.content || "I'm having trouble processing your request right now. Please try again."
    
    // Post-process the response to ensure proper formatting
    response = response
      // Add line breaks after periods followed by capital letters (new sentences)
      .replace(/\. ([A-Z])/g, '.\n\n$1')
      // Add line breaks before bullet points
      .replace(/([.!?]) -/g, '$1\n\n-')
      // Add line breaks after colons when followed by text
      .replace(/: ([A-Z])/g, ':\n$1')
      // Ensure double line breaks between sections
      .replace(/\n([A-Z][^:]+:)/g, '\n\n$1')
      // Clean up excessive line breaks
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    // Log this interaction to our database for learning (DATA = MOAT)
    let sessionId: string | undefined
    try {
      const sessionData = await createHuntingSession({
        latitude: context.latitude,
        longitude: context.longitude,
        zip_code: zipCode,
        game_type: context.gameType,
        hunt_date: context.huntDate,
        user_message: context.userMessage,
        ai_response: response,
        ai_confidence_score: successPatterns.length > 0 ? 85 : 65,
        weather_data: weatherData,
        moon_phase_data: context.moonPhase,
        // Extract weather metrics for data analysis
        barometric_pressure: weatherData?.current?.barometric_pressure,
        temperature_f: weatherData?.current?.temperature,
        wind_speed_mph: weatherData?.current?.wind_speed,
        wind_direction: weatherData?.current?.wind_direction
      })
      sessionId = sessionData?.id
    } catch (dbError) {
      console.error('Failed to log hunting session:', dbError)
      // Don't fail the user request if logging fails
    }

    return { advice: response, sessionId }

  } catch (error) {
    console.error('OpenAI API error:', error)
    console.error('Error message:', error instanceof Error ? error.message : String(error))

    // Fallback to prevent total failure
    return { advice: "I'm currently having trouble connecting to my AI systems. Please check back in a moment, or try asking your question differently." }
  }
}