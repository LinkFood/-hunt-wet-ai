import { NextRequest, NextResponse } from 'next/server'
import { logHunt, HuntLogInput } from '@/lib/hunt-logger'

/**
 * Log Hunt API
 *
 * POST /api/log-hunt
 * Body: {
 *   user_id: "user-uuid",
 *   hunt_date: "2024-10-15",
 *   hunt_time: "06:30:00",
 *   location_name: "Towson, MD",
 *   latitude: 39.4,
 *   longitude: -76.6,
 *   species: "deer",
 *   outcome: "success",
 *   animals_seen: 3,
 *   animals_killed: 1,
 *   user_notes: "Perfect morning, saw 3 does",
 *   season: "archery",
 *   hunting_method: "stand"
 * }
 *
 * Returns complete hunt log with 40+ environmental data points
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate required fields
    const required = ['user_id', 'hunt_date', 'hunt_time', 'location_name', 'latitude', 'longitude', 'species', 'outcome']
    const missing = required.filter(field => !body[field])

    if (missing.length > 0) {
      return NextResponse.json({
        success: false,
        error: `Missing required fields: ${missing.join(', ')}`
      }, { status: 400 })
    }

    // Validate outcome
    if (!['success', 'failure', 'scouting'].includes(body.outcome)) {
      return NextResponse.json({
        success: false,
        error: 'Outcome must be: success, failure, or scouting'
      }, { status: 400 })
    }

    // Validate coordinates
    if (body.latitude < -90 || body.latitude > 90 || body.longitude < -180 || body.longitude > 180) {
      return NextResponse.json({
        success: false,
        error: 'Invalid latitude/longitude'
      }, { status: 400 })
    }

    // Log the hunt with complete environmental snapshot
    const result = await logHunt(body as HuntLogInput)

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      hunt_id: result.hunt_id,
      data: result.data,
      message: '✅ Hunt logged successfully with complete environmental snapshot'
    })

  } catch (error) {
    console.error('Log hunt API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

/**
 * Get user's hunt history
 *
 * GET /api/log-hunt?user_id=xxx&species=deer&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('user_id')
    const species = searchParams.get('species') || undefined
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'user_id required'
      }, { status: 400 })
    }

    // Import here to avoid circular dependency
    const { getUserHunts, getUserStats } = await import('@/lib/hunt-logger')

    const hunts = await getUserHunts(userId, species, limit)
    const stats = await getUserStats(userId, species)

    return NextResponse.json({
      success: true,
      stats,
      hunts,
      count: hunts.length
    })

  } catch (error) {
    console.error('Get hunts API error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
