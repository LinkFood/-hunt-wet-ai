import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    // Test basic connection
    const { error } = await supabase.from('hunting_sessions').select('count')
    
    if (error) {
      return NextResponse.json({ 
        success: false, 
        error: error.message,
        details: error 
      })
    }

    // Test insert
    const { data: insertData, error: insertError } = await supabase
      .from('hunting_sessions')
      .insert({
        zip_code: 'test',
        user_message: 'Database connection test',
        ai_response: 'Test successful!'
      })
      .select()

    if (insertError) {
      return NextResponse.json({ 
        success: false, 
        error: 'Insert failed', 
        details: insertError 
      })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Database connection working!',
      data: insertData 
    })

  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: 'Connection failed', 
      details: error instanceof Error ? error.message : String(error) 
    })
  }
}