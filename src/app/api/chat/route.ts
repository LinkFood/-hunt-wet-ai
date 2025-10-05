import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'
import { findSimilarWeatherDates, getTodayConditions } from '@/lib/historical-weather-query'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// AI-powered hunting chat with hunt log analysis + historical weather pattern matching
export async function POST(request: NextRequest) {
  try {
    const { message, user_id, latitude, longitude } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'message required' },
        { status: 400 }
      )
    }

    const userId = user_id || 'james'
    const lat = latitude || 39.7392 // Default: Maryland
    const lon = longitude || -104.9903

    // Get user's hunt history
    const { data: hunts, error: huntError } = await supabase
      .from('hunt_logs')
      .select('*')
      .eq('user_id', userId)
      .order('hunt_date', { ascending: false })
      .limit(100)

    if (huntError) {
      console.error('Error fetching hunts:', huntError)
    }

    // Build hunt context
    let huntContext = ''
    if (hunts && hunts.length > 0) {
      huntContext = `\nUSER'S HUNT HISTORY (${hunts.length} hunts logged):\n${JSON.stringify(hunts, null, 2)}`
    } else {
      huntContext = '\nThe user has not logged any hunts yet.'
    }

    // Define TWO functions for GPT
    const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
      {
        type: 'function',
        function: {
          name: 'get_exact_weather',
          description: 'Get EXACT weather data for a specific date. Use this when user asks "What was the weather on [date]?" Returns ALL weather data points for that specific date.',
          parameters: {
            type: 'object',
            properties: {
              date: {
                type: 'string',
                description: 'Specific date in YYYY-MM-DD format'
              }
            },
            required: ['date']
          }
        }
      },
      {
        type: 'function',
        function: {
          name: 'search_historical_weather',
          description: 'Search historical weather data to find dates with SIMILAR conditions. Use this when user asks "show me days LIKE today" or "when was pressure falling" or "find similar days". Returns matching dates with pattern analysis.',
          parameters: {
            type: 'object',
            properties: {
              days_back: {
                type: 'number',
                description: 'How many days back to search (30, 60, 90, 365)',
              },
              target_conditions: {
                type: 'object',
                description: 'Weather conditions to match',
                properties: {
                  temperature: { type: 'number', description: 'Target temperature in °F' },
                  tempRange: {
                    type: 'array',
                    items: { type: 'number' },
                    description: 'Temperature range [min, max] in °F'
                  },
                  pressure: { type: 'number', description: 'Barometric pressure in inHg' },
                  pressureTrend: {
                    type: 'string',
                    enum: ['rising', 'falling', 'steady'],
                    description: 'Pressure trend'
                  },
                  windSpeed: { type: 'number', description: 'Wind speed in mph' },
                  moonPhase: {
                    type: 'string',
                    description: 'Moon phase name (e.g., "Waxing Crescent", "Full Moon")'
                  }
                }
              },
              use_today: {
                type: 'boolean',
                description: 'If true, use today\'s current conditions as the target'
              }
            },
            required: ['days_back']
          }
        }
      }
    ]

    // Call GPT-4o with hunt context and function calling
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Hunt Wet AI - a weather screener that filters historical data.

USER'S HUNT LOGS:
${huntContext}

YOU HAVE TWO FUNCTIONS:

1. get_exact_weather(date) - Specific date lookup
2. search_historical_weather(days_back, target_conditions) - Filter/screen historical data

NATURAL LANGUAGE PARSING:
- "temps like this" / "today" → use_today=true
- "it rained" / "precipitation" → Add precipitation check (note: just filter for precip > 0 in interpretation)
- "falling pressure" → {pressureTrend: "falling"}
- "cold" → {tempRange: [20, 45]}
- "warm" → {tempRange: [65, 85]}
- "last 90 days" → days_back=90

EXAMPLE QUERIES:
- "Last time it rained with temps like this" → search_historical_weather(days_back=365, use_today=true) then filter for precipitation in response
- "Show me days like today" → search_historical_weather(days_back=365, use_today=true)
- "When was pressure falling?" → search_historical_weather(days_back=365, target_conditions={pressureTrend: "falling"})
- "Cold days in last 60 days" → search_historical_weather(days_back=60, target_conditions={tempRange: [20, 45]})

