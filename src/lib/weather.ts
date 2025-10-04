/**
 * Weather Data Fetcher for Hunt Wet AI
 *
 * UPGRADED: Using OpenWeather One Call API 3.0
 * - 7-day daily forecast
 * - 48-hour hourly forecast
 * - Current conditions + feels like
 * - Pressure trends
 * - Better precipitation data
 *
 * PHILOSOPHY: This file ONLY fetches raw weather data
 * ALL REASONING/INTELLIGENCE is handled by GPT-4
 */

// Raw weather data from OpenWeather One Call API 3.0
export interface RawWeatherData {
  current: {
    temperature: number        // Fahrenheit
    feels_like: number         // Fahrenheit
    barometric_pressure: number // Millibars
    humidity: number           // Percentage
    wind_speed: number         // MPH
    wind_direction: string     // Cardinal direction (N, NE, etc.)
    wind_degrees: number       // 0-360
    wind_gust?: number        // Wind gusts MPH
    conditions: string         // "Clear", "Clouds", "Rain", etc.
    description: string        // "scattered clouds", "light rain", etc.
    visibility: number         // Meters
    clouds: number            // Cloud cover percentage
    uvi: number               // UV index
    dew_point: number         // Fahrenheit
    sunrise: number           // Unix timestamp
    sunset: number            // Unix timestamp
  }
  hourly: Array<{
    timestamp: number         // Unix timestamp
    temperature: number
    feels_like: number
    barometric_pressure: number
    humidity: number
    wind_speed: number
    wind_direction: string
    conditions: string
    description: string
    precipitation_chance: number  // 0-100
    precipitation_amount?: number // inches
  }>
  daily: Array<{
    date: string              // ISO date string
    timestamp: number         // Unix timestamp
    temp_min: number         // Fahrenheit
    temp_max: number         // Fahrenheit
    temp_morning: number
    temp_day: number
    temp_evening: number
    temp_night: number
    barometric_pressure: number
    humidity: number
    wind_speed: number
    wind_direction: string
    wind_gust?: number
    conditions: string
    description: string
    precipitation_chance: number  // 0-100
    precipitation_amount?: number // inches
    uvi: number
    sunrise: number
    sunset: number
  }>
  location: {
    name: string
    lat: number
    lon: number
    timezone: string
  }
}

/**
 * Fetch raw weather data using One Call API 3.0
 * Gets current + 48hr hourly + 7-day daily in ONE call
 */
export async function getWeatherData(lat: number, lon: number): Promise<RawWeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'

  try {
    // One Call API 3.0 - everything in one request
    const response = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    )

    const data = await response.json()

    if (data.cod && data.cod !== 200) {
      throw new Error('Weather API error: ' + data.message)
    }

    // Process hourly data (48 hours)
    const hourlyData = (data.hourly || []).slice(0, 48).map((hour: any) => ({
      timestamp: hour.dt,
      temperature: Math.round(hour.temp),
      feels_like: Math.round(hour.feels_like),
      barometric_pressure: hour.pressure,
      humidity: hour.humidity,
      wind_speed: Math.round(hour.wind_speed),
      wind_direction: degreesToCardinal(hour.wind_deg || 0),
      conditions: hour.weather[0]?.main || 'Unknown',
      description: hour.weather[0]?.description || 'Unknown',
      precipitation_chance: hour.pop ? Math.round(hour.pop * 100) : 0,
      precipitation_amount: hour.rain?.['1h'] ? hour.rain['1h'] / 25.4 : undefined // mm to inches
    }))

    // Process daily data (7-8 days)
    const dailyData = (data.daily || []).slice(0, 7).map((day: any) => ({
      date: new Date(day.dt * 1000).toISOString().split('T')[0],
      timestamp: day.dt,
      temp_min: Math.round(day.temp.min),
      temp_max: Math.round(day.temp.max),
      temp_morning: Math.round(day.temp.morn),
      temp_day: Math.round(day.temp.day),
      temp_evening: Math.round(day.temp.eve),
      temp_night: Math.round(day.temp.night),
      barometric_pressure: day.pressure,
      humidity: day.humidity,
      wind_speed: Math.round(day.wind_speed),
      wind_direction: degreesToCardinal(day.wind_deg || 0),
      wind_gust: day.wind_gust ? Math.round(day.wind_gust) : undefined,
      conditions: day.weather[0]?.main || 'Unknown',
      description: day.weather[0]?.description || 'Unknown',
      precipitation_chance: day.pop ? Math.round(day.pop * 100) : 0,
      precipitation_amount: day.rain ? day.rain / 25.4 : undefined, // mm to inches
      uvi: day.uvi || 0,
      sunrise: day.sunrise,
      sunset: day.sunset
    }))

    // Get location name via reverse geocoding (cached in most cases)
    let locationName = 'Unknown'
    try {
      const geoResponse = await fetch(
        `http://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
      )
      const geoData = await geoResponse.json()
      if (geoData[0]) {
        locationName = geoData[0].name || 'Unknown'
      }
    } catch (e) {
      console.warn('Reverse geocoding failed, using coordinates')
    }

    return {
      current: {
        temperature: Math.round(data.current.temp),
        feels_like: Math.round(data.current.feels_like),
        barometric_pressure: data.current.pressure,
        humidity: data.current.humidity,
        wind_speed: Math.round(data.current.wind_speed),
        wind_direction: degreesToCardinal(data.current.wind_deg || 0),
        wind_degrees: data.current.wind_deg || 0,
        wind_gust: data.current.wind_gust ? Math.round(data.current.wind_gust) : undefined,
        conditions: data.current.weather[0]?.main || 'Unknown',
        description: data.current.weather[0]?.description || 'Unknown',
        visibility: data.current.visibility || 0,
        clouds: data.current.clouds || 0,
        uvi: data.current.uvi || 0,
        dew_point: Math.round(data.current.dew_point),
        sunrise: data.current.sunrise,
        sunset: data.current.sunset
      },
      hourly: hourlyData,
      daily: dailyData,
      location: {
        name: locationName,
        lat,
        lon,
        timezone: data.timezone || 'UTC'
      }
    }

  } catch (error) {
    console.error('Weather API error:', error)
    throw new Error('Failed to fetch weather data: ' + (error instanceof Error ? error.message : String(error)))
  }
}

/**
 * Legacy function for ZIP code support
 * Converts ZIP → lat/lon → weather data
 */
export async function getWeatherByZip(zipCode: string): Promise<RawWeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo'

  try {
    // Convert ZIP to coordinates
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`
    )
    const geoData = await geoResponse.json()

    if (!geoData.lat || !geoData.lon) {
      throw new Error('Invalid ZIP code: ' + zipCode)
    }

    // Use coordinate-based fetch
    return getWeatherData(geoData.lat, geoData.lon)

  } catch (error) {
    console.error('Geocoding error:', error)
    throw new Error('Failed to get coordinates for ZIP: ' + zipCode)
  }
}

