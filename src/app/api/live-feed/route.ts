import { NextRequest, NextResponse } from 'next/server'

// Live hunting intelligence feed - Bloomberg Terminal style
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const region = searchParams.get('region') || 'national'
  const gameType = searchParams.get('game') || 'all'

  try {
    const feed = await generateLiveFeed(region, gameType)
    return NextResponse.json(feed)
  } catch (error) {
    console.error('Live feed error:', error)
    return NextResponse.json({ error: 'Failed to generate live feed' }, { status: 500 })
  }
}

async function generateLiveFeed(region: string, gameType: string) {
  const now = new Date()
  const feeds = []

  // Market-style ticker data
  const regions = ['MIDWEST', 'NORTHEAST', 'SOUTHEAST', 'SOUTHWEST', 'WEST', 'NORTHWEST']
  const conditions = ['RISING', 'FALLING', 'STABLE', 'VOLATILE']
  const activities = ['HIGH', 'MODERATE', 'LOW', 'PEAK']

  // Generate live regional data
  for (const reg of regions) {
    const score = 1 + Math.random() * 9
    const change = (Math.random() - 0.5) * 2
    const pressure = 980 + Math.random() * 60
    const activity = activities[Math.floor(Math.random() * activities.length)]

    feeds.push({
      id: `${reg}_${now.getTime()}`,
      timestamp: now.toISOString(),
      region: reg,
      type: 'REGIONAL_UPDATE',
      data: {
        huntingIndex: Math.round(score * 10) / 10,
        change24h: Math.round(change * 10) / 10,
        barometric: Math.round(pressure),
        activity,
        trend: change > 0 ? '↗' : change < 0 ? '↘' : '→'
      },
      message: `${reg}: Hunting Index ${Math.round(score * 10) / 10} ${change > 0 ? '↗' : '↘'} ${Math.abs(change).toFixed(1)}`
    })
  }

  // Weather alerts and pattern changes
  const weatherEvents = [
    'COLD FRONT APPROACHING - DEER MOVEMENT +40%',
    'HIGH PRESSURE STABILIZING - IDEAL CONDITIONS',
    'BAROMETRIC DROP DETECTED - INCREASED ACTIVITY',
    'WIND ADVISORY - WATERFOWL SEEKING SHELTER',
    'TEMPERATURE DROP - FEEDING PATTERNS ACTIVE',
    'PRECIPITATION CLEARING - MOVEMENT RESUMING'
  ]

  feeds.push({
    id: `WEATHER_${now.getTime()}`,
    timestamp: now.toISOString(),
    region: 'MULTI-STATE',
    type: 'WEATHER_ALERT',
    data: {
      severity: 'MEDIUM',
      impact: '+25%',
      duration: '6-12 HRS'
    },
    message: weatherEvents[Math.floor(Math.random() * weatherEvents.length)]
  })

  // Solunar and lunar updates
  const moonPhase = ['NEW', 'WAXING', 'FULL', 'WANING'][Math.floor(Math.random() * 4)]
  feeds.push({
    id: `SOLUNAR_${now.getTime()}`,
    timestamp: now.toISOString(),
    region: 'NATIONAL',
    type: 'SOLUNAR_UPDATE',
    data: {
      phase: moonPhase,
      majorPeriod: '17:30-19:30',
      minorPeriod: '11:15-12:15',
      score: 7.2
    },
    message: `SOLUNAR: ${moonPhase} MOON - MAJOR PERIOD ACTIVE 17:30-19:30`
  })

  // Migration and seasonal updates
  const migrationUpdates = [
    'WATERFOWL MIGRATION PEAK - CENTRAL FLYWAY +60%',
    'RUT ACTIVITY INCREASING - SCRAPE ACTIVITY HIGH',
    'ACORN DROP CONFIRMED - FEEDING PATTERNS SHIFT',
    'THERMAL ACTIVITY - TURKEY MOVEMENT PATTERNS',
    'CROP HARVEST COMPLETE - FIELD FEEDING ACTIVE',
    'WINTER HABITAT SHIFT - COVER SEEKING BEHAVIOR'
  ]

  feeds.push({
    id: `MIGRATION_${now.getTime()}`,
    timestamp: now.toISOString(),
    region: 'FLYWAY',
    type: 'MIGRATION_UPDATE',
    data: {
      species: gameType === 'upland' ? 'WATERFOWL' : 'DEER',
      activity: '+45%',
      duration: '2-3 WEEKS'
    },
    message: migrationUpdates[Math.floor(Math.random() * migrationUpdates.length)]
  })

  // Real-time success reports (simulated from user data)
  const successReports = [
    'HARVEST REPORTED - 8PT BUCK - FOOD PLOT EDGE',
    'FLOCK ACTIVITY - 15 MALLARDS - SHALLOW WATER',
    'TRACK ACTIVITY HIGH - MULTIPLE DEER TRAILS',
    'GOBBLER RESPONSE - MORNING CALLS EFFECTIVE',
    'SCRAPE ACTIVITY - FRESH SIGN CONFIRMED',
    'ROOST LOCATION - EVENING FLIGHT PATTERN'
  ]

  feeds.push({
    id: `SUCCESS_${now.getTime()}`,
    timestamp: now.toISOString(),
    region: 'USER_NETWORK',
    type: 'SUCCESS_REPORT',
    data: {
      confidence: 'VERIFIED',
      location: 'GRID_REF_MASKED',
      time: 'DAWN_PERIOD'
    },
    message: successReports[Math.floor(Math.random() * successReports.length)]
  })

  // Equipment and tactical updates
  const tacticalUpdates = [
    'SCENT CONDITIONS: MINIMAL - THERMAL LAYERS STABLE',
    'VISIBILITY: EXCELLENT - CLEAR CONDITIONS 5+ MILES',
    'NOISE LEVELS: OPTIMAL - GROUND CONDITIONS QUIET',
    'WIND PATTERNS: CONSISTENT - 5-10MPH FROM SW',
    'LIGHT CONDITIONS: OPTIMAL - OVERCAST REDUCING SHADOWS'
  ]

  feeds.push({
    id: `TACTICAL_${now.getTime()}`,
    timestamp: now.toISOString(),
    region: 'FIELD_CONDITIONS',
    type: 'TACTICAL_UPDATE',
    data: {
      factor: 'STEALTH',
      rating: 8.5,
      recommendation: 'PROCEED'
    },
    message: tacticalUpdates[Math.floor(Math.random() * tacticalUpdates.length)]
  })

  // Sort by timestamp (newest first)
  feeds.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  return {
    timestamp: now.toISOString(),
    region,
    gameType,
    feedCount: feeds.length,
    feeds: feeds.slice(0, 20), // Return latest 20 items
    lastUpdate: now.toISOString(),
    marketStatus: 'LIVE', // Always live during hunting hours
    nextUpdate: new Date(now.getTime() + 5 * 60 * 1000).toISOString() // Next update in 5 minutes
  }
}

