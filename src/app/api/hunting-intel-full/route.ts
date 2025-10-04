import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// Generate COMPLETE hunting intelligence for hub page
export async function POST(request: NextRequest) {
  try {
    const { location, gameType, weatherData } = await request.json()

    if (!location?.lat || !location?.lon) {
      return NextResponse.json(
        { success: false, error: 'Location required' },
        { status: 400 }
      )
    }

    // Format weather for GPT
    const weatherSummary = formatWeatherBrief(weatherData)

    // Generate comprehensive hunting intel
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Hunt Wet AI, an expert hunting intelligence system. Generate a COMPREHENSIVE hunting intelligence report for ${location.displayName}.

RETURN YOUR RESPONSE AS A JSON OBJECT WITH THIS EXACT STRUCTURE:
{
  "summary": "4-6 sentence compelling overview focusing on current conditions and best hunting windows",
  "species": ["species1", "species2", ...],
  "bestTimes": "Detailed breakdown of optimal hunting times for next 7 days based on weather patterns",
  "tactics": "Comprehensive tactics for this location and current conditions (3-4 paragraphs)",
  "seasons": "Current season dates for all game species in this area (be specific with dates)",
  "regulations": "Key hunting regulations for this location (licenses, bag limits, legal hunting hours, weapon restrictions)"
}

REQUIREMENTS:
1. Summary: Hook the hunter with actionable intel about RIGHT NOW
2. Species: List all huntable game in this area (${gameType} focused, but include others)
3. Best Times: Be specific about morning/evening windows, moon phases, pressure trends
4. Tactics: Cover terrain, wind strategy, calling, stand placement, movement patterns
5. Seasons: Provide actual season dates (research ${location.displayName} area hunting seasons)
6. Regulations: Be thorough but concise about legal requirements

TONE: Confident, data-driven, specific. No generic advice.
CURRENT DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
        },
        {
          role: 'user',
          content: `Location: ${location.displayName}
Game Type: ${gameType}

${weatherSummary}

Generate complete hunting intelligence report.`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })

    const rawContent = completion.choices[0]?.message?.content || ''

    // Parse JSON response
    let intel
    try {
      intel = JSON.parse(rawContent)
    } catch (e) {
      // Fallback if GPT doesn't return valid JSON
      intel = {
        summary: rawContent,
        species: [],
        bestTimes: 'Check weather patterns for optimal timing',
        tactics: 'Adapt to current conditions',
        seasons: 'Check local regulations for season dates',
        regulations: 'Verify current hunting regulations with local authorities'
      }
    }

    return NextResponse.json({
      success: true,
      intel
    })

  } catch (error) {
    console.error('Hunting intel API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

function formatWeatherBrief(weatherData: any): string {
  if (!weatherData?.current) return 'Weather data unavailable'

  const { current, daily } = weatherData
  let brief = `CURRENT: ${current.temperature}°F, ${current.barometric_pressure}mb, Wind ${current.wind_speed}mph ${current.wind_direction}\n\n`
  brief += `7-DAY OUTLOOK:\n`

  daily?.slice(0, 7).forEach((day: any, i: number) => {
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' })
    brief += `${dayName}: ${day.temp_min}-${day.temp_max}°F, ${day.barometric_pressure}mb, ${day.description}\n`
  })

  return brief
}
