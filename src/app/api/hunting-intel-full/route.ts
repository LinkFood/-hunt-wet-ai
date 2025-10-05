import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { assessHuntingViability, getStateHuntingData, STATE_WILDLIFE_AGENCIES } from '@/lib/hunting-data'
import { getStateRegulations } from '@/lib/state-regulations-db'
import { getLunarData } from '@/lib/lunar'

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

    // STEP 3: Get REAL regulations from curated database
    console.log(`Loading regulations database for ${state}...`)
    const stateRegs = getStateRegulations(state)

    // STEP 4: Get moon phase and solunar data
    const lunarData = await getLunarData()

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

    // If we have REAL regulations from database, use them directly
    if (stateRegs) {
      console.log(`Using REAL ${state} regulations from database (Last updated: ${stateRegs.lastUpdated})`)

      // Format seasons from database
      const seasonsFormatted = Object.entries(stateRegs.seasons).map(([species, seasons]) => {
        const seasonLines = Object.entries(seasons).map(([type, dates]) => `   • ${type}: ${dates}`)
        return `🦌 ${species}\n${seasonLines.join('\n')}`
      }).join('\n\n')

      // Format licenses from database
      const licensesFormatted = Object.entries(stateRegs.licenses).map(([type, cost]) =>
        `   • ${type}: ${cost}`
      ).join('\n')

      // Format bag limits from database
      const bagLimitsFormatted = Object.entries(stateRegs.bagLimits).map(([species, limit]) =>
        `   • ${species}: ${limit}`
      ).join('\n')

      // Format weapons from database
      const weaponsFormatted = Object.entries(stateRegs.weapons).map(([type, req]) =>
        `   • ${type}: ${req}`
      ).join('\n')

      const regulationsText = `📋 LICENSE REQUIREMENTS\n${licensesFormatted}\n\n🎯 BAG LIMITS (${stateRegs.stateName} - 2024-25 Season)\n${bagLimitsFormatted}\n\n⏰ LEGAL HOURS\n   ${stateRegs.legalHours}\n\n🔫 WEAPONS\n${weaponsFormatted}\n\n📅 Data Last Updated: ${stateRegs.lastUpdated}\n\n⚠️ Official Source:\n${stateRegs.source.name}\n${stateRegs.source.huntingGuideUrl}\n\nBuy Licenses: ${stateRegs.source.licenseUrl}`

      // Still use GPT for summary, species, times, and tactics (weather-based)
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are Hunt Wet AI. Generate hunting intelligence for ${location.displayName}, ${state}.

LUNAR DATA:
🌙 Moon Phase: ${lunarData.phase} (${lunarData.illumination}% illumination)
📊 Hunting Activity Score: ${lunarData.huntingScore}/10
💡 ${lunarData.recommendation}

YOU MUST RETURN VALID JSON:
{
  "summary": "string",
  "species": ["string"],
  "bestTimes": "string",
  "tactics": "string"
}

Focus on:
1. **summary**: 3-4 sentences correlating WEATHER + MOON PHASE for hunting. Reference moon impact on game activity.
2. **species**: List huntable game in ${state} (based on the seasons we have: ${Object.keys(stateRegs.seasons).join(', ')})
3. **bestTimes**: Specific times for next 3 days. Consider moon phase impact on feeding patterns.
4. **tactics**: Location strategy, wind, AND how moon phase affects game movement/visibility`
          },
          {
            role: 'user',
            content: `Location: ${location.displayName}, ${state}\nWeather: ${weatherSummary}\n\nGenerate summary, species, bestTimes, and tactics.`
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      const rawContent = completion.choices[0]?.message?.content || ''
      let gptData
      try {
        const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
        gptData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(rawContent)
      } catch (e) {
        console.error('Failed to parse GPT response:', e)
        gptData = {
          summary: 'Hunting conditions analysis unavailable.',
          species: Object.keys(stateRegs.seasons),
          bestTimes: 'Check weather patterns for optimal timing.',
          tactics: 'Adapt to current conditions.'
        }
      }

      return NextResponse.json({
        success: true,
        intel: {
          summary: gptData.summary,
          species: gptData.species,
          bestTimes: gptData.bestTimes,
          tactics: gptData.tactics,
          seasons: seasonsFormatted,
          regulations: regulationsText
        }
      })
    }

    // FALLBACK: If DNR scraping failed, use old GPT-based approach
    console.log(`DNR scraping failed for ${state}, falling back to GPT estimates`)

    // Generate comprehensive hunting intel
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
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
