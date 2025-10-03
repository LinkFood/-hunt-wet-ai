import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { password } = await request.json()

    // Get the correct password from environment variable
    const correctPassword = process.env.HUNT_WET_PASSWORD || 'huntseason2024'

    if (password === correctPassword) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
    }
  } catch (error) {
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}