// Historical weather pattern matching system
// Query Visual Crossing API to find dates with similar conditions

interface WeatherConditions {
  temperature?: number
  tempRange?: [number, number] // e.g., [55, 65]
  pressure?: number
  pressureTrend?: 'rising' | 'falling' | 'steady'
  windSpeed?: number
  windDirection?: string
  moonPhase?: string
  humidity?: number
  precipitation?: number
}

interface HistoricalMatch {
  date: string // YYYY-MM-DD
  conditions: {
    temperature: number
    pressure: number
    pressureTrend: string
    windSpeed: number
    windDirection: string
    moonPhase: string
    humidity: number
    precipitation: number
    feelsLike: number
    dewPoint: number
    cloudCover: number
  }
  matchScore: number // 0-100, how closely it matches
  hunted: boolean // Did user hunt this date?
  huntOutcome?: 'success' | 'failure' | 'scouting'
  huntNotes?: string
}

/**
 * Query Visual Crossing historical weather data to find dates with similar conditions
 * Uses cache to minimize API calls
 * @param latitude Location latitude
 * @param longitude Location longitude
 * @param startDate Start of date range (YYYY-MM-DD)
 * @param endDate End of date range (YYYY-MM-DD)
 * @param targetConditions Conditions to match against
 * @param tolerance Matching tolerance (0-1, default 0.15 = 15% variance allowed)
 */
export async function findSimilarWeatherDates(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string,
  targetConditions: WeatherConditions,
  tolerance: number = 0.15
): Promise<HistoricalMatch[]> {

  const apiKey = process.env.VISUAL_CROSSING_API_KEY
  if (!apiKey) {
    throw new Error('VISUAL_CROSSING_API_KEY not found')
  }

  try {
    // Step 1: Check cache
    const { getCachedWeatherDates, getMissingDateRanges, cacheWeatherData } = await import('./historical-weather-cache')
    const cachedData = await getCachedWeatherDates(latitude, longitude, startDate, endDate)

    let allWeatherDays = cachedData.map(d => ({
      datetime: d.date,
      temp: d.temperature,
      feelslike: d.feels_like,
      dew: d.dew_point,
      humidity: d.humidity,
      pressure: d.barometric_pressure,
      windspeed: d.wind_speed,
      windgust: d.wind_gust,
      winddir: d.wind_direction_degrees,
      precip: d.precipitation,
      cloudcover: d.cloud_cover,
      visibility: d.visibility,
      moonphase: d.moon_phase_value,
      sunrise: d.sunrise,
      sunset: d.sunset
    }))

    // Step 2: Fetch missing data from API
    const cachedDates = cachedData.map(d => d.date)
    const missingRanges = getMissingDateRanges(startDate, endDate, cachedDates)

    console.log(`Cache hit: ${cachedDates.length} days, Missing: ${missingRanges.length} ranges`)

    for (const [rangeStart, rangeEnd] of missingRanges) {
      const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}/${rangeStart}/${rangeEnd}?unitGroup=us&key=${apiKey}&include=days`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Visual Crossing API error: ${response.status}`)
      }

      const data = await response.json()

      // Add to results
      allWeatherDays.push(...data.days)

      // Cache the data
      await cacheWeatherData(latitude, longitude, data.days)

      console.log(`Fetched and cached ${data.days.length} days from ${rangeStart} to ${rangeEnd}`)
    }

    // Step 3: Analyze and match
    const matches: HistoricalMatch[] = []

    for (const day of allWeatherDays) {
      const trend = calculatePressureTrend(day)

      // Simple filtering: If conditions are specified, check if day matches
      let isMatch = true

      // Check pressure trend
      if (targetConditions.pressureTrend && trend !== targetConditions.pressureTrend) {
        isMatch = false
      }

      // Check temperature range
      if (targetConditions.tempRange) {
        const [min, max] = targetConditions.tempRange
        if (day.temp < min || day.temp > max) {
          isMatch = false
        }
      }

      // Check temperature (within 10°F tolerance)
      if (targetConditions.temperature) {
        const tempDiff = Math.abs(day.temp - targetConditions.temperature)
        if (tempDiff > 10) {
          isMatch = false
        }
      }

      // Check pressure (within 0.5 inHg tolerance)
      if (targetConditions.pressure && day.pressure) {
        const pressureDiff = Math.abs(day.pressure - targetConditions.pressure)
        if (pressureDiff > 0.5) {
          isMatch = false
        }
      }

      // Check moon phase
      if (targetConditions.moonPhase) {
        const dayMoonPhase = getMoonPhaseName(day.moonphase)
        if (dayMoonPhase !== targetConditions.moonPhase) {
          isMatch = false
        }
      }

      if (isMatch) {
        const matchScore = calculateMatchScore(day, targetConditions, tolerance)
        matches.push({
          date: day.datetime,
          conditions: {
            temperature: day.temp,
            pressure: day.pressure,
            pressureTrend: trend,
            windSpeed: day.windspeed,
            windDirection: day.winddir ? getWindDirection(day.winddir) : 'N/A',
            moonPhase: getMoonPhaseName(day.moonphase),
            humidity: day.humidity,
            precipitation: day.precip || 0,
            feelsLike: day.feelslike,
            dewPoint: day.dew,
            cloudCover: day.cloudcover
          },
          matchScore,
          hunted: false // Will be updated by cross-referencing hunt logs
        })
      }
    }

    console.log(`Total days: ${allWeatherDays.length}, Matches found: ${matches.length}`)

    // Sort by match score (highest first), then limit to top 50
    // This gives variety while keeping the best matches
    matches.sort((a, b) => b.matchScore - a.matchScore)

    return matches.slice(0, 50)

  } catch (error) {
    console.error('Error querying historical weather:', error)
    throw error
  }
}

