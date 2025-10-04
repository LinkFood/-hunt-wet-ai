/**
 * Weather Data Fetcher for Hunt Wet AI
 *
 * PHILOSOPHY: This file ONLY fetches raw weather data from OpenWeather API
 * ALL REASONING/INTELLIGENCE is handled by GPT-4
 *
 * Use Cases:
 * 1. Fetch current weather conditions (temp, pressure, wind)
 * 2. Fetch 5-day forecast data
 * 3. Provide radar/map data (if needed for visual display)
 *
 * What this DOES NOT do:
 * - Calculate "hunting scores" (GPT-4 does this)
 * - Generate recommendations (GPT-4 does this)
 * - Interpret weather patterns (GPT-4 does this)
 */

// Raw weather data from OpenWeather API
export interface RawWeatherData {
  current: {
    temperature: number        // Fahrenheit
    feels_like: number         // Fahrenheit
    barometric_pressure: number // Millibars
    humidity: number           // Percentage
    wind_speed: number         // MPH
    wind_direction: string     // Cardinal direction (N, NE, etc.)
    wind_degrees: number       // 0-360
    conditions: string         // "Clear", "Clouds", "Rain", etc.
    description: string        // "scattered clouds", "light rain", etc.
    visibility: number         // Meters
    clouds: number            // Cloud cover percentage
  }
  forecast: Array<{
    date: string              // ISO date string
    timestamp: number         // Unix timestamp
    temperature: number       // Fahrenheit
    temp_min: number         // Fahrenheit
    temp_max: number         // Fahrenheit
    barometric_pressure: number
    humidity: number
    wind_speed: number
    wind_direction: string
    conditions: string
    description: string
    precipitation_chance?: number // Percentage (if available)
  }>
  location: {
    name: string
    lat: number
    lon: number
  }
}

/**
 * Fetch raw weather data for a location
 * NO SCORING, NO INTERPRETATION - just data
 */
export async function getWeatherData(lat: number, lon: number): Promise<RawWeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo'

  try {
    // Fetch current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    )
    const currentData = await currentResponse.json()

    if (currentData.cod !== 200) {
      throw new Error('Weather API error: ' + currentData.message)
    }

    // Fetch 5-day forecast (every 3 hours)
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`
    )
    const forecastData = await forecastResponse.json()

    if (forecastData.cod !== '200') {
      throw new Error('Forecast API error: ' + forecastData.message)
    }

    // Process forecast into daily summaries (simpler for GPT-4)
    const dailyForecasts = processToDailyForecast(forecastData.list)

    return {
      current: {
        temperature: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        barometric_pressure: currentData.main.pressure,
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind?.speed || 0),
        wind_direction: degreesToCardinal(currentData.wind?.deg || 0),
        wind_degrees: currentData.wind?.deg || 0,
        conditions: currentData.weather[0]?.main || 'Unknown',
        description: currentData.weather[0]?.description || 'Unknown',
        visibility: currentData.visibility || 0,
        clouds: currentData.clouds?.all || 0
      },
      forecast: dailyForecasts,
      location: {
        name: currentData.name || 'Unknown',
        lat,
        lon
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
 * Process hourly forecast data into daily summaries
 * Takes 40 forecast points (every 3 hours for 5 days)
 * Returns 5 daily summaries (using midday data as representative)
 */
function processToDailyForecast(hourlyData: any[]): RawWeatherData['forecast'] {
  const dailyMap = new Map<string, any[]>()

  // Group by date
  hourlyData.forEach(item => {
    const date = new Date(item.dt * 1000).toISOString().split('T')[0]
    if (!dailyMap.has(date)) {
      dailyMap.set(date, [])
    }
    dailyMap.get(date)!.push(item)
  })

  // Create daily summaries
  const dailyForecasts: RawWeatherData['forecast'] = []

  dailyMap.forEach((hours, date) => {
    // Use midday data (around noon) as representative
    const middayIndex = Math.floor(hours.length / 2)
    const dayData = hours[middayIndex]

    // Find min/max temps for the day
    const temps = hours.map(h => h.main.temp)
    const temp_min = Math.round(Math.min(...temps))
    const temp_max = Math.round(Math.max(...temps))

    dailyForecasts.push({
      date,
      timestamp: dayData.dt,
      temperature: Math.round(dayData.main.temp),
      temp_min,
      temp_max,
      barometric_pressure: dayData.main.pressure,
      humidity: dayData.main.humidity,
      wind_speed: Math.round(dayData.wind?.speed || 0),
      wind_direction: degreesToCardinal(dayData.wind?.deg || 0),
      conditions: dayData.weather[0]?.main || 'Unknown',
      description: dayData.weather[0]?.description || 'Unknown',
      precipitation_chance: dayData.pop ? Math.round(dayData.pop * 100) : undefined
    })
  })

  return dailyForecasts.slice(0, 5) // Return 5 days
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
 */
export function formatWeatherForGPT(weather: RawWeatherData): string {
  const { current, forecast } = weather

  let summary = `CURRENT CONDITIONS (${weather.location.name}):\n`
  summary += `Temperature: ${current.temperature}°F (feels like ${current.feels_like}°F)\n`
  summary += `Barometric Pressure: ${current.barometric_pressure} mb\n`
  summary += `Wind: ${current.wind_speed} mph from ${current.wind_direction}\n`
  summary += `Humidity: ${current.humidity}%\n`
  summary += `Conditions: ${current.description}\n`
  summary += `Cloud Cover: ${current.clouds}%\n\n`

  summary += `5-DAY FORECAST:\n`
  forecast.forEach((day, i) => {
    summary += `Day ${i + 1} (${day.date}):\n`
    summary += `  Temp: ${day.temp_min}°F - ${day.temp_max}°F\n`
    summary += `  Pressure: ${day.barometric_pressure} mb\n`
    summary += `  Wind: ${day.wind_speed} mph ${day.wind_direction}\n`
    summary += `  Conditions: ${day.description}\n`
    if (day.precipitation_chance) {
      summary += `  Precipitation: ${day.precipitation_chance}%\n`
    }
    summary += `\n`
  })

  return summary
}
