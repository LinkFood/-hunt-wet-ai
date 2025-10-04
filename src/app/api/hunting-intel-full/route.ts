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
          content: `You are Hunt Wet AI, an expert hunting intelligence system analyzing ${location.displayName}.

YOU MUST RETURN VALID JSON IN THIS EXACT FORMAT:
{
  "summary": "string",
  "species": ["string"],
  "bestTimes": "string",
  "tactics": "string",
  "seasons": "string",
  "regulations": "string"
}

CRITICAL INSTRUCTIONS:
1. **summary** (3-4 sentences): Hook with CURRENT CONDITIONS and BEST HUNTING WINDOWS for next 3 days. Reference today's weather specifically.

2. **species** (array): List 4-6 huntable game species for ${location.displayName} area. Focus on ${gameType}.

3. **bestTimes** (formatted text):
   Format like this:
   "🌅 MORNING (Next 3 Days)
   • Today (Oct 4): 5:45-7:30 AM - Peak movement during cool temps
   • Tomorrow: 5:50-8:00 AM - Excellent conditions as pressure rises
   • Sunday: 6:00-7:45 AM - Good activity before warm-up

   🌆 EVENING (Next 3 Days)
   • Today: 6:15-7:45 PM - Prime time as temps drop
   • Tomorrow: 6:00-7:30 PM - Strong movement expected
   • Sunday: 5:45-7:15 PM - Active feeding period"

4. **tactics** (formatted text):
   Break into sections:
   "📍 LOCATION STRATEGY
   [2-3 sentences about WHERE to hunt in this specific area]

   💨 WIND & APPROACH
   [2-3 sentences about wind direction, scent control, approach routes]

   🎯 SETUP & TECHNIQUE
   [2-3 sentences about stand placement, calling, gear]"

5. **seasons** (formatted text):
   "🦌 White-tailed Deer
   • Archery: Oct 1 - Nov 15
   • Firearm: Nov 16 - Dec 8
   • Muzzleloader: Dec 9 - Dec 17

   🐻 Black Bear
   • Season: Sept 1 - Dec 31

   [Continue for other species...]"

6. **regulations** (formatted text):
   "📋 LICENSE REQUIREMENTS
   • Valid state hunting license required
   • Deer permit: $XX.XX (antlered + antlerless)

   🎯 BAG LIMITS
   • Deer: 1 antlered, 1 antlerless per season
   • Bear: 1 per season

   ⏰ LEGAL HOURS
   • 30 min before sunrise to 30 min after sunset

   🔫 WEAPONS
   • Archery: Compound/recurve bows (40+ lb draw)
   • Firearms: Shotgun slugs, rifles .22 caliber+
   • Check local WMA restrictions"

TONE: Confident, specific, formatted for readability. Use real data for ${location.displayName}.
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
