import { NextRequest, NextResponse } from 'next/server'
import { getHuntingAdvice } from '@/lib/openai'
import { HuntWetLLMClient } from '@/lib/hunt-wet-llm-client'

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

    // Use YOUR Hunt Wet LLM if available, fallback to OpenAI
    const useCustomLLM = process.env.USE_HUNT_WET_LLM === 'true'

    let result
    if (useCustomLLM) {
      console.log('🦌 Using Hunt Wet LLM (YOUR proprietary model)')
      const huntWetLLM = new HuntWetLLMClient()

      const advice = await huntWetLLM.getHuntingAdvice(
        userMessage,
        zipCode,
        gameType,
        weather
      )

      result = {
        advice,
        sessionId: `hunt-wet-${Date.now()}`,
        source: 'Hunt Wet LLM v1.0'
      }
    } else {
      console.log('🤖 Using OpenAI (fallback)')
      result = await getHuntingAdvice({
        userMessage,
        zipCode,
        gameType,
        huntDate,
        weather,
        moonPhase
      })
    }

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