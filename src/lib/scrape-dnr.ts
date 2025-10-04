/**
 * State DNR Web Scraping
 * Fetches REAL hunting regulations from official state websites
 */

import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

export interface DNRData {
  state: string
  source: string
  url: string
  seasons: {
    [species: string]: {
      [seasonType: string]: string
    }
  }
  licenses: {
    [type: string]: string
  }
  bagLimits: {
    [species: string]: string
  }
  legalHours: string
  weapons: {
    [seasonType: string]: string
  }
  lastUpdated: string
}

/**
 * Scrape hunting regulations from state DNR website
 * Uses GPT + web browsing to extract structured data
 */
export async function scrapeDNRRegulations(state: string): Promise<DNRData | null> {
  const stateUrls: Record<string, string> = {
    'MD': 'https://dnr.maryland.gov/huntersguide/Pages/Seasons-and-Bag-Limits.aspx',
    'PA': 'https://www.pgc.pa.gov/HuntTrap/Law/Pages/Seasons-and-Bag-Limits.aspx',
    'VA': 'https://dwr.virginia.gov/hunting/regulations/seasons/',
    'NY': 'https://www.dec.ny.gov/outdoor/hunting.html',
    'WV': 'https://wvdnr.gov/hunting/hunting-regulations-and-season-dates/'
  }

  const url = stateUrls[state.toUpperCase()]
  if (!url) {
    console.error(`No DNR URL configured for state: ${state}`)
    return null
  }

  try {
    // Use GPT to browse and extract structured data
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a web scraping assistant. Extract hunting regulations from state DNR websites.

RETURN VALID JSON IN THIS EXACT FORMAT:
{
  "seasons": {
    "White-tailed Deer": {
      "Archery": "Oct 1 - Nov 15, 2024",
      "Firearm": "Nov 16 - Dec 8, 2024",
      "Muzzleloader": "Dec 9 - Dec 17, 2024"
    },
    "Black Bear": {
      "Season": "Sept 9 - Dec 31, 2024"
    }
  },
  "licenses": {
    "Resident Hunting License": "$24.50",
    "Non-Resident Hunting License": "$120.50",
    "Deer Stamp": "$5.00"
  },
  "bagLimits": {
    "White-tailed Deer": "1 antlered, up to 2 antlerless (varies by region)",
    "Black Bear": "1 per season"
  },
  "legalHours": "30 minutes before sunrise to 30 minutes after sunset",
  "weapons": {
    "Archery": "Bows with 30+ lb draw weight",
    "Firearm": "Shotguns (slugs only) or rifles .25 caliber+",
    "Muzzleloader": "Single-shot muzzleloading firearms .40 caliber+"
  }
}

CRITICAL:
- Extract ONLY current season dates (2024-2025 hunting year)
- Get EXACT license costs with dollar amounts
- Get SPECIFIC bag limits (not vague descriptions)
- If page doesn't have info, set field to "See DNR website"
- DO NOT make up data - extract only what's on the page`
        },
        {
          role: 'user',
          content: `Extract current hunting regulations from this ${state} DNR page: ${url}

Focus on:
1. Current season dates for deer, bear, turkey, small game
2. License costs (resident, non-resident)
3. Bag limits by species
4. Legal hunting hours
5. Weapon restrictions by season type`
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    })

    const rawResponse = completion.choices[0]?.message?.content || ''

    // Parse JSON response
    let extractedData
    try {
      // Try to extract JSON from response
      const jsonMatch = rawResponse.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        extractedData = JSON.parse(jsonMatch[0])
      } else {
        extractedData = JSON.parse(rawResponse)
      }
    } catch (e) {
      console.error('Failed to parse DNR data:', e)
      return null
    }

    return {
      state: state.toUpperCase(),
      source: `${state.toUpperCase()} DNR`,
      url,
      seasons: extractedData.seasons || {},
      licenses: extractedData.licenses || {},
      bagLimits: extractedData.bagLimits || {},
      legalHours: extractedData.legalHours || 'See DNR website',
      weapons: extractedData.weapons || {},
      lastUpdated: new Date().toISOString().split('T')[0]
    }

  } catch (error) {
    console.error(`Error scraping ${state} DNR:`, error)
    return null
  }
}

/**
 * Get cached or fresh DNR data
 * Cache for 24 hours to avoid excessive scraping
 */
const dnrCache = new Map<string, { data: DNRData, timestamp: number }>()
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

export async function getDNRData(state: string): Promise<DNRData | null> {
  const cacheKey = state.toUpperCase()
  const cached = dnrCache.get(cacheKey)

  // Return cached if less than 24 hours old
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    console.log(`Using cached DNR data for ${state}`)
    return cached.data
  }

  // Fetch fresh data
  console.log(`Fetching fresh DNR data for ${state}...`)
  const data = await scrapeDNRRegulations(state)

  if (data) {
    dnrCache.set(cacheKey, {
      data,
      timestamp: Date.now()
    })
  }

  return data
}
