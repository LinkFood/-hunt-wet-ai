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
 * Fetch raw weather data using FREE OpenWeather APIs
 * Combines: Current Weather API + 5-Day Forecast API
 */
export async function getWeatherData(lat: number, lon: number): Promise<RawWeatherData> {
  const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo'

  try {
    // Call both FREE APIs in parallel
    const [currentResponse, forecastResponse] = await Promise.all([
      fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`),
      fetch(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&units=imperial&appid=${API_KEY}`)
    ])

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    if (currentData.cod && currentData.cod !== 200) {
      throw new Error('Weather API error: ' + currentData.message)
    }

    if (forecastData.cod && forecastData.cod !== '200') {
      throw new Error('Forecast API error: ' + forecastData.message)
    }

    // Process 3-hour forecast data into hourly approximation (40 data points = 5 days)
    const hourlyData = (forecastData.list || []).slice(0, 16).map((item: any) => ({
      timestamp: item.dt,
      temperature: Math.round(item.main.temp),
      feels_like: Math.round(item.main.feels_like),
      barometric_pressure: item.main.pressure,
      humidity: item.main.humidity,
      wind_speed: Math.round(item.wind.speed),
      wind_direction: degreesToCardinal(item.wind.deg || 0),
      conditions: item.weather[0]?.main || 'Unknown',
      description: item.weather[0]?.description || 'Unknown',
      precipitation_chance: item.pop ? Math.round(item.pop * 100) : 0,
      precipitation_amount: item.rain?.['3h'] ? item.rain['3h'] / 25.4 : undefined // mm to inches
    }))

    // Group forecast into daily data (5 days)
    const dailyMap = new Map<string, any[]>()
    forecastData.list.forEach((item: any) => {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0]
      if (!dailyMap.has(date)) {
        dailyMap.set(date, [])
      }
      dailyMap.get(date)!.push(item)
    })

    const dailyData = Array.from(dailyMap.entries()).slice(0, 7).map(([date, items]) => {
      const temps = items.map((i: any) => i.main.temp)
      const tempMin = Math.min(...temps)
      const tempMax = Math.max(...temps)

      // Get morning, day, evening, night temps (approximate by time of day)
      const morningItem = items.find((i: any) => new Date(i.dt * 1000).getHours() >= 6 && new Date(i.dt * 1000).getHours() < 12) || items[0]
      const dayItem = items.find((i: any) => new Date(i.dt * 1000).getHours() >= 12 && new Date(i.dt * 1000).getHours() < 18) || items[0]
      const eveningItem = items.find((i: any) => new Date(i.dt * 1000).getHours() >= 18 && new Date(i.dt * 1000).getHours() < 24) || items[0]
      const nightItem = items.find((i: any) => new Date(i.dt * 1000).getHours() >= 0 && new Date(i.dt * 1000).getHours() < 6) || items[0]

      const firstItem = items[0]

      return {
        date,
        timestamp: firstItem.dt,
        temp_min: Math.round(tempMin),
        temp_max: Math.round(tempMax),
        temp_morning: Math.round(morningItem.main.temp),
        temp_day: Math.round(dayItem.main.temp),
        temp_evening: Math.round(eveningItem.main.temp),
        temp_night: Math.round(nightItem.main.temp),
        barometric_pressure: firstItem.main.pressure,
        humidity: firstItem.main.humidity,
        wind_speed: Math.round(firstItem.wind.speed),
        wind_direction: degreesToCardinal(firstItem.wind.deg || 0),
        wind_gust: firstItem.wind.gust ? Math.round(firstItem.wind.gust) : undefined,
        conditions: firstItem.weather[0]?.main || 'Unknown',
        description: firstItem.weather[0]?.description || 'Unknown',
        precipitation_chance: Math.round(Math.max(...items.map((i: any) => i.pop || 0)) * 100),
        precipitation_amount: items.reduce((sum: number, i: any) => sum + (i.rain?.['3h'] || 0), 0) / 25.4,
        uvi: 0, // Not available in free API
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset
      }
    })

    // Get location name from current weather data
    const locationName = currentData.name || 'Unknown'

    return {
      current: {
        temperature: Math.round(currentData.main.temp),
        feels_like: Math.round(currentData.main.feels_like),
        barometric_pressure: currentData.main.pressure,
        humidity: currentData.main.humidity,
        wind_speed: Math.round(currentData.wind.speed),
        wind_direction: degreesToCardinal(currentData.wind.deg || 0),
        wind_degrees: currentData.wind.deg || 0,
        wind_gust: currentData.wind.gust ? Math.round(currentData.wind.gust) : undefined,
        conditions: currentData.weather[0]?.main || 'Unknown',
        description: currentData.weather[0]?.description || 'Unknown',
        visibility: currentData.visibility || 0,
        clouds: currentData.clouds?.all || 0,
        uvi: 0, // Not available in free API
        dew_point: Math.round(currentData.main.temp - ((100 - currentData.main.humidity) / 5)), // Approximation
        sunrise: currentData.sys.sunrise,
        sunset: currentData.sys.sunset
      },
      hourly: hourlyData,
      daily: dailyData,
      location: {
        name: locationName,
        lat,
        lon,
        timezone: currentData.timezone ? `UTC${currentData.timezone >= 0 ? '+' : ''}${currentData.timezone / 3600}` : 'UTC'
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
