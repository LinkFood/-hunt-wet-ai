import { NextResponse } from 'next/server'
import { ApiManager } from '@/lib/api-config'

export async function GET() {
  try {
    const configStatus = ApiManager.getConfigurationStatus()
    const usageStats = ApiManager.getUsageStats()

    return NextResponse.json({
      success: true,
      configuration: configStatus,
      usage: usageStats,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('API status error:', error)
    return NextResponse.json(
      { error: 'Failed to get API status' },
      { status: 500 }
    )
  }
}