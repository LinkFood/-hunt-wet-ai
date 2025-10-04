import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getWeatherData, formatWeatherForGPT } from '@/lib/weather'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// AI-powered hunting intelligence generator
export async function POST(request: NextRequest) {
  try {
    const { location, gameType } = await request.json()

    if (!location?.lat || !location?.lon) {
      return NextResponse.json(
        { success: false, error: 'Location required' },
        { status: 400 }
      )
    }

    // Get weather data
    const weatherData = await getWeatherData(location.lat, location.lon)
    const weatherSummary = formatWeatherForGPT(weatherData)

    // Generate AI intel summary
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are Hunt Wet AI, an expert hunting intelligence system. Your job is to analyze weather and location data to provide a compelling, actionable hunting intel summary.

INSTRUCTIONS:
1. Write a 4-6 sentence summary that HOOKS the user
2. Focus on the MOST IMPORTANT factors for hunting success RIGHT NOW
3. Mention specific timeframes (next 24-48 hours, best hunting windows)
4. Reference pressure trends, weather patterns, and their impact on game movement
5. Be confident and specific, not generic
6. End with a call to action (when to hunt, what to watch for)

TONE: Confident, data-driven, exciting. Like a hunting guide who just spotted the perfect conditions.

DO NOT:
- Write generic advice
- Be overly cautious or disclaimery
- Mention safety unless critical
- Talk about regulations (that's elsewhere)

Current date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}`
        },
        {
          role: 'user',
          content: `Location: ${location.displayName}
Game Type: ${gameType || 'big-game'}

${weatherSummary}

Generate a compelling hunting intel summary for this location right now.`
        }
      ],
      temperature: 0.7,
      max_tokens: 300
    })

    const intel = completion.choices[0]?.message?.content || 'Could not generate intel'

    return NextResponse.json({
      success: true,
      intel,
      location: location.displayName,
      gameType
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