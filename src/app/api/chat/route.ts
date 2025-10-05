import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { getWeatherData, formatWeatherForGPT } from '@/lib/weather'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
})

// AI-powered hunting chat
export async function POST(request: NextRequest) {
  try {
    const { location, gameType, messages, userMessage } = await request.json()

    if (!location?.lat || !location?.lon) {
      return NextResponse.json(
        { success: false, error: 'Location required' },
        { status: 400 }
      )
    }

    // Get fresh weather data
    const weatherData = await getWeatherData(location.lat, location.lon)
    const weatherSummary = formatWeatherForGPT(weatherData)

    // Build conversation history
    const chatMessages: any[] = [
      {
        role: 'system',
        content: `You are Hunt Wet AI, an expert hunting companion with deep knowledge of hunting tactics, game behavior, weather impacts, and local hunting conditions.

CONTEXT:
- Location: ${location.displayName}
- Game Type: ${gameType}
- Current Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}

WEATHER DATA:
${weatherSummary}

YOUR ROLE:
- Answer questions about hunting conditions, tactics, timing, and game behavior
- Reference current weather when relevant
- Be specific and actionable
- Share hunting knowledge and best practices
- Suggest optimal hunting times based on conditions

TONE:
- Conversational and friendly
- Confident and knowledgeable
- Specific, not generic
- Like talking to an experienced hunting buddy

Keep responses concise (2-4 paragraphs) unless asked for more detail.`
      }
    ]

    // Add conversation history
    if (messages && messages.length > 0) {
      messages.forEach((msg: any) => {
        chatMessages.push({
          role: msg.role,
          content: msg.content
        })
      })
    }

    // Generate response
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: chatMessages,
      temperature: 0.8,
      max_tokens: 500
    })

    const response = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.'

    return NextResponse.json({
      success: true,
      response
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
