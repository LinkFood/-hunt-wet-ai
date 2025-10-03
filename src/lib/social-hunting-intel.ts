// Social Hunting Intelligence via Google Search
// Extracts hunting intel from social media snippets using Google Custom Search

export interface SocialIntel {
  id: string
  title: string
  snippet: string
  source: 'twitter' | 'facebook' | 'instagram' | 'tiktok' | 'reddit' | 'unknown'
  link: string
  timeframe: string
  estimatedAge: string
  relevanceWeight: number
  analysis?: {
    type: 'immediate' | 'pattern' | 'seasonal'
    currentRelevance: number
    reason: string
    species?: string[]
    location?: string
    conditions?: string
    confidence: number
  }
}

export interface SocialIntelResults {
  freshIntel: SocialIntel[]      // Today/this week
  patternIntel: SocialIntel[]    // Historical patterns still relevant
  seasonalIntel: SocialIntel[]   // Cyclically relevant
  archivedIntel: SocialIntel[]   // Old immediate intel for context
  totalResults: number
  dataFreshness: string
}

/**
 * GOOGLE CUSTOM SEARCH INTEGRATION
 * Gets hunting social media snippets via Google search
 */
export async function getHuntingSocialIntel(
  zipCode: string,
  gameType: 'big-game' | 'upland' | 'waterfowl',
  cityName?: string,
  countyName?: string
): Promise<SocialIntelResults> {
  try {
    const timeframes = [
      { range: 'd1', weight: 100, label: 'Today' },
      { range: 'd7', weight: 85, label: 'This week' },
      { range: 'm1', weight: 70, label: 'This month' },
      { range: 'm3', weight: 50, label: '3 months ago' },
      { range: 'y1', weight: 30, label: 'Last year' },
      { range: 'y3', weight: 15, label: '3 years ago' }
    ]

    const allResults: SocialIntel[] = []

    for (const timeframe of timeframes) {
      const queries = generateHuntingQueries(zipCode, gameType, cityName, countyName)

      for (const query of queries) {
        try {
          const searchResults = await performGoogleSearch(query, timeframe.range)

          const processedResults = searchResults.map(item => ({
            id: `${item.link}-${timeframe.range}`,
            title: item.title,
            snippet: item.snippet,
            source: extractPlatform(item.link),
            link: item.link,
            timeframe: timeframe.label,
            estimatedAge: timeframe.range,
            relevanceWeight: timeframe.weight
          }))

          allResults.push(...processedResults)
        } catch (error) {
          console.error(`Search error for timeframe ${timeframe.range}:`, error)
        }
      }
    }

    // Analyze and categorize results
    const analyzedResults = await analyzeAllSocialIntel(allResults, zipCode, gameType)

    return categorizeSocialIntel(analyzedResults)

  } catch (error) {
    console.error('Social hunting intel error:', error)
    return {
      freshIntel: [],
      patternIntel: [],
      seasonalIntel: [],
      archivedIntel: [],
      totalResults: 0,
      dataFreshness: `Error fetching data`
    }
  }
}

/**
 * GENERATE TARGETED HUNTING SEARCH QUERIES
 */
function generateHuntingQueries(
  zipCode: string,
  gameType: string,
  cityName?: string,
  countyName?: string
): string[] {
  const locations = [zipCode]
  if (cityName) locations.push(cityName)
  if (countyName) locations.push(countyName)

  const gameTerms = {
    'big-game': ['deer', 'buck', 'doe', 'hunting', 'shot', 'killed', 'harvested'],
    'waterfowl': ['duck', 'goose', 'waterfowl', 'mallard', 'teal', 'limit'],
    'upland': ['pheasant', 'grouse', 'quail', 'upland', 'bird hunting']
  }

  const platforms = [
    'site:twitter.com',
    'site:facebook.com',
    'site:instagram.com',
    'site:tiktok.com',
    'site:reddit.com'
  ]

  const queries: string[] = []
  const terms = gameTerms[gameType as keyof typeof gameTerms] || []

  // Generate comprehensive query combinations
  for (const location of locations) {
    for (const platform of platforms) {
      // Basic hunting queries
      queries.push(`"hunting" "${location}" ${platform}`)

      // Game-specific queries
      for (const term of terms.slice(0, 3)) { // Limit to avoid too many queries
        queries.push(`"${term}" "${location}" ${platform}`)
      }

      // Success story queries
      queries.push(`("shot" OR "killed" OR "harvested") "${location}" ${platform}`)

      // Movement/sighting queries
      queries.push(`("seeing" OR "movement" OR "activity") "hunting" "${location}" ${platform}`)
    }
  }

  return queries
}

