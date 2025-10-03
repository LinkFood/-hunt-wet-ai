import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * Hunt Outcome Logging API
 *
 * Allows hunters to log whether the AI's advice resulted in hunting success.
 * This data is crucial for the AI to learn what advice actually works.
 *
 * Expected data:
 * - sessionId: ID of the hunting session that gave the advice
 * - outcome: "success" | "failure" | "partial"
 * - details: What actually happened
 * - gameType: What was hunted
 * - conditions: Actual conditions during hunt
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      sessionId,
      outcome,
      details,
      gameType,
      actualConditions,
      huntDate,
      zipCode
    } = body

    // Validate required fields
    if (!sessionId || !outcome) {
      return NextResponse.json(
        { error: 'Session ID and outcome are required' },
        { status: 400 }
      )
    }

    // Validate outcome value
    if (!['success', 'failure', 'partial'].includes(outcome)) {
      return NextResponse.json(
        { error: 'Outcome must be: success, failure, or partial' },
        { status: 400 }
      )
    }

    // Update the hunting session with outcome data
    const { data, error } = await supabase
      .from('hunting_sessions')
      .update({
        hunt_outcome: outcome,
        outcome_details: {
          details: details || '',
          gameType: gameType || null,
          actualConditions: actualConditions || null,
          huntDate: huntDate || null,
          loggedAt: new Date().toISOString()
        }
      })
      .eq('id', sessionId)
      .select()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to log outcome', details: error.message },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Outcome logged successfully',
      sessionId,
      outcome,
      details: data[0]
    })

  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}

// GET endpoint to retrieve outcome statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const zipCode = searchParams.get('zip')
    const gameType = searchParams.get('game')

    let query = supabase
      .from('hunting_sessions')
      .select('hunt_outcome, outcome_details, weather_data, moon_phase_data, zip_code, game_type, created_at')
      .not('hunt_outcome', 'is', null)

    // Filter by ZIP code if provided
    if (zipCode) {
      query = query.eq('zip_code', zipCode)
    }

    // Filter by game type if provided
    if (gameType) {
      query = query.eq('game_type', gameType)
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(100)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch outcomes', details: error.message },
        { status: 500 }
      )
    }

    // Calculate success statistics
    const total = data.length
    const successful = data.filter(session => session.hunt_outcome === 'success').length
    const failed = data.filter(session => session.hunt_outcome === 'failure').length
    const partial = data.filter(session => session.hunt_outcome === 'partial').length

    const successRate = total > 0 ? Math.round((successful / total) * 100) : 0

    return NextResponse.json({
      success: true,
      stats: {
        total,
        successful,
        failed,
        partial,
        successRate: `${successRate}%`
      },
      recentOutcomes: data.slice(0, 10) // Return 10 most recent
    })

  } catch (error) {
    console.error('GET error:', error)
    return NextResponse.json(
      { error: 'Failed to retrieve outcome data' },
      { status: 500 }
    )
  }
}