ALWAYS call a function for weather queries. Parse natural language into structured conditions.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      tools,
      tool_choice: 'auto',
      temperature: 0.7,
      max_tokens: 1500
    })

    const responseMessage = completion.choices[0]?.message

    // Check if GPT wants to call a function
    if (responseMessage?.tool_calls && responseMessage.tool_calls.length > 0) {
      const toolCall = responseMessage.tool_calls[0]

      // Handle exact weather query
      if (toolCall.function.name === 'get_exact_weather') {
        const args = JSON.parse(toolCall.function.arguments)
        const date = args.date

        // Fetch exact weather for that date
        const apiKey = process.env.VISUAL_CROSSING_API_KEY
        const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lon}/${date}?unitGroup=us&key=${apiKey}&include=days`

        const response = await fetch(url)
        const data = await response.json()
        const dayData = data.days[0]

        // Check if user hunted this date
        const huntOnDate = hunts?.find(h => h.hunt_date === date)

        const weatherData = {
          date,
          temperature: dayData.temp,
          feelsLike: dayData.feelslike,
          tempMax: dayData.tempmax,
          tempMin: dayData.tempmin,
          pressure: dayData.pressure,
          humidity: dayData.humidity,
          dewPoint: dayData.dew,
          windSpeed: dayData.windspeed,
          windGust: dayData.windgust,
          windDirection: dayData.winddir,
          precipitation: dayData.precip,
          precipType: dayData.preciptype,
          cloudCover: dayData.cloudcover,
          visibility: dayData.visibility,
          moonPhase: dayData.moonphase,
          sunrise: dayData.sunrise,
          sunset: dayData.sunset,
          conditions: dayData.conditions,
          description: dayData.description,
          hunted: !!huntOnDate,
          huntOutcome: huntOnDate?.outcome,
          huntNotes: huntOnDate?.notes
        }

        // Send to GPT for formatting
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are Hunt Wet AI. The user asked for exact weather data on ${date}. Here is ALL the data:\n\n${JSON.stringify(weatherData, null, 2)}\n\nProvide a comprehensive response with ALL weather details. If they hunted this date, highlight the outcome and conditions.`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })

        const finalResponse = finalCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

        return NextResponse.json({
          success: true,
          message: finalResponse,
          hunts_analyzed: hunts?.length || 0,
          exact_date: date
        })
      }

      // Handle pattern matching
      if (toolCall.function.name === 'search_historical_weather') {
        const args = JSON.parse(toolCall.function.arguments)

        // Calculate date range
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - (args.days_back || 365))

        // Get target conditions
        let targetConditions = args.target_conditions || {}

        if (args.use_today) {
          targetConditions = await getTodayConditions(lat, lon)
        }

        // Query historical weather
        const historicalMatches = await findSimilarWeatherDates(
          lat,
          lon,
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0],
          targetConditions,
          0.15 // 15% tolerance
        )

        // Cross-reference with hunt logs
        for (const match of historicalMatches) {
          const huntOnDate = hunts?.find(h => h.hunt_date === match.date)
          if (huntOnDate) {
            match.hunted = true
            match.huntOutcome = huntOnDate.outcome
            match.huntNotes = huntOnDate.notes
          }
        }

        // Send results back to GPT for final response
        const finalCompletion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: `You are Hunt Wet AI. The user asked about historical weather patterns. Here are the matching dates found:\n\n${JSON.stringify(historicalMatches, null, 2)}\n\nNow provide a clear, actionable response showing:\n1. Matching dates with conditions\n2. Which dates they hunted (with outcomes)\n3. Success rate on hunted dates\n4. Pattern insights`
            },
            {
              role: 'user',
              content: message
            }
          ],
          temperature: 0.7,
          max_tokens: 1500
        })

        const finalResponse = finalCompletion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

        return NextResponse.json({
          success: true,
          message: finalResponse,
          hunts_analyzed: hunts?.length || 0,
          historical_matches: historicalMatches.length
        })
      }
    }

    // No function call needed, return direct response
    const response = responseMessage?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      success: true,
      message: response,
      hunts_analyzed: hunts?.length || 0
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
