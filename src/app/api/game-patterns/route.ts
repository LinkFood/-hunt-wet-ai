import { NextRequest, NextResponse } from 'next/server'

// Game behavior patterns and movement predictions
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const gameType = searchParams.get('game') || 'big-game'
  const zipCode = searchParams.get('zip')
  const season = searchParams.get('season') || 'current'

  try {
    const patterns = await getGamePatterns(gameType, zipCode, season)
    return NextResponse.json(patterns)
  } catch (error) {
    console.error('Game patterns error:', error)
    return NextResponse.json({ error: 'Failed to get game patterns' }, { status: 500 })
  }
}

async function getGamePatterns(gameType: string, zipCode: string | null, season: string) {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)
  const hour = now.getHours()

  if (gameType === 'big-game') {
    return generateBigGamePatterns(dayOfYear, hour, zipCode)
  } else if (gameType === 'upland') {
    return generateUplandPatterns(dayOfYear, hour, zipCode)
  }

  return { error: 'Unknown game type' }
}

function generateBigGamePatterns(dayOfYear: number, hour: number, zipCode: string | null) {
  const isRutSeason = dayOfYear >= 300 || dayOfYear <= 30
  const isPreRut = dayOfYear >= 270 && dayOfYear < 300
  const isSpring = dayOfYear >= 90 && dayOfYear <= 150

  const patterns = {
    gameType: 'big-game',
    season: isRutSeason ? 'rut' : isPreRut ? 'pre-rut' : isSpring ? 'spring' : 'general',
    timestamp: new Date().toISOString(),

    movement: {
      current: getCurrentMovementPattern(hour, isRutSeason),
      prediction: getPredictedMovement(hour, isRutSeason),
      hotspots: getActiveHotspots(isRutSeason),
      avoidanceAreas: getAvoidanceAreas()
    },

    feeding: {
      primaryTimes: isRutSeason ? ['5:30-7:00', '18:30-20:00'] : ['5:00-8:30', '16:30-19:30'],
      secondaryTimes: ['11:00-13:00'],
      preferredFoods: getSeasonalFoodSources(dayOfYear),
      locations: getFeedingLocations(dayOfYear, isRutSeason)
    },

    bedding: {
      patterns: getBeddingPatterns(isRutSeason),
      thermalCover: getThermalCoverPreference(dayOfYear),
      securityFactors: getSecurityFactors()
    },

    breeding: {
      activity: isRutSeason ? 9 : isPreRut ? 6 : 2,
      signs: getBreedingSigns(isRutSeason, isPreRut),
      locations: getBreedingLocations(isRutSeason)
    },

    travel: {
      corridors: getTravelCorridors(),
      timing: getTravelTiming(hour, isRutSeason),
      factors: getTravelFactors()
    },

    weatherResponse: {
      coldFront: 'Increased movement 24-48 hours before front',
      highPressure: 'Normal patterns, consistent feeding times',
      lowPressure: 'Increased daytime movement, extended feeding',
      precipitation: 'Seek heavy cover, movement decreases 50%',
      wind: 'Adjust routes to use wind advantage for scent detection'
    },

    recommendations: generateBigGameRecommendations(hour, isRutSeason, dayOfYear)
  }

  return patterns
}

