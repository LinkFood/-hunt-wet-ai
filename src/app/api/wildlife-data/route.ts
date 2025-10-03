import { NextRequest, NextResponse } from 'next/server'
import { getGameActivityData } from '@/lib/wildlife-data'
import { getLocationFromZip } from '@/lib/geocoding'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zip')
    const gameType = searchParams.get('game') as 'big-game' | 'upland' | 'waterfowl'

    if (!zipCode) {
      return NextResponse.json({ error: 'ZIP code required' }, { status: 400 })
    }

    if (!gameType) {
      return NextResponse.json({ error: 'Game type required' }, { status: 400 })
    }

    // Get location data for ZIP
    const locationData = await getLocationFromZip(zipCode)
    if (!locationData) {
      return NextResponse.json({ error: 'Invalid ZIP code' }, { status: 400 })
    }

    // Get comprehensive wildlife data
    const wildlifeData = await getGameActivityData(
      zipCode,
      gameType,
      locationData.lat,
      locationData.lon
    )

    return NextResponse.json({
      success: true,
      data: wildlifeData,
      location: {
        city: locationData.city,
        state: locationData.state,
        zipCode: zipCode
      }
    })

  } catch (error) {
    console.error('Wildlife data API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch wildlife data' },
      { status: 500 }
    )
  }
}