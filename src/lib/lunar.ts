// Lunar and solunar data for hunting intelligence
export interface MoonPhaseData {
  date: string
  phase: string
  illumination: number
  age: number
  distance: number
}

export interface SolunarData {
  date: string
  moonPhase: {
    phase: string
    illumination: number
    age: number
  }
  solunarScore: number // 1-10 hunting activity score
  majorPeriods: string[] // Peak activity times
  minorPeriods: string[] // Secondary activity times
  bestHuntingTimes: string[]
  huntingRecommendation: string
}

// Get moon phase data for a specific date
export async function getMoonPhaseForDate(date: Date): Promise<MoonPhaseData | null> {
  try {
    const year = date.getFullYear()

    // Use the free GitHub moon data API
    const response = await fetch(
      `https://craigchamberlain.github.io/moon-data/api/moon-phase-data/${year}/index.json`
    )

    if (!response.ok) {
      throw new Error('Failed to fetch moon data')
    }

    const yearData = await response.json()
    const targetDateString = date.toISOString().split('T')[0] // YYYY-MM-DD format

    // Find the closest moon phase data for the target date
    let closestPhase = null
    let closestDiff = Infinity

    for (const phaseData of yearData) {
      try {
        const phaseDate = new Date(phaseData.Date)
        // Check if date is valid
        if (isNaN(phaseDate.getTime())) {
          continue
        }
        const phaseDateString = phaseDate.toISOString().split('T')[0]
        const diff = Math.abs(new Date(targetDateString).getTime() - phaseDate.getTime())

        if (diff < closestDiff) {
          closestDiff = diff
          closestPhase = phaseData
        }
      } catch (err) {
        // Skip invalid dates
        continue
      }
    }

    if (!closestPhase) return null

    const phaseName = getPhaseNameFromNumber(closestPhase.Phase)

    return {
      date: targetDateString,
      phase: phaseName,
      illumination: calculateIllumination(phaseName),
      age: calculateMoonAge(new Date(closestPhase.Date), date),
      distance: 384400 // Average distance in km
    }

  } catch (error) {
    console.error('Moon phase API error:', error)
    return null
  }
}

// Calculate solunar data for hunting
export async function getSolunarDataForHunting(date: Date, latitude: number, longitude: number): Promise<SolunarData> {
  const moonPhase = await getMoonPhaseForDate(date)

  if (!moonPhase) {
    return {
      date: date.toISOString().split('T')[0],
      moonPhase: {
        phase: 'Unknown',
        illumination: 50,
        age: 15
      },
      solunarScore: 5,
      majorPeriods: ['6:00 AM - 8:00 AM', '6:00 PM - 8:00 PM'],
      minorPeriods: ['12:00 PM - 1:00 PM', '12:00 AM - 1:00 AM'],
      bestHuntingTimes: ['Dawn', 'Dusk'],
      huntingRecommendation: 'Fair hunting conditions - standard activity patterns expected'
    }
  }

  // Calculate solunar score based on moon phase
  const solunarScore = calculateSolunarScore(moonPhase.phase, moonPhase.illumination)

  // Calculate major and minor periods (simplified - real solunar uses complex calculations)
  const { majorPeriods, minorPeriods } = calculateSolunarPeriods(date, latitude, longitude, moonPhase)

  // Generate hunting recommendation
  const huntingRecommendation = generateSolunarRecommendation(moonPhase.phase, solunarScore)

  return {
    date: date.toISOString().split('T')[0],
    moonPhase: {
      phase: moonPhase.phase,
      illumination: moonPhase.illumination,
      age: moonPhase.age
    },
    solunarScore,
    majorPeriods,
    minorPeriods,
    bestHuntingTimes: [...majorPeriods, ...minorPeriods],
    huntingRecommendation
  }
}

// Convert phase number to phase name
function getPhaseNameFromNumber(phaseNum: number): string {
  const phases = ['New', 'First Quarter', 'Full', 'Last Quarter']
  return phases[phaseNum] || 'Unknown'
}