function generateUplandPatterns(dayOfYear: number, hour: number, zipCode: string | null) {
  const isMigration = (dayOfYear >= 260 && dayOfYear <= 350) || (dayOfYear >= 60 && dayOfYear <= 120)
  const isBreeding = dayOfYear >= 90 && dayOfYear <= 150

  const patterns = {
    gameType: 'upland',
    season: isMigration ? 'migration' : isBreeding ? 'breeding' : 'resident',
    timestamp: new Date().toISOString(),

    flight: {
      morningFlight: '6:00-9:30',
      eveningFlight: '15:30-18:00',
      currentActivity: getFlightActivity(hour),
      altitudes: getFlightAltitudes(hour),
      routes: getFlightRoutes(isMigration)
    },

    feeding: {
      primaryTimes: ['6:30-9:00', '15:00-17:30'],
      locations: getUplandFeedingAreas(dayOfYear),
      preferredFoods: getUplandFoodSources(dayOfYear),
      patterns: getUplandFeedingPatterns(isMigration)
    },

    roosting: {
      locations: getRoostingAreas(dayOfYear),
      timing: getRoostingTimes(),
      security: getRoostingSecurity(),
      weatherFactors: getRoostingWeatherFactors()
    },

    migration: {
      active: isMigration,
      direction: dayOfYear >= 260 ? 'south' : 'north',
      peak: getMigrationPeak(dayOfYear),
      triggers: getMigrationTriggers()
    },

    breeding: {
      activity: isBreeding ? 8 : 3,
      territories: getBreedingTerritories(isBreeding),
      displays: getBreedingDisplays(isBreeding),
      timing: getBreedingTiming(isBreeding)
    },

    weatherResponse: {
      storm: 'Seek shelter in heavy cover, delayed flights',
      coldSnap: 'Concentrated feeding, extended activity periods',
      warmFront: 'Increased flight activity, longer range movement',
      wind: 'Lower flight altitudes, use terrain features for shelter',
      fog: 'Delayed morning flights, ground-level activity'
    },

    recommendations: generateUplandRecommendations(hour, isMigration, dayOfYear)
  }

  return patterns
}

// Helper functions for big game patterns
function getCurrentMovementPattern(hour: number, isRutSeason: boolean) {
  if (hour >= 5 && hour <= 9) return { level: 'HIGH', type: 'feeding', confidence: 85 }
  if (hour >= 17 && hour <= 20) return { level: 'HIGH', type: 'feeding', confidence: 80 }
  if (hour >= 10 && hour <= 16) return { level: 'LOW', type: 'bedding', confidence: 90 }
  if (isRutSeason && hour >= 21 || hour <= 4) return { level: 'MODERATE', type: 'breeding', confidence: 70 }
  return { level: 'LOW', type: 'bedded', confidence: 60 }
}

function getPredictedMovement(hour: number, isRutSeason: boolean) {
  const predictions = []
  const now = new Date()

  for (let i = 1; i <= 6; i++) {
    const futureHour = (hour + i) % 24
    const futureTime = new Date(now.getTime() + i * 60 * 60 * 1000)

    let level = 'LOW'
    let type = 'bedded'

    if (futureHour >= 5 && futureHour <= 9) {
      level = 'HIGH'
      type = 'feeding'
    } else if (futureHour >= 17 && futureHour <= 20) {
      level = 'HIGH'
      type = 'feeding'
    } else if (isRutSeason && (futureHour >= 21 || futureHour <= 4)) {
      level = 'MODERATE'
      type = 'seeking'
    }

    predictions.push({
      time: futureTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      level,
      type,
      confidence: level === 'HIGH' ? 80 : level === 'MODERATE' ? 60 : 40
    })
  }

  return predictions
}

function getActiveHotspots(isRutSeason: boolean) {
  const base = ['Field edges', 'Water sources', 'Oak groves', 'Transition zones']
  if (isRutSeason) {
    base.push('Scrape lines', 'Doe bedding areas', 'Funnels', 'Ridge saddles')
  }
  return base
}

function getAvoidanceAreas() {
  return ['Open fields during daylight', 'High human traffic areas', 'Parking areas', 'Recently disturbed areas']
}

function getSeasonalFoodSources(dayOfYear: number) {
  if (dayOfYear >= 300 || dayOfYear <= 60) { // Late fall/winter
    return ['Browse', 'Remaining mast', 'Agricultural residue', 'Cedar']
  } else if (dayOfYear >= 90 && dayOfYear <= 180) { // Spring/early summer
    return ['New growth', 'Clover', 'Forbs', 'Agricultural crops']
  } else { // Summer/early fall
    return ['Acorns', 'Fruits', 'Agricultural crops', 'Hard mast']
  }
}

// Additional helper functions would continue here...
// For brevity, I'll include the recommendations functions

function generateBigGameRecommendations(hour: number, isRutSeason: boolean, dayOfYear: number) {
  const recommendations = []

  if (hour >= 5 && hour <= 9) {
    recommendations.push('PRIME MORNING MOVEMENT - Focus on feeding areas')
    recommendations.push('Set up on field edges and food sources')
  } else if (hour >= 17 && hour <= 20) {
    recommendations.push('EVENING MOVEMENT ACTIVE - Position near bedding to feeding routes')
    recommendations.push('Focus on travel corridors and water sources')
  } else if (hour >= 10 && hour <= 16) {
    recommendations.push('BEDDING PERIOD - Consider still hunting thick cover')
    recommendations.push('Scout for sign, avoid disturbing bedding areas')
  }

  if (isRutSeason) {
    recommendations.push('RUT ACTIVE - Focus on doe family groups and scrape lines')
    recommendations.push('All-day hunting recommended - movement can happen anytime')
  }

  return recommendations
}

