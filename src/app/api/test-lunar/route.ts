import { NextRequest, NextResponse } from 'next/server'
import { getSolunarDataForHunting, findOptimalHuntingDates } from '@/lib/lunar'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const lat = parseFloat(searchParams.get('lat') || '40.7484')
  const lon = parseFloat(searchParams.get('lon') || '-73.9967')

  try {
    const today = new Date()
    const solunarData = await getSolunarDataForHunting(today, lat, lon)
    const optimalDates = await findOptimalHuntingDates(lat, lon)

    return NextResponse.json({
      success: true,
      location: { lat, lon },
      solunarData,
      optimalDates,
      message: 'Lunar intelligence working!'
    })

  } catch (error) {
    console.error('Lunar test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Lunar API test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}