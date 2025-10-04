import { NextRequest, NextResponse } from 'next/server'
import { getWeatherData } from '@/lib/weather'

/**
 * Weather Info API - For Information Hub Display
 * Returns raw weather data formatted for dashboard display
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '0')
  const lon = parseFloat(searchParams.get('lon') || '0')

  if (!lat || !lon) {
    return NextResponse.json({
      success: false,
      error: 'Invalid coordinates'
    }, { status: 400 })
  }

  try {
    const weather = await getWeatherData(lat, lon)

    return NextResponse.json({
      success: true,
      weather
    })

  } catch (error) {
    console.error('Weather info API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch weather'
    }, { status: 500 })
  }
}
