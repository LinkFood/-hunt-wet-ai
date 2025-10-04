import { NextRequest, NextResponse } from 'next/server'
import { getHuntingAdvice } from '@/lib/openai'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userMessage, zipCode, gameType, huntDate, weather, moonPhase } = body

    if (!userMessage) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    // Get hunting advice from OpenAI + Supabase learning system
    const result = await getHuntingAdvice({
      userMessage,
      zipCode,
      gameType,
      huntDate,
      weather,
      moonPhase
    })

    return NextResponse.json({
      advice: result.advice,
      sessionId: result.sessionId
    })

  } catch (error) {
    console.error('API error details:', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    )
  }
}