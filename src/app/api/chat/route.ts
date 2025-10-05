import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@supabase/supabase-js'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// AI-powered hunting chat with hunt log analysis
export async function POST(request: NextRequest) {
  try {
    const { message, user_id } = await request.json()

    if (!message) {
      return NextResponse.json(
        { success: false, error: 'message required' },
        { status: 400 }
      )
    }

    const userId = user_id || 'james'

    // Get user's hunt history
    const { data: hunts, error: huntError } = await supabase
      .from('hunt_logs')
      .select('*')
      .eq('user_id', userId)
      .order('hunt_date', { ascending: false })
      .limit(100)

    if (huntError) {
      console.error('Error fetching hunts:', huntError)
    }

    // Build hunt context
    let huntContext = ''
    if (hunts && hunts.length > 0) {
      huntContext = `\nUSER'S HUNT HISTORY (${hunts.length} hunts logged):\n${JSON.stringify(hunts, null, 2)}`
    } else {
      huntContext = '\nThe user has not logged any hunts yet.'
    }

    // Call GPT-4o with hunt context
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are Hunt Wet AI, a hunting intelligence assistant that analyzes hunt patterns and environmental data.

You have access to the user's complete hunt history with 40+ data points per hunt:
- Date, time, location
- Weather (temp, pressure, wind, humidity, dew point)
- Pressure trends (rising/falling/steady)
- Moon phase and illumination
- Hunt outcomes (success/failure)
- Species hunted
- Notes

${huntContext}

When answering questions:
1. Search through the hunt logs for relevant patterns
2. Be SPECIFIC with dates, conditions, and data
3. Calculate success rates when relevant
4. Identify patterns (e.g., "falling pressure = 89% success")
5. Cite exact hunts as examples

Answer questions like:
- "When was the last time pressure was falling?"
- "Show me successful hunts with falling pressure"
- "What temperature range works best for me?"
- "What conditions match my best hunts?"

Be data-driven, specific, and actionable. Like a smart hunting buddy who remembers everything.`
        },
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      success: true,
      message: response,
      hunts_analyzed: hunts?.length || 0
    })

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
