// Weather intelligence for hunting predictions
interface WeatherData {
  current: {
    temp: number
    feels_like: number
    pressure: number
    humidity: number
    wind_speed: number
    wind_deg: number
    weather: Array<{
      main: string
      description: string
    }>
  }
  forecast: Array<{
    dt: number
    temp: {
      day: number
      min: number
      max: number
    }
    pressure: number
    humidity: number
    wind_speed: number
    wind_deg: number
    weather: Array<{
      main: string
      description: string
    }>
  }>
}

export interface HuntingWeatherConditions {
  current: {
    temperature: number
    barometricPressure: number
    windSpeed: number
    windDirection: string
    humidity: number
    conditions: string
    huntingScore: number // 1-10 scale
    recommendation: string
  }
  forecast: Array<{
    date: string
    huntingScore: number
    recommendation: string
    keyFactors: string[]
    temperature: number
    pressure: number
    windSpeed: number
  }>
}

export async function getWeatherForHunting(zipCode: string): Promise<HuntingWeatherConditions> {
  const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo'

  try {
    // Get coordinates from zip code first
    const geoResponse = await fetch(
      `http://api.openweathermap.org/geo/1.0/zip?zip=${zipCode},US&appid=${API_KEY}`
    )
    const geoData = await geoResponse.json()

    console.log('Geo API response:', geoData)

    if (!geoData.lat || !geoData.lon) {
      throw new Error('Invalid ZIP code: ' + JSON.stringify(geoData))
    }

    // Get current weather and 5-day forecast (free tier)
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${API_KEY}`
    )
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${geoData.lat}&lon=${geoData.lon}&units=imperial&appid=${API_KEY}`
    )

    const currentData = await currentResponse.json()
    const forecastData = await forecastResponse.json()

    if (currentData.cod !== 200 || forecastData.cod !== '200') {
      throw new Error('Weather API error: ' + (currentData.message || forecastData.message))
    }

    // Analyze current conditions for hunting
    const currentHuntingScore = calculateHuntingScore(currentData)
    const currentRecommendation = generateHuntingRecommendation(currentData, currentHuntingScore)

    // Process 5-day forecast (every 3 hours) - get daily summaries
    const dailyForecasts = processHourlyToDailyForecast(forecastData.list)
    const forecastAnalysis = dailyForecasts.map((day) => {
      const huntingScore = calculateHuntingScore(day)
      const date = new Date(day.dt * 1000).toLocaleDateString()

      return {
        date,
        huntingScore,
        recommendation: generateHuntingRecommendation(day, huntingScore),
        keyFactors: getKeyHuntingFactors(day),
        temperature: Math.round(day.temp),
        pressure: day.main?.pressure || day.pressure,
        windSpeed: Math.round(day.wind?.speed || day.wind_speed)
      }
    })

    return {
      current: {
        temperature: Math.round(currentData.main.temp),
        barometricPressure: currentData.main.pressure,
        windSpeed: Math.round(currentData.wind?.speed || 0),
        windDirection: getWindDirection(currentData.wind?.deg || 0),
        humidity: currentData.main.humidity,
        conditions: currentData.weather[0]?.description || 'Unknown',
        huntingScore: currentHuntingScore,
        recommendation: currentRecommendation
      },
      forecast: forecastAnalysis
    }

  } catch (error) {
    console.error('Weather API error:', error)
    throw new Error('Failed to get weather data')
  }
}

// Process hourly forecast data into daily summaries
function processHourlyToDailyForecast(hourlyData: any[]): any[] {
  const dailyData: any[] = []
  const grouped = new Map()

  // Group by date
  hourlyData.forEach(item => {
    const date = new Date(item.dt * 1000).toDateString()
    if (!grouped.has(date)) {
      grouped.set(date, [])
    }
    grouped.get(date).push(item)
  })

  // Create daily summaries
  grouped.forEach((hours, date) => {
    const dayData = hours[Math.floor(hours.length / 2)] // Use midday data as representative
    dailyData.push({
      dt: dayData.dt,
      temp: dayData.main.temp,
      pressure: dayData.main.pressure,
      wind_speed: dayData.wind?.speed || 0,
      wind_deg: dayData.wind?.deg || 0,
      weather: dayData.weather,
      main: dayData.main,
      wind: dayData.wind
    })
  })

  return dailyData.slice(0, 5) // Return 5 days
}

function calculateHuntingScore(weather: any): number {
  let score = 5 // Base score

  // Get pressure from the right location
  const pressure = weather.main?.pressure || weather.pressure
  const temp = weather.main?.temp || weather.temp
  const windSpeed = weather.wind?.speed || weather.wind_speed || 0

  // Barometric pressure (most important factor)
  if (pressure > 1020) score += 2 // High pressure = good
  if (pressure < 1000) score += 1 // Low pressure = movement
  if (pressure >= 1000 && pressure <= 1020) score += 0 // Neutral

  // Temperature (depends on season, but cooler is generally better)
  if (temp < 45) score += 1
  if (temp > 75) score -= 1

  // Wind conditions
  if (windSpeed >= 5 && windSpeed <= 15) score += 1 // Light wind good
  if (windSpeed > 20) score -= 2 // Too windy

  // Weather conditions
  const condition = weather.weather?.[0]?.main?.toLowerCase()
  if (condition?.includes('clear')) score += 1
  if (condition?.includes('rain') || condition?.includes('storm')) score -= 1
  if (condition?.includes('cloud')) score += 0.5 // Overcast can be good

  return Math.max(1, Math.min(10, score))
}

function generateHuntingRecommendation(weather: any, score: number): string {
  if (score >= 8) return "Excellent hunting conditions - get out there!"
  if (score >= 6) return "Good hunting weather - favorable conditions"
  if (score >= 4) return "Fair conditions - could see some movement"
  return "Poor conditions - consider waiting for better weather"
}

function getKeyHuntingFactors(weather: any): string[] {
  const factors: string[] = []

  if (weather.pressure > 1020) factors.push("High pressure - stable conditions")
  if (weather.pressure < 1000) factors.push("Low pressure - increased movement")
  if (weather.wind_speed > 20) factors.push("High winds - challenging conditions")
  if (weather.wind_speed < 5) factors.push("Calm winds - ideal for still hunting")
  if (weather.temp < 45) factors.push("Cold temps - increased daytime activity")

  const condition = weather.weather?.[0]?.main?.toLowerCase()
  if (condition?.includes('rain')) factors.push("Precipitation - animals seek shelter")
  if (condition?.includes('clear')) factors.push("Clear skies - good visibility")

  return factors
}

function getWindDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}

// Function to identify prime hunting days in the next week
export function findPrimeHuntingDays(forecast: HuntingWeatherConditions['forecast']): string[] {
  return forecast
    .filter(day => day.huntingScore >= 7)
    .map(day => `${day.date}: ${day.recommendation} (Score: ${day.huntingScore}/10)`)
}