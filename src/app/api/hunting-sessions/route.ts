import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('hunting_sessions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error
      })
    }

    return NextResponse.json({
      success: true,
      sessions: data,
      count: data?.length || 0
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch hunting sessions',
      details: error instanceof Error ? error.message : String(error)
    })
  }
}