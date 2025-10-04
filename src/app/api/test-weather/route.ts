import { NextRequest, NextResponse } from 'next/server'
import { getWeatherByZip, formatWeatherForGPT } from '@/lib/weather'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const zipCode = searchParams.get('zip') || '12345'

  try {
    const weatherData = await getWeatherByZip(zipCode)
    const formatted = formatWeatherForGPT(weatherData)

    return NextResponse.json({
      success: true,
      zipCode,
      rawData: weatherData,
      formattedForGPT: formatted,
      message: 'Weather data fetcher working! (GPT does the reasoning)'
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