/**
 * Convert wind degrees to cardinal direction
 * 0° = N, 90° = E, 180° = S, 270° = W
 */
function degreesToCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

/**
 * Get radar/precipitation map URL
 * Use this for visual display of weather patterns
 */
export function getRadarMapUrl(lat: number, lon: number, zoom: number = 10): string {
  const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo'
  // OpenWeather Weather Map layers
  // Options: precipitation, clouds, pressure, wind, temp
  return `https://tile.openweathermap.org/map/precipitation_new/${zoom}/${lon}/${lat}.png?appid=${API_KEY}`
}

/**
 * Format weather data for GPT-4 consumption
 * Returns a clean string summary that GPT can reason about
 * NOW WITH: 7-day forecast, hourly trends, sunrise/sunset, pressure trends
 */
export function formatWeatherForGPT(weather: RawWeatherData): string {
  const { current, hourly, daily, location } = weather

  let summary = `CURRENT CONDITIONS (${location.name}):\n`
  summary += `Temperature: ${current.temperature}°F (feels like ${current.feels_like}°F)\n`
  summary += `Barometric Pressure: ${current.barometric_pressure} mb\n`
  summary += `Wind: ${current.wind_speed} mph from ${current.wind_direction}`
  if (current.wind_gust) summary += ` (gusts ${current.wind_gust} mph)`
  summary += `\n`
  summary += `Humidity: ${current.humidity}%\n`
  summary += `Dew Point: ${current.dew_point}°F\n`
  summary += `Conditions: ${current.description}\n`
  summary += `Cloud Cover: ${current.clouds}%\n`
  summary += `UV Index: ${current.uvi}\n`
  summary += `Visibility: ${Math.round(current.visibility * 0.000621371)} miles\n\n`

  // Pressure trend analysis (next 12 hours)
  summary += `PRESSURE TREND (Next 12 Hours):\n`
  const pressureTrend = hourly.slice(0, 12).map((h, i) =>
    `  ${i * 1}hr: ${h.barometric_pressure} mb`
  ).join('\n')
  summary += pressureTrend + '\n\n'

  // Next 24 hours hourly (critical for hunting timing)
  summary += `HOURLY FORECAST (Next 24 Hours):\n`
  hourly.slice(0, 24).forEach((hour, i) => {
    const time = new Date(hour.timestamp * 1000).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true })
    summary += `  ${time}: ${hour.temperature}°F, ${hour.barometric_pressure}mb, ${hour.wind_speed}mph ${hour.wind_direction}, ${hour.description}`
    if (hour.precipitation_chance > 0) summary += `, ${hour.precipitation_chance}% precip`
    summary += `\n`
  })
  summary += `\n`

  // 7-day daily forecast
  summary += `7-DAY FORECAST:\n`
  daily.forEach((day, i) => {
    const dayName = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.timestamp * 1000).toLocaleDateString('en-US', { weekday: 'long' })
    summary += `${dayName} (${day.date}):\n`
    summary += `  Temps: ${day.temp_min}°F - ${day.temp_max}°F (Morning: ${day.temp_morning}°F, Day: ${day.temp_day}°F, Evening: ${day.temp_evening}°F)\n`
    summary += `  Pressure: ${day.barometric_pressure} mb\n`
    summary += `  Wind: ${day.wind_speed} mph ${day.wind_direction}`
    if (day.wind_gust) summary += ` (gusts ${day.wind_gust} mph)`
    summary += `\n`
    summary += `  Conditions: ${day.description}\n`
    summary += `  Precipitation: ${day.precipitation_chance}%\n`
    summary += `  Sunrise: ${new Date(day.sunrise * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}, Sunset: ${new Date(day.sunset * 1000).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}\n`
    summary += `\n`
  })

  return summary
}
