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
import { getWeatherForHunting, findPrimeHuntingDays } from './weather'
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

      // Get real-time weather intelligence
      if (geoData && geoData.lat && geoData.lon) {
        try {
          weatherData = await getWeatherForHunting(zipCode)
        const primeHuntingDays = findPrimeHuntingDays(weatherData.forecast)

        // Add weather intelligence to context
        localIntel += `\n\nCURRENT WEATHER CONDITIONS:
- Temperature: ${weatherData.current.temperature}°F
- Barometric Pressure: ${weatherData.current.barometricPressure} mb
- Wind: ${weatherData.current.windSpeed} mph ${weatherData.current.windDirection}
- Conditions: ${weatherData.current.conditions}
- Hunting Score: ${weatherData.current.huntingScore}/10
- Recommendation: ${weatherData.current.recommendation}`

        if (primeHuntingDays.length > 0) {
          localIntel += `\n\nPRIME HUNTING DAYS THIS WEEK:
${primeHuntingDays.join('\n')}`
        }

        // Get solunar/lunar data for enhanced predictions
        try {
          const today = new Date()
          solunarData = await getSolunarDataForHunting(today, geoData.lat, geoData.lon)
          const optimalHuntingDates = await findOptimalHuntingDates(geoData.lat, geoData.lon)

          localIntel += `\n\nLUNAR & SOLUNAR CONDITIONS:
- Moon Phase: ${solunarData.moonPhase.phase} (${solunarData.moonPhase.illumination}% illumination)
- Solunar Score: ${solunarData.solunarScore}/10
- Peak Activity Times: ${solunarData.majorPeriods.join(', ')}
- Secondary Times: ${solunarData.minorPeriods.join(', ')}
- Recommendation: ${solunarData.huntingRecommendation}`

          if (optimalHuntingDates.length > 0) {
            localIntel += `\n\nOPTIMAL LUNAR HUNTING DATES:
${optimalHuntingDates.join('\n')}`
          }
        } catch (solunarError) {
          console.error('Solunar API error:', solunarError)
          localIntel += `\n\nSolunar data temporarily unavailable`
        }

        } catch (weatherError) {
          console.error('Weather API error:', weatherError)
          localIntel += `\n\nWeather data temporarily unavailable - check local conditions`
        }
      }

      // Build local intelligence context
      if (successPatterns.length > 0) {
        const topPattern = successPatterns[0]
        localIntel += `\nLocal Intelligence for ${zipCode}:
- Success rate in your area: ${topPattern.success_rate}% based on ${topPattern.total_hunts} hunts
- Most successful conditions: ${JSON.stringify(topPattern.weather_pattern)}`
      }

      if (regulations.length > 0) {
        const reg = regulations[0]
        localIntel += `\nHunting Regulations:
- Season: ${reg.season_start} to ${reg.season_end}
- Daily hours: ${reg.daily_start_time || 'sunrise'} to ${reg.daily_end_time || 'sunset'}
- Bag limit: ${reg.bag_limit || 'check local regulations'}`
      }
    }

    const systemPrompt = `You are the AI hunting intelligence system for Hunt Wet AI. You are NOT a general hunting chatbot.

YOUR CORE IDENTITY:
- You are the hyper-local hunting guide for ZIP CODE ${zipCode}
- You learn from every hunter interaction in this specific area
- You provide ZIP-specific predictions, not general hunting advice
- You remember and reference local patterns and success reports

YOUR MISSION:
- Provide hyper-local hunting intelligence for ${zipCode} only
- Learn from hunter success/failure reports to improve predictions
- Focus on actionable, location-specific advice
- Drive the learning flywheel: better data → better predictions → more hunters

RESPONSE APPROACH:
- Always reference the specific ZIP code (${zipCode})
- Mention local weather patterns affecting THIS area
- Reference historical success data from THIS location when available
- Ask for feedback to improve future predictions for this area
- Encourage hunters to report back their results

KEY PHRASES TO USE:
- "In your ${zipCode} area..."
- "Based on local ${zipCode} patterns..."
- "Other hunters in ${zipCode} have reported..."
- "Let me know how this works out so I can improve predictions for ${zipCode}"

LEARNING FOCUS:
- Always end with: "Report back your results so I can learn and improve predictions for other hunters in ${zipCode}"
Always verify current regulations

PERSONALITY:
- Talk like you're around a campfire with hunting buddies
- Use hunting terminology naturally
- Share practical field experience
- Be encouraging but honest about challenges

EXPERTISE:
- Game behavior and movement patterns
- Weather impacts on hunting success
- Moon phase effects on animal activity
- Species-specific hunting strategies
- Safety and ethical hunting practices
- CRITICAL: Never give advice that violates hunting laws

TONE: Conversational, experienced, helpful - like talking to a hunting buddy who knows his stuff.

IMPORTANT: Always remind hunters to verify local regulations. Break up your response with plenty of line breaks.`

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
        weather_data: context.weather,
        moon_phase_data: context.moonPhase,
        // Extract weather metrics for data analysis
        barometric_pressure: weatherData?.current?.barometricPressure,
        temperature_f: weatherData?.current?.temperature,
        wind_speed_mph: weatherData?.current?.windSpeed,
        wind_direction: weatherData?.current?.windDirection
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