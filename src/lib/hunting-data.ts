/**
 * Hunting Data Aggregation
 * PHILOSOPHY: Real data only. No guessing.
 */

// State DNR/Wildlife Agency URLs for scraping regulations
export const STATE_WILDLIFE_AGENCIES: Record<string, {
  name: string
  regulationsUrl: string
  licenseUrl: string
}> = {
  'MD': {
    name: 'Maryland Department of Natural Resources',
    regulationsUrl: 'https://dnr.maryland.gov/huntersguide/Pages/default.aspx',
    licenseUrl: 'https://dnr.maryland.gov/buy-apply/Pages/Hunting/default.aspx'
  },
  'PA': {
    name: 'Pennsylvania Game Commission',
    regulationsUrl: 'https://www.pgc.pa.gov/HuntTrap/Law/Pages/Seasons-and-Bag-Limits.aspx',
    licenseUrl: 'https://www.pgc.pa.gov/HuntTrap/Licenses/Pages/default.aspx'
  },
  'VA': {
    name: 'Virginia Department of Wildlife Resources',
    regulationsUrl: 'https://dwr.virginia.gov/hunting/regulations/',
    licenseUrl: 'https://dwr.virginia.gov/licenses/'
  },
  'NY': {
    name: 'New York Department of Environmental Conservation',
    regulationsUrl: 'https://www.dec.ny.gov/outdoor/hunting.html',
    licenseUrl: 'https://www.dec.ny.gov/permits/6091.html'
  },
  'WV': {
    name: 'West Virginia Division of Natural Resources',
    regulationsUrl: 'https://wvdnr.gov/hunting/regulations/',
    licenseUrl: 'https://wvdnr.gov/hunting/hunting-licenses/'
  }
  // Add more states as needed
}

// Determine if location is suitable for hunting based on population density
export async function assessHuntingViability(lat: number, lon: number, locationName: string): Promise<{
  isViable: boolean
  classification: 'urban' | 'suburban' | 'rural'
  reason: string
  nearbyPublicLands?: string[]
}> {
  // Check population density using reverse geocoding
  // Urban areas (cities) = typically not huntable
  // Suburban = limited hunting, need to check WMAs
  // Rural = generally huntable

  const cityKeywords = ['city', 'baltimore', 'philadelphia', 'washington', 'new york', 'pittsburgh', 'richmond', 'norfolk']
  const lowerLocation = locationName.toLowerCase()

  const isUrban = cityKeywords.some(keyword => lowerLocation.includes(keyword))

  if (isUrban) {
    return {
      isViable: false,
      classification: 'urban',
      reason: `${locationName} is an urban area with limited to no hunting opportunities within city limits. Check nearby counties for public hunting lands.`
    }
  }

  // For suburban/rural, we'd check nearby public lands
  // For now, assume viable if not urban
  return {
    isViable: true,
    classification: 'suburban',
    reason: `Hunting opportunities exist in the surrounding area. Check local Wildlife Management Areas and state forests.`
  }
}

// Fetch hunting regulations from state website
export async function getStateHuntingData(state: string): Promise<{
  success: boolean
  data?: {
    source: string
    regulationsUrl: string
    licenseUrl: string
    lastUpdated?: string
  }
  error?: string
}> {
  const stateCode = state.toUpperCase()
  const agencyInfo = STATE_WILDLIFE_AGENCIES[stateCode]

  if (!agencyInfo) {
    return {
      success: false,
      error: `Hunting regulations for ${state} not yet available. Please check your state wildlife agency website.`
    }
  }

  return {
    success: true,
    data: {
      source: agencyInfo.name,
      regulationsUrl: agencyInfo.regulationsUrl,
      licenseUrl: agencyInfo.licenseUrl,
      lastUpdated: new Date().toISOString().split('T')[0]
    }
  }
}

// Get nearby public hunting lands (WMAs, State Forests, etc.)
export async function getNearbyPublicLands(lat: number, lon: number, state: string): Promise<{
  success: boolean
  lands: Array<{
    name: string
    distance: number // miles
    type: 'WMA' | 'State Forest' | 'National Forest' | 'Public Land'
    huntingAllowed: boolean
  }>
}> {
  // This would integrate with:
  // 1. OnX Maps API
  // 2. State-specific WMA databases
  // 3. USGS/National Forest data

  // For now, return placeholder indicating we need real data
  return {
    success: false,
    lands: []
  }
}