// Calculate illumination percentage based on phase
function calculateIllumination(phase: string): number {
  const phaseMap: { [key: string]: number } = {
    'New': 0,
    'Waxing Crescent': 25,
    'First Quarter': 50,
    'Waxing Gibbous': 75,
    'Full': 100,
    'Waning Gibbous': 75,
    'Last Quarter': 50,
    'Waning Crescent': 25
  }

  return phaseMap[phase] || 50
}

// Calculate moon age in days
function calculateMoonAge(phaseDate: Date, currentDate: Date): number {
  const diffTime = Math.abs(currentDate.getTime() - phaseDate.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return Math.min(diffDays, 29) // Moon cycle is ~29 days
}

// Calculate hunting activity score based on moon phase
function calculateSolunarScore(phase: string, illumination: number): number {
  let score = 5 // Base score

  // New moon and full moon = highest activity
  if (phase === 'New' || phase === 'Full') {
    score += 3
  }

  // Quarter moons = good activity
  if (phase.includes('Quarter')) {
    score += 2
  }

  // Waxing phases generally better than waning for feeding
  if (phase.includes('Waxing')) {
    score += 1
  }

  return Math.max(1, Math.min(10, score))
}

// Calculate solunar periods (simplified version)
function calculateSolunarPeriods(date: Date, lat: number, lon: number, moonPhase: MoonPhaseData) {
  // This is a simplified calculation. Real solunar tables use complex astronomical calculations
  // for moon transit, moonrise, moonset times specific to location

  // Major periods (2 hours each) - when moon is overhead or underfoot
  const majorPeriods = [
    '5:30 AM - 7:30 AM', // Dawn major period
    '5:30 PM - 7:30 PM'  // Dusk major period
  ]

  // Minor periods (1 hour each) - when moon is on the horizon
  const minorPeriods = [
    '11:30 AM - 12:30 PM', // Midday minor
    '11:30 PM - 12:30 AM'  // Midnight minor
  ]

  // Adjust times based on moon phase (full/new moons shift peak times)
  if (moonPhase.phase === 'Full') {
    majorPeriods[0] = '6:00 AM - 8:00 AM'
    majorPeriods[1] = '6:00 PM - 8:00 PM'
  }

  if (moonPhase.phase === 'New') {
    majorPeriods[0] = '5:00 AM - 7:00 AM'
    majorPeriods[1] = '5:00 PM - 7:00 PM'
  }

  return { majorPeriods, minorPeriods }
}

// Generate hunting recommendation based on lunar data
function generateSolunarRecommendation(phase: string, score: number): string {
  if (score >= 8) {
    return `Excellent hunting conditions - ${phase} moon phase creates peak animal activity`
  }

  if (score >= 6) {
    return `Good hunting conditions - ${phase} moon phase encourages animal movement`
  }

  if (score >= 4) {
    return `Fair hunting conditions - ${phase} moon phase provides moderate activity`
  }

  return `Poor hunting conditions - ${phase} moon phase may reduce animal activity`
}

// Find optimal hunting dates in the next 7 days
export async function findOptimalHuntingDates(latitude: number, longitude: number): Promise<string[]> {
  const optimalDates: string[] = []
  const today = new Date()

  for (let i = 0; i < 7; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)

    const solunarData = await getSolunarDataForHunting(date, latitude, longitude)

    if (solunarData.solunarScore >= 7) {
      optimalDates.push(`${date.toLocaleDateString()}: ${solunarData.huntingRecommendation} (Score: ${solunarData.solunarScore}/10)`)
    }
  }

  return optimalDates
}

// Simple lunar data function for hunting intelligence API
export async function getLunarData() {
  const today = new Date()
  const moonPhase = await getMoonPhaseForDate(today)

  if (!moonPhase) {
    return {
      phase: 'Unknown',
      illumination: 50,
      huntingScore: 5,
      recommendation: 'Fair hunting conditions - standard lunar activity'
    }
  }

  const huntingScore = calculateSolunarScore(moonPhase.phase, moonPhase.illumination)

  return {
    phase: moonPhase.phase,
    illumination: moonPhase.illumination,
    age: moonPhase.age,
    huntingScore,
    recommendation: generateSolunarRecommendation(moonPhase.phase, huntingScore)
  }
}