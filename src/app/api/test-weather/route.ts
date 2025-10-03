import { NextRequest, NextResponse } from 'next/server'
import { getWeatherForHunting, findPrimeHuntingDays } from '@/lib/weather'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zipCode = searchParams.get('zip') || '12345'

  try {
    const weatherData = await getWeatherForHunting(zipCode)
    const primeHuntingDays = findPrimeHuntingDays(weatherData.forecast)

    return NextResponse.json({
      success: true,
      zipCode,
      weather: weatherData,
      primeHuntingDays,
      message: 'Weather intelligence working!'
    })

  } catch (error) {
    console.error('Weather test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Weather API test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}