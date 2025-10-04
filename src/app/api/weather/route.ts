import { NextRequest, NextResponse } from 'next/server'
import { getWeatherData } from '@/lib/weather'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const lat = parseFloat(searchParams.get('lat') || '')
    const lon = parseFloat(searchParams.get('lon') || '')

    if (isNaN(lat) || isNaN(lon)) {
      return NextResponse.json(
        { success: false, error: 'Valid lat/lon required' },
        { status: 400 }
      )
    }

    const weatherData = await getWeatherData(lat, lon)

    return NextResponse.json({
      success: true,
      data: weatherData
    })

  } catch (error) {
    console.error('Weather API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