/**
 * PERFORM GOOGLE CUSTOM SEARCH
 */
async function performGoogleSearch(query: string, dateRestrict: string) {
  if (!process.env.GOOGLE_API_KEY || !process.env.GOOGLE_SEARCH_ENGINE_ID) {
    console.warn('Google Search API not configured')
    return []
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?` +
      `key=${process.env.GOOGLE_API_KEY}&` +
      `cx=${process.env.GOOGLE_SEARCH_ENGINE_ID}&` +
      `q=${encodeURIComponent(query)}&` +
      `dateRestrict=${dateRestrict}&` +
      `num=10&` +
      `sort=date:d:r`, // Sort by date descending
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    )

    if (!response.ok) {
      throw new Error(`Google Search API error: ${response.status}`)
    }

    const data = await response.json()
    return data.items || []

  } catch (error) {
    console.error('Google Search error:', error)
    return []
  }
}

/**
 * EXTRACT SOCIAL MEDIA PLATFORM FROM URL
 */
function extractPlatform(url: string): SocialIntel['source'] {
  if (url.includes('twitter.com') || url.includes('x.com')) return 'twitter'
  if (url.includes('facebook.com')) return 'facebook'
  if (url.includes('instagram.com')) return 'instagram'
  if (url.includes('tiktok.com')) return 'tiktok'
  if (url.includes('reddit.com')) return 'reddit'
  return 'unknown'
}

/**
 * AI ANALYSIS OF ALL SOCIAL INTEL
 */
async function analyzeAllSocialIntel(
  results: SocialIntel[],
  zipCode: string,
  gameType: string
): Promise<SocialIntel[]> {
  const analyzed: SocialIntel[] = []

  // Process in batches to avoid rate limits
  const batchSize = 5
  for (let i = 0; i < results.length; i += batchSize) {
    const batch = results.slice(i, i + batchSize)

    const batchAnalyzed = await Promise.all(
      batch.map(async (intel) => {
        try {
          const analysis = await analyzeIntelSnippet(intel.snippet, intel.estimatedAge, gameType)
          return { ...intel, analysis }
        } catch (error) {
          console.error('Analysis error:', error)
          return intel
        }
      })
    )

    analyzed.push(...batchAnalyzed)

    // Small delay between batches
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  return analyzed
}

/**
 * AI ANALYSIS OF INDIVIDUAL SNIPPET
 */
async function analyzeIntelSnippet(
  snippet: string,
  age: string,
  gameType: string
) {
  if (!process.env.OPENAI_API_KEY) {
    return {
      type: 'immediate' as const,
      currentRelevance: 50,
      reason: 'AI analysis unavailable',
      confidence: 30
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{
          role: 'system',
          content: `Analyze hunting social media snippets for temporal relevance and extract intel.

IMMEDIATE INTEL (high value if recent, worthless if old):
- "Shot a buck this morning"
- "Ducks flying heavy today"
- "Seeing lots of movement right now"

PATTERN INTEL (valuable even if old):
- "This spot always produces during rut"
- "Best hunting here is early morning"
- "Creek bottom holds deer all season"

SEASONAL INTEL (cyclically relevant):
- "November 15th is peak rut here every year"
- "First cold snap brings the ducks"

Return valid JSON only: {
  "type": "immediate|pattern|seasonal",
  "currentRelevance": 1-100,
  "reason": "why this is/isn't still relevant",
  "species": ["deer", "duck", etc],
  "location": "extracted location if mentioned",
  "conditions": "weather/time conditions mentioned",
  "confidence": 1-100
}`
        }, {
          role: 'user',
          content: `Game Type: ${gameType}\nSnippet: "${snippet}"\nAge: ${age}`
        }],
        temperature: 0.3,
        max_tokens: 300
      })
    })

    const data = await response.json()
    return JSON.parse(data.choices[0].message.content)

  } catch (error) {
    console.error('AI analysis error:', error)
    return {
      type: 'immediate' as const,
      currentRelevance: 50,
      reason: 'Analysis failed',
      confidence: 10
    }
  }
}

/**
 * CATEGORIZE SOCIAL INTEL BY TYPE AND VALUE
 */
function categorizeSocialIntel(results: SocialIntel[]): SocialIntelResults {
  const freshIntel: SocialIntel[] = []
  const patternIntel: SocialIntel[] = []
  const seasonalIntel: SocialIntel[] = []
  const archivedIntel: SocialIntel[] = []

  for (const intel of results) {
    if (!intel.analysis) continue

    const finalRelevance = calculateFinalRelevance(intel)

    if (intel.analysis.type === 'immediate') {
      if (finalRelevance > 60 && (intel.estimatedAge === 'd1' || intel.estimatedAge === 'd7')) {
        freshIntel.push(intel)
      } else {
        archivedIntel.push(intel)
      }
    } else if (intel.analysis.type === 'pattern') {
      if (finalRelevance > 40) {
        patternIntel.push(intel)
      }
    } else if (intel.analysis.type === 'seasonal') {
      seasonalIntel.push(intel)
    }
  }

  // Sort each category by relevance
  const sortByRelevance = (a: SocialIntel, b: SocialIntel) =>
    calculateFinalRelevance(b) - calculateFinalRelevance(a)

  return {
    freshIntel: freshIntel.sort(sortByRelevance).slice(0, 5),
    patternIntel: patternIntel.sort(sortByRelevance).slice(0, 3),
    seasonalIntel: seasonalIntel.sort(sortByRelevance).slice(0, 3),
    archivedIntel: archivedIntel.sort(sortByRelevance).slice(0, 2),
    totalResults: results.length,
    dataFreshness: `Updated ${new Date().toLocaleTimeString()}`
  }
}

/**
 * CALCULATE FINAL RELEVANCE SCORE
 */
function calculateFinalRelevance(intel: SocialIntel): number {
  if (!intel.analysis) return 0

  let baseScore = intel.relevanceWeight

  // Apply AI analysis
  baseScore = baseScore * (intel.analysis.currentRelevance / 100)

  // Confidence multiplier
  baseScore = baseScore * (intel.analysis.confidence / 100)

  return Math.round(baseScore)
}

/**
 * GET CITY/COUNTY FROM ZIP CODE
 */
export function getCityFromZip(zipCode: string): string | undefined {
  // This would normally use a ZIP code database
  const zipMappings: { [key: string]: string } = {
    '10001': 'New York',
    '21286': 'Towson',
    '90210': 'Beverly Hills',
    '80424': 'Frisco',
    '33101': 'Miami',
    '12345': 'Schenectady'
  }

  return zipMappings[zipCode]
}

export function getCountyFromZip(zipCode: string): string | undefined {
  const countyMappings: { [key: string]: string } = {
    '10001': 'New York County',
    '21286': 'Baltimore County',
    '90210': 'Los Angeles County',
    '80424': 'Summit County',
    '33101': 'Miami-Dade County',
    '12345': 'Schenectady County'
  }

  return countyMappings[zipCode]
}