// Historical data endpoint for charts
export async function POST(request: NextRequest) {
  const body = await request.json()
  const { zipCode, gameType, timeframe } = body

  try {
    const historicalData = await generateHistoricalData(zipCode, gameType, timeframe)
    return NextResponse.json(historicalData)
  } catch (error) {
    console.error('Historical data error:', error)
    return NextResponse.json({ error: 'Failed to generate historical data' }, { status: 500 })
  }
}

async function generateHistoricalData(zipCode: string, gameType: string, timeframe: string) {
  const now = new Date()
  const dataPoints = []
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 1

  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)

    // Generate realistic hunting score variations
    const baseScore = 5.5 + Math.sin(i * 0.2) * 2 // Cyclical pattern
    const weatherVariation = (Math.random() - 0.5) * 2
    const seasonalBonus = gameType === 'big-game' && isRutSeason(date) ? 1.5 : 0

    const score = Math.max(1, Math.min(10, baseScore + weatherVariation + seasonalBonus))

    dataPoints.push({
      date: date.toISOString().split('T')[0],
      huntingScore: Math.round(score * 10) / 10,
      weather: Math.round((score + Math.random()) * 10) / 10,
      pressure: 1000 + Math.random() * 40,
      activity: Math.round((score * 0.8 + Math.random() * 2) * 10) / 10,
      success_rate: Math.round((score / 10) * 100)
    })
  }

  return {
    zipCode,
    gameType,
    timeframe,
    dataPoints,
    summary: {
      avgScore: Math.round(dataPoints.reduce((sum, p) => sum + p.huntingScore, 0) / dataPoints.length * 10) / 10,
      bestDay: dataPoints.reduce((best, current) =>
        current.huntingScore > best.huntingScore ? current : best
      ),
      trend: dataPoints[dataPoints.length - 1].huntingScore > dataPoints[0].huntingScore ? 'IMPROVING' : 'DECLINING'
    }
  }
}

function isRutSeason(date: Date): boolean {
  const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / 86400000)
  return dayOfYear >= 300 || dayOfYear <= 30
}