import { NextRequest, NextResponse } from 'next/server'
import { getHuntingSocialIntel, getCityFromZip, getCountyFromZip } from '@/lib/social-hunting-intel'

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

    // Get location context
    const cityName = getCityFromZip(zipCode)
    const countyName = getCountyFromZip(zipCode)

    // Get social hunting intelligence
    const socialIntel = await getHuntingSocialIntel(
      zipCode,
      gameType,
      cityName,
      countyName
    )

    return NextResponse.json({
      success: true,
      data: socialIntel,
      location: {
        zipCode,
        city: cityName,
        county: countyName
      },
      apiInfo: {
        googleSearchEnabled: !!process.env.GOOGLE_API_KEY,
        aiAnalysisEnabled: !!process.env.OPENAI_API_KEY
      }
    })

  } catch (error) {
    console.error('Social intel API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch social hunting intelligence' },
      { status: 500 }
    )
  }
}