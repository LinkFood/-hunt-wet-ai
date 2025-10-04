import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { assessHuntingViability, getStateHuntingData, STATE_WILDLIFE_AGENCIES } from '@/lib/hunting-data'

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

    // Extract state from location name for regulations lookup
    const locationParts = location.displayName.split(',')
    const state = locationParts.length > 1 ? locationParts[locationParts.length - 1].trim() : ''

    // STEP 1: Assess if this location is even huntable
    const viability = await assessHuntingViability(location.lat, location.lon, location.displayName)

    // STEP 2: Get state wildlife agency info
    const stateData = await getStateHuntingData(state)

    // If urban area with no hunting, return early
    if (!viability.isViable) {
      return NextResponse.json({
        success: true,
        intel: {
          summary: viability.reason,
          species: [],
          bestTimes: 'No hunting opportunities in this urban area.',
          tactics: viability.reason,
          seasons: `No hunting seasons apply to ${location.displayName} city limits.`,
          regulations: stateData.success
            ? `For hunting regulations in surrounding areas, visit:\n${stateData.data?.source}\n${stateData.data?.regulationsUrl}`
            : 'Check your state wildlife agency for hunting regulations in surrounding areas.'
        }
      })
    }

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
1. **summary** (3-4 sentences):
   - Start with hook about TODAY'S weather (${weatherSummary.split('\n')[0]})
   - Mention best 2-3 hunting windows in next 3 days
   - Reference specific conditions (pressure, temp, moon phase impact)
   - End with actionable insight about what to focus on

2. **species** (array):
   - List 5-8 ACTUAL huntable game species in ${location.displayName}, ${state}
   - Focus on ${gameType} but include other legal game
   - Only include species that are ACTUALLY hunted in this region
   - Order by popularity/availability

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
   Provide general hunting season timeframes for ${state}.
   ${stateData.success ? `\n   IMPORTANT: Include this at the end:\n   "⚠️ Verify current season dates at:\n   ${stateData.data?.regulationsUrl}"` : ''}
   Format:
   "🦌 White-tailed Deer (Typical ${state} Seasons)
   • Archery: Early October - Mid November
   • Firearm: Mid November - Early December
   • Muzzleloader: Early - Mid December

   🐻 Black Bear
   • Season: September - December

   [Continue for other common species...]

   ${stateData.success ? `\n⚠️ VERIFY CURRENT DATES:\n${stateData.data?.regulationsUrl}` : ''}"

6. **regulations** (formatted text):
   Provide GENERAL guidance, then direct to official source.
   Format:
   "📋 LICENSE REQUIREMENTS
   • Valid ${state} hunting license required
   • Deer permit may be required
   • Check for additional stamps/permits

   🎯 BAG LIMITS
   Varies by county and weapon type in ${state}.

   ⏰ LEGAL HOURS
   Typically 30 min before sunrise to 30 min after sunset.

   🔫 WEAPONS
   Varies by season and county in ${state}.

   ⚠️ GET OFFICIAL REGULATIONS:
   ${stateData.success ? `${stateData.data?.source}\n${stateData.data?.regulationsUrl}\n\nLicenses: ${stateData.data?.licenseUrl}` : 'Check your state wildlife agency website'}"

CRITICAL PHILOSOPHY: Be helpful with general timeframes, but ALWAYS direct to official sources for current regulations.
TONE: Helpful but honest. "Check official sources for exact dates/limits."
CURRENT DATE: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
STATE: ${state || 'Unknown'}
LOCATION TYPE: ${viability.classification}`
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
