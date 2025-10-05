/**
 * Visual Crossing Weather API Client
 * Timeline Plan: Historical + 15-day forecast
 *
 * Features:
 * - Historical weather (for backfilling past hunts)
 * - 15-day hourly forecasts
 * - Minute-by-minute precipitation
 * - Pressure trends
 * - Premium data quality ($249/mo)
 */

export interface VisualCrossingWeatherData {
  // Core hunt logging data
  datetime: string // ISO timestamp
  temperature: number // Fahrenheit
  feels_like: number
  humidity: number // 0-100
  dew_point: number

  // Pressure (CRITICAL for hunting)
  pressure: number // Millibars
  pressure_trend?: 'rising' | 'falling' | 'steady'

  // Wind
  wind_speed: number // MPH
  wind_gust?: number
  wind_direction: number // Degrees 0-360
  wind_direction_cardinal: string // 'N', 'NE', etc.

  // Precipitation
  precip: number // Inches
  precip_prob: number // 0-100
  precip_type?: string // 'rain', 'snow', 'none'

  // Sky conditions
  cloud_cover: number // 0-100
  visibility: number // Miles
  conditions: string // 'Clear', 'Cloudy', etc.
  description?: string

  // Sun
  sunrise?: string // ISO timestamp
  sunset?: string // ISO timestamp

  // Other
  uv_index?: number
  snow_depth?: number
}

export interface VisualCrossingHourlyForecast {
  hours: VisualCrossingWeatherData[]
}

export interface VisualCrossingDailyForecast {
  date: string
  temp_max: number
  temp_min: number
  conditions: string
  description: string
  hours: VisualCrossingWeatherData[]
}

/**
 * Fetch historical weather for a specific date/time/location
 * Used when logging past hunts
 */
export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  date: string, // YYYY-MM-DD
  time?: string // HH:MM:SS (optional, defaults to noon)
): Promise<VisualCrossingWeatherData | null> {
  const API_KEY = process.env.VISUAL_CROSSING_API_KEY

  if (!API_KEY) {
    throw new Error('VISUAL_CROSSING_API_KEY not set')
  }

  try {
    // Visual Crossing Timeline API
    // Docs: https://www.visualcrossing.com/resources/documentation/weather-api/timeline-weather-api/
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}/${date}/${date}`

    const params = new URLSearchParams({
      key: API_KEY,
      unitGroup: 'us', // Fahrenheit, MPH, inches
      include: 'hours', // Include hourly data
      elements: 'datetime,temp,feelslike,humidity,dew,pressure,windspeed,windgust,winddir,precipprob,precip,preciptype,cloudcover,visibility,conditions,description,sunrise,sunset,uvindex,snowdepth'
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Visual Crossing API error: ${response.status} ${error}`)
    }

    const data = await response.json()

    // If time specified, find closest hour
    if (time && data.days?.[0]?.hours) {
      const targetHour = parseInt(time.split(':')[0])
      const hourData = data.days[0].hours.find((h: any) => {
        const hour = parseInt(h.datetime.split(':')[0])
        return hour === targetHour
      }) || data.days[0].hours[0]

      return normalizeWeatherData(hourData, data.days[0])
    }

    // Otherwise return day average
    if (data.days?.[0]) {
      return normalizeWeatherData(data.days[0], data.days[0])
    }

    return null
  } catch (error) {
    console.error('Visual Crossing historical weather error:', error)
    return null
  }
}

/**
 * Fetch current + future weather forecast
 * Used for checking upcoming conditions
 */
export async function getForecastWeather(
  latitude: number,
  longitude: number,
  days: number = 7 // How many days ahead
): Promise<VisualCrossingDailyForecast[]> {
  const API_KEY = process.env.VISUAL_CROSSING_API_KEY

  if (!API_KEY) {
    throw new Error('VISUAL_CROSSING_API_KEY not set')
  }

  try {
    // Get forecast for next N days
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}`

    const params = new URLSearchParams({
      key: API_KEY,
      unitGroup: 'us',
      include: 'hours,days',
      elements: 'datetime,temp,tempmax,tempmin,feelslike,humidity,dew,pressure,windspeed,windgust,winddir,precipprob,precip,preciptype,cloudcover,visibility,conditions,description,sunrise,sunset,uvindex'
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Visual Crossing API error: ${response.status} ${error}`)
    }

    const data = await response.json()

    if (!data.days || data.days.length === 0) {
      return []
    }

    // Return daily forecasts with hourly data
    return data.days.slice(0, days).map((day: any) => ({
      date: day.datetime,
      temp_max: day.tempmax,
      temp_min: day.tempmin,
      conditions: day.conditions,
      description: day.description || day.conditions,
      hours: (day.hours || []).map((hour: any) => normalizeWeatherData(hour, day))
    }))

  } catch (error) {
    console.error('Visual Crossing forecast error:', error)
    return []
  }
}

