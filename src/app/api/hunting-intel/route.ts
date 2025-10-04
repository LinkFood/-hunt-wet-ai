import { NextRequest, NextResponse } from 'next/server'
import { getWeatherByZip } from '@/lib/weather'
import { getLunarData } from '@/lib/lunar'

// Real-time hunting intelligence aggregator
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zipCode = searchParams.get('zip')
  const gameType = searchParams.get('game')

  if (!zipCode) {
    return NextResponse.json({ error: 'ZIP code required' }, { status: 400 })
  }

  try {
    // Parallel data fetching for speed
    const [weather, lunar, solunar, gameActivity, pressureIndex] = await Promise.all([
      getWeatherByZip(zipCode),
      getLunarData(),
      getSolunarData(),
      getGameActivityIndex(gameType || 'big-game'),
      getBarometricIndex(zipCode),
    ])

    // Generate real-time hunting score
    const overallScore = calculateOverallHuntingScore({
      weather: weather.current.huntingScore,
      lunar: lunar.huntingScore,
      solunar: solunar.score,
      activity: gameActivity.index,
      pressure: pressureIndex.score
    })

    return NextResponse.json({
      timestamp: new Date().toISOString(),
      location: zipCode,
      gameType,
      overallScore,
      conditions: {
        weather,
        lunar,
        solunar,
        gameActivity,
        pressureIndex,
        recommendations: generateRealTimeRecommendations(overallScore, gameType)
      }
    })

  } catch (error) {
    console.error('Hunting intel error:', error)
    return NextResponse.json({
      error: 'Failed to get hunting intelligence',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Solunar tables for prime hunting times
async function getSolunarData() {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  // Calculate solunar periods (simplified algorithm)
  const moonPhase = ((now.getTime() - new Date(2000, 0, 6).getTime()) / (1000 * 60 * 60 * 24)) % 29.53
  const sunAngle = (now.getHours() + now.getMinutes() / 60) * 15 - 180

  // Major periods (sunrise/sunset +/- 2 hours, moonrise/moonset +/- 2 hours)
  const sunrise = 6.5 // Simplified - would use real sunrise API
  const sunset = 18.5
  const moonrise = (moonPhase / 29.53) * 24
  const moonset = (moonrise + 12) % 24

  const majorPeriods = [
    { start: sunrise - 1, end: sunrise + 1, type: 'Major - Sunrise' },
    { start: sunset - 1, end: sunset + 1, type: 'Major - Sunset' },
    { start: moonrise - 1, end: moonrise + 1, type: 'Major - Moonrise' },
    { start: moonset - 1, end: moonset + 1, type: 'Major - Moonset' }
  ]

  // Minor periods (moon overhead/underfoot)
  const moonOverhead = (moonrise + 6) % 24
  const moonUnderfoot = (moonrise + 18) % 24

  const minorPeriods = [
    { start: moonOverhead - 0.5, end: moonOverhead + 0.5, type: 'Minor - Moon Overhead' },
    { start: moonUnderfoot - 0.5, end: moonUnderfoot + 0.5, type: 'Minor - Moon Underfoot' }
  ]

  // Calculate current solunar score
  const currentHour = now.getHours() + now.getMinutes() / 60
  let score = 3 // Base score

  // Check if we're in a major period
  for (const period of majorPeriods) {
    if (currentHour >= period.start && currentHour <= period.end) {
      score = 8
      break
    }
  }

  // Check if we're in a minor period
  for (const period of minorPeriods) {
    if (currentHour >= period.start && currentHour <= period.end) {
      score = Math.max(score, 6)
    }
  }

  return {
    score,
    periods: [...majorPeriods, ...minorPeriods].sort((a, b) => a.start - b.start),
    moonPhase: moonPhase > 14.76 ? 'Waning' : 'Waxing',
    moonIllumination: Math.round((1 - Math.abs(moonPhase - 14.76) / 14.76) * 100)
  }
}

// Game activity patterns based on historical data
async function getGameActivityIndex(gameType: string) {
  const now = new Date()
  const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000)

  let index = 5 // Base activity level
  let factors = []

  if (gameType === 'big-game') {
    // Deer/elk patterns
    if (dayOfYear >= 300 || dayOfYear <= 30) { // Rut season
      index = 9
      factors.push('Peak rut activity')
    } else if (dayOfYear >= 270 && dayOfYear < 300) { // Pre-rut
      index = 7
      factors.push('Pre-rut movement increasing')
    } else if (dayOfYear >= 120 && dayOfYear <= 180) { // Spring feeding
      index = 6
      factors.push('Spring feeding patterns active')
    }

    // Daily patterns
    const hour = now.getHours()
    if (hour >= 5 && hour <= 9) { // Dawn
      index += 1
      factors.push('Dawn feeding period')
    } else if (hour >= 17 && hour <= 20) { // Dusk
      index += 1
      factors.push('Evening movement active')
    } else if (hour >= 10 && hour <= 15) { // Midday
      index -= 1
      factors.push('Midday bedding period')
    }

  } else if (gameType === 'upland') {
    // Waterfowl/upland patterns
    if (dayOfYear >= 260 && dayOfYear <= 350) { // Migration season
      index = 8
      factors.push('Peak migration activity')
    } else if (dayOfYear >= 90 && dayOfYear <= 150) { // Spring season
      index = 7
      factors.push('Spring breeding activity')
    }

    // Weather dependent
    const hour = now.getHours()
    if (hour >= 6 && hour <= 10) {
      index += 1
      factors.push('Morning flight activity')
    } else if (hour >= 15 && hour <= 18) {
      index += 1
      factors.push('Afternoon feeding flights')
    }
  }

  return {
    index: Math.max(1, Math.min(10, index)),
    factors,
    season: getHuntingSeason(dayOfYear, gameType),
    peakTimes: getPeakActivityTimes(gameType)
  }
}

// Barometric pressure trend analysis
async function getBarometricIndex(zipCode: string) {
  // In production, this would track pressure changes over 24-48 hours
  // For now, using current pressure with trend simulation

  const pressure = 1013 + Math.sin(Date.now() / (1000 * 60 * 60 * 6)) * 20 // Simulate 6-hour cycle
  const trend = Math.random() > 0.5 ? 'rising' : 'falling'

  let score = 5
  let recommendation = ''

  if (pressure > 1020 && trend === 'rising') {
    score = 8
    recommendation = 'High pressure stabilizing - excellent hunting'
  } else if (pressure < 1000 && trend === 'falling') {
    score = 7
    recommendation = 'Dropping pressure - increased animal movement'
  } else if (pressure > 1020 && trend === 'falling') {
    score = 6
    recommendation = 'Pressure dropping from high - good activity expected'
  } else if (pressure < 1000 && trend === 'rising') {
    score = 4
    recommendation = 'Low pressure rising - animals may be less active'
  }

  return {
    score,
    pressure: Math.round(pressure),
    trend,
    recommendation,
    change24h: Math.round((Math.random() - 0.5) * 10) // Simulate 24-hour change
  }
}

// Overall hunting score calculator
function calculateOverallHuntingScore(factors: {
  weather: number,
  lunar: number,
  solunar: number,
  activity: number,
  pressure: number
}) {
  // Weighted scoring system
  const weights = {
    weather: 0.25,
    lunar: 0.15,
    solunar: 0.20,
    activity: 0.25,
    pressure: 0.15
  }

  const weighted = (
    factors.weather * weights.weather +
    factors.lunar * weights.lunar +
    factors.solunar * weights.solunar +
    factors.activity * weights.activity +
    factors.pressure * weights.pressure
  )

  return Math.round(weighted * 10) / 10
}

// Real-time recommendations engine
function generateRealTimeRecommendations(score: number, gameType?: string) {
  const recommendations = []
  const gameSpecific = gameType === 'upland' ? 'birds' : 'game'

  if (score >= 8.0) {
    recommendations.push(`🎯 PRIME TIME - Exceptional conditions for ${gameSpecific}`)
    recommendations.push('All factors align for maximum activity')
    recommendations.push('Consider extending your hunt time')
  } else if (score >= 6.5) {
    recommendations.push(`✅ GOOD CONDITIONS - Favorable for ${gameSpecific} movement`)
    recommendations.push('Normal hunting patterns apply')
  } else if (score >= 5.0) {
    recommendations.push(`⚠️ FAIR CONDITIONS - Moderate ${gameSpecific} activity expected`)
    recommendations.push('Focus on proven spots and feeding areas')
  } else {
    recommendations.push(`❌ POOR CONDITIONS - Limited ${gameSpecific} movement`)
    recommendations.push('Consider scouting or equipment maintenance')
  }

  return recommendations
}

function getHuntingSeason(dayOfYear: number, gameType: string): string {
  if (gameType === 'big-game') {
    if (dayOfYear >= 300 || dayOfYear <= 30) return 'Rut Season'
    if (dayOfYear >= 270) return 'Pre-Rut'
    if (dayOfYear >= 240) return 'Early Season'
    if (dayOfYear >= 120 && dayOfYear <= 180) return 'Spring Season'
    return 'Off Season'
  } else {
    if (dayOfYear >= 260 && dayOfYear <= 350) return 'Fall Migration'
    if (dayOfYear >= 90 && dayOfYear <= 150) return 'Spring Season'
    return 'Off Season'
  }
}

function getPeakActivityTimes(gameType: string): string[] {
  if (gameType === 'big-game') {
    return ['5:30-8:30 AM', '4:30-7:30 PM']
  } else {
    return ['6:00-9:00 AM', '3:00-6:00 PM']
  }
}