/**
 * Calculate how closely a historical day matches target conditions
 * Returns score 0-100
 *
 * NEW APPROACH: Score based on individual factors, not average
 * This creates MORE DIVERSITY in results instead of only showing exact matches
 */
function calculateMatchScore(
  day: any,
  target: WeatherConditions,
  tolerance: number
): number {
  let score = 0
  const weights = {
    pressure: 30,      // Most important for hunting
    pressureTrend: 25, // Critical factor
    temperature: 20,   // Important but flexible
    moonPhase: 15,     // Significant
    wind: 10           // Less critical
  }

  // Temperature scoring - wider tolerance
  if (target.temperature !== undefined) {
    const tempDiff = Math.abs(day.temp - target.temperature)
    if (tempDiff <= 5) {
      score += weights.temperature // Within 5°F = full points
    } else if (tempDiff <= 10) {
      score += weights.temperature * 0.7 // Within 10°F = 70%
    } else if (tempDiff <= 15) {
      score += weights.temperature * 0.4 // Within 15°F = 40%
    }
  }

  // Temperature range match (if specified)
  if (target.tempRange) {
    const [min, max] = target.tempRange
    if (day.temp >= min && day.temp <= max) {
      score += weights.temperature
    } else if (day.temp >= min - 5 && day.temp <= max + 5) {
      score += weights.temperature * 0.6 // Close to range
    }
  }

  // Pressure match - wider tolerance
  if (target.pressure !== undefined && day.pressure) {
    const pressureDiff = Math.abs(day.pressure - target.pressure)
    if (pressureDiff <= 0.3) {
      score += weights.pressure // Very close
    } else if (pressureDiff <= 0.6) {
      score += weights.pressure * 0.7
    } else if (pressureDiff <= 1.0) {
      score += weights.pressure * 0.4
    }
  }

  // Pressure trend match - MOST IMPORTANT
  if (target.pressureTrend) {
    const dayTrend = calculatePressureTrend(day)
    if (dayTrend === target.pressureTrend) {
      score += weights.pressureTrend // Exact match on trend
    } else if (
      (target.pressureTrend === 'falling' && dayTrend === 'steady') ||
      (target.pressureTrend === 'rising' && dayTrend === 'steady')
    ) {
      score += weights.pressureTrend * 0.4 // Partial credit for steady
    }
  }

  // Wind speed match - loose tolerance
  if (target.windSpeed !== undefined) {
    const windDiff = Math.abs(day.windspeed - target.windSpeed)
    if (windDiff <= 5) {
      score += weights.wind
    } else if (windDiff <= 10) {
      score += weights.wind * 0.5
    }
  }

  // Moon phase match
  if (target.moonPhase) {
    const dayMoonPhase = getMoonPhaseName(day.moonphase)
    if (dayMoonPhase === target.moonPhase) {
      score += weights.moonPhase
    } else {
      // Check if same general phase (waxing vs waning)
      const targetIsWaxing = target.moonPhase.includes('Waxing')
      const dayIsWaxing = dayMoonPhase.includes('Waxing')
      if (targetIsWaxing === dayIsWaxing) {
        score += weights.moonPhase * 0.5
      }
    }
  }

  return score
}

/**
 * Calculate pressure trend from day data
 * NOTE: Visual Crossing returns pressure in mb, not inHg
 * mb ranges: Low=980-1000, Normal=1013, High=1020-1030
 */
function calculatePressureTrend(day: any): string {
  // Visual Crossing uses millibars (mb), not inHg
  if (day.pressure < 1010) return 'falling'  // Low pressure system
  if (day.pressure > 1020) return 'rising'   // High pressure system
  return 'steady'
}

/**
 * Convert wind direction degrees to cardinal direction
 */
function getWindDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']
  const index = Math.round(degrees / 45) % 8
  return directions[index]
}

/**
 * Convert moon phase value to name
 */
function getMoonPhaseName(phase: number): string {
  if (phase === 0) return 'New Moon'
  if (phase < 0.25) return 'Waxing Crescent'
  if (phase === 0.25) return 'First Quarter'
  if (phase < 0.5) return 'Waxing Gibbous'
  if (phase === 0.5) return 'Full Moon'
  if (phase < 0.75) return 'Waning Gibbous'
  if (phase === 0.75) return 'Last Quarter'
  return 'Waning Crescent'
}

/**
 * Get today's conditions for pattern matching
 */
export async function getTodayConditions(
  latitude: number,
  longitude: number
): Promise<WeatherConditions> {
  const apiKey = process.env.VISUAL_CROSSING_API_KEY
  if (!apiKey) {
    throw new Error('VISUAL_CROSSING_API_KEY not found')
  }

  const today = new Date().toISOString().split('T')[0]
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}/${today}?unitGroup=us&key=${apiKey}&include=current`

  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Visual Crossing API error: ${response.status}`)
  }

  const data = await response.json()

  // Use currentConditions if available, otherwise use today's day data
  const current = data.currentConditions || data.days[0]

  if (!current) {
    throw new Error('No weather data available for today')
  }

  return {
    temperature: current.temp,
    pressure: current.pressure,
    pressureTrend: current.pressure < 29.8 ? 'falling' : current.pressure > 30.2 ? 'rising' : 'steady',
    windSpeed: current.windspeed,
    windDirection: getWindDirection(current.winddir),
    moonPhase: getMoonPhaseName(data.days[0]?.moonphase || 0),
    humidity: current.humidity,
    precipitation: current.precip || 0
  }
}