/**
 * Calculate pressure trend by comparing multiple time points
 */
export async function getPressureTrend(
  latitude: number,
  longitude: number,
  targetDate: string,
  targetTime: string
): Promise<{
  current: number
  trend_1hr: number
  trend_3hr: number
  trend_6hr: number
  direction: 'rising' | 'falling' | 'steady'
}> {
  const API_KEY = process.env.VISUAL_CROSSING_API_KEY

  if (!API_KEY) {
    throw new Error('VISUAL_CROSSING_API_KEY not set')
  }

  try {
    // Get hourly data for the day
    const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${latitude},${longitude}/${targetDate}/${targetDate}`

    const params = new URLSearchParams({
      key: API_KEY,
      unitGroup: 'us',
      include: 'hours',
      elements: 'datetime,pressure'
    })

    const response = await fetch(`${url}?${params}`)

    if (!response.ok) {
      throw new Error(`Visual Crossing API error: ${response.status}`)
    }

    const data = await response.json()
    const hours = data.days?.[0]?.hours || []

    const targetHour = parseInt(targetTime.split(':')[0])
    const targetIndex = hours.findIndex((h: any) =>
      parseInt(h.datetime.split(':')[0]) === targetHour
    )

    if (targetIndex === -1) {
      throw new Error('Target time not found in hourly data')
    }

    const currentPressure = hours[targetIndex].pressure
    const pressure1hrAgo = hours[Math.max(0, targetIndex - 1)]?.pressure || currentPressure
    const pressure3hrAgo = hours[Math.max(0, targetIndex - 3)]?.pressure || currentPressure
    const pressure6hrAgo = hours[Math.max(0, targetIndex - 6)]?.pressure || currentPressure

    const change3hr = currentPressure - pressure3hrAgo

    let direction: 'rising' | 'falling' | 'steady' = 'steady'
    if (change3hr > 1) direction = 'rising'
    else if (change3hr < -1) direction = 'falling'

    return {
      current: currentPressure,
      trend_1hr: currentPressure - pressure1hrAgo,
      trend_3hr: change3hr,
      trend_6hr: currentPressure - pressure6hrAgo,
      direction
    }

  } catch (error) {
    console.error('Pressure trend calculation error:', error)
    // Return defaults if error
    const defaultPressure = 1013 // Standard atmospheric pressure
    return {
      current: defaultPressure,
      trend_1hr: 0,
      trend_3hr: 0,
      trend_6hr: 0,
      direction: 'steady'
    }
  }
}

/**
 * Normalize Visual Crossing API data to our standard format
 */
function normalizeWeatherData(hourData: any, dayData: any): VisualCrossingWeatherData {
  return {
    datetime: hourData.datetime,
    temperature: Math.round(hourData.temp || hourData.temperature || dayData.temp),
    feels_like: Math.round(hourData.feelslike || hourData.temp || dayData.temp),
    humidity: hourData.humidity || dayData.humidity || 0,
    dew_point: Math.round(hourData.dew || dayData.dew || 0),

    pressure: hourData.pressure || dayData.pressure || 1013,

    wind_speed: Math.round(hourData.windspeed || dayData.windspeed || 0),
    wind_gust: hourData.windgust ? Math.round(hourData.windgust) : undefined,
    wind_direction: hourData.winddir || dayData.winddir || 0,
    wind_direction_cardinal: degreesToCardinal(hourData.winddir || dayData.winddir || 0),

    precip: hourData.precip || dayData.precip || 0,
    precip_prob: hourData.precipprob || dayData.precipprob || 0,
    precip_type: hourData.preciptype?.[0] || dayData.preciptype?.[0] || 'none',

    cloud_cover: hourData.cloudcover || dayData.cloudcover || 0,
    visibility: hourData.visibility || dayData.visibility || 10,
    conditions: hourData.conditions || dayData.conditions || 'Clear',
    description: hourData.description || dayData.description,

    sunrise: dayData.sunrise,
    sunset: dayData.sunset,

    uv_index: hourData.uvindex || dayData.uvindex,
    snow_depth: hourData.snowdepth || dayData.snowdepth
  }
}

/**
 * Convert wind degrees to cardinal direction
 */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

/**
 * Calculate minutes from sunrise/sunset
 */
export function calculateMinutesFromSun(
  huntTime: string, // "HH:MM:SS"
  sunrise: string,   // "HH:MM:SS"
  sunset: string     // "HH:MM:SS"
): {
  minutes_from_sunrise: number
  minutes_from_sunset: number
} {
  const huntMinutes = timeToMinutes(huntTime)
  const sunriseMinutes = timeToMinutes(sunrise)
  const sunsetMinutes = timeToMinutes(sunset)

  return {
    minutes_from_sunrise: huntMinutes - sunriseMinutes,
    minutes_from_sunset: huntMinutes - sunsetMinutes
  }
}

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * 60 + minutes
}
