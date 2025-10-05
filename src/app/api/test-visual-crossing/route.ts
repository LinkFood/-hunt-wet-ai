import { NextRequest, NextResponse } from 'next/server'
import {
  getHistoricalWeather,
  getForecastWeather,
  getPressureTrend
} from '@/lib/weather-visual-crossing'

/**
 * Test Visual Crossing Weather API
 *
 * Test historical:
 * GET /api/test-visual-crossing?type=historical&lat=39.4&lon=-76.6&date=2024-10-15&time=06:30:00
 *
 * Test forecast:
 * GET /api/test-visual-crossing?type=forecast&lat=39.4&lon=-76.6&days=7
 *
 * Test pressure trend:
 * GET /api/test-visual-crossing?type=pressure&lat=39.4&lon=-76.6&date=2024-10-15&time=06:30:00
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'forecast'
    const lat = parseFloat(searchParams.get('lat') || '39.4')
    const lon = parseFloat(searchParams.get('lon') || '-76.6')
    const date = searchParams.get('date') || '2024-10-15'
    const time = searchParams.get('time') || '12:00:00'
    const days = parseInt(searchParams.get('days') || '7')

    if (type === 'historical') {
      console.log(`Testing historical weather: ${date} ${time} at ${lat},${lon}`)
      const weather = await getHistoricalWeather(lat, lon, date, time)

      return NextResponse.json({
        success: true,
        type: 'historical',
        params: { lat, lon, date, time },
        data: weather
      })
    }

    if (type === 'forecast') {
      console.log(`Testing forecast weather: ${days} days at ${lat},${lon}`)
      const forecast = await getForecastWeather(lat, lon, days)

      return NextResponse.json({
        success: true,
        type: 'forecast',
        params: { lat, lon, days },
        data: forecast,
        summary: {
          days_returned: forecast.length,
          first_day: forecast[0]?.date,
          last_day: forecast[forecast.length - 1]?.date
        }
      })
    }

    if (type === 'pressure') {
      console.log(`Testing pressure trend: ${date} ${time} at ${lat},${lon}`)
      const pressureTrend = await getPressureTrend(lat, lon, date, time)

      return NextResponse.json({
        success: true,
        type: 'pressure',
        params: { lat, lon, date, time },
        data: pressureTrend,
        interpretation: interpretPressureTrend(pressureTrend)
      })
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid type parameter. Use: historical, forecast, or pressure'
    }, { status: 400 })

  } catch (error) {
    console.error('Visual Crossing test error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

function interpretPressureTrend(trend: any): string {
  if (trend.direction === 'falling') {
    return `📉 FALLING PRESSURE (${trend.trend_3hr.toFixed(1)}mb over 3hrs) - PRIME HUNTING! Animals feed heavily before storms.`
  }
  if (trend.direction === 'rising') {
    return `📈 RISING PRESSURE (${trend.trend_3hr.toFixed(1)}mb over 3hrs) - Activity may decrease, but pre-front movement can be good.`
  }
  return `➡️ STEADY PRESSURE (${trend.trend_3hr.toFixed(1)}mb change) - Normal activity patterns expected.`
}