function generateUplandRecommendations(hour: number, isMigration: boolean, dayOfYear: number) {
  const recommendations = []

  if (hour >= 6 && hour <= 9) {
    recommendations.push('MORNING FLIGHT ACTIVE - Position on flyways')
    recommendations.push('Focus on roost to feeding area movement')
  } else if (hour >= 15 && hour <= 18) {
    recommendations.push('EVENING FLIGHT STARTING - Set up near roosting areas')
    recommendations.push('Watch for return flights from feeding areas')
  } else if (hour >= 10 && hour <= 14) {
    recommendations.push('MIDDAY LOAFING - Birds in heavy cover or water')
    recommendations.push('Consider jump shooting or still hunting')
  }

  if (isMigration) {
    recommendations.push('MIGRATION ACTIVE - Expect new birds daily')
    recommendations.push('Focus on traditional staging areas and flyways')
  }

  return recommendations
}

// Remaining helper functions for brevity...
function getFeedingLocations() { return ['Food plots', 'Agricultural edges', 'Oak flats', 'Creek bottoms'] }
function getBeddingPatterns() { return { primary: 'Thermal cover', secondary: 'Security cover', factors: ['Wind direction', 'Escape routes', 'Visibility'] } }
function getThermalCoverPreference() { return 'South-facing slopes for warmth' }
function getSecurityFactors() { return ['Multiple escape routes', 'Dense cover', 'Elevation advantage'] }
function getBreedingSigns() { return ['Fresh scrapes', 'Rubs', 'Track activity', 'Scent marking'] }
function getBreedingLocations() { return ['Ridge saddles', 'Creek crossings', 'Field edges', 'Doe bedding areas'] }
function getTravelCorridors() { return ['Creek bottoms', 'Fence lines', 'Ridge tops', 'Field edges'] }
function getTravelTiming() { return { peak: 'Dawn/Dusk', secondary: 'Midday during rut' } }
function getTravelFactors() { return ['Wind direction', 'Human pressure', 'Weather conditions'] }
function getFlightActivity() { return { level: 'MODERATE', direction: 'NE to SW', altitude: '100-300 ft' } }
function getFlightAltitudes() { return { low: '50-150 ft', medium: '150-400 ft', high: '400+ ft' } }
function getFlightRoutes() { return ['River corridors', 'Valley systems', 'Coastal routes', 'Mountain passes'] }
function getUplandFeedingAreas() { return ['Agricultural fields', 'Food plots', 'Native seed areas', 'Shallow wetlands'] }
function getUplandFoodSources() { return ['Grain crops', 'Native seeds', 'Aquatic vegetation', 'Invertebrates'] }
function getUplandFeedingPatterns() { return { duration: '2-3 hours', frequency: 'Twice daily', group_size: '5-50 birds' } }
function getRoostingAreas() { return ['Dense cattails', 'Timber roosts', 'Open water', 'Protected coves'] }
function getRoostingTimes() { return { evening: '30 min after sunset', morning: '30 min before sunrise' } }
function getRoostingSecurity() { return ['Open water approach', 'Multiple exit routes', 'Predator protection'] }
function getRoostingWeatherFactors() { return ['Wind protection', 'Thermal regulation', 'Ice conditions'] }
function getMigrationPeak() { return { timing: 'Mid-November', duration: '2-3 weeks', intensity: 'HIGH' } }
function getMigrationTriggers() { return ['Cold fronts', 'Barometric pressure', 'Wind direction', 'Daylight length'] }
function getBreedingTerritories() { return ['Wetland edges', 'Nesting cover', 'Brood habitat', 'Escape cover'] }
function getBreedingDisplays() { return ['Territorial calls', 'Courtship flights', 'Aggressive behavior', 'Pair bonding'] }
function getBreedingTiming() { return { peak: 'April-May', duration: '6-8 weeks', activity: 'Dawn chorus' } }