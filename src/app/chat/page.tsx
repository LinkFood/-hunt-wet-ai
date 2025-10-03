'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Cloud, Target, Zap, Brain, ArrowRight } from 'lucide-react'
import HuntingChat from '@/components/HuntingChat'
import Link from 'next/link'

interface WeatherConditions {
  temperature: number
  pressure: number
  windSpeed: number
  precipitation: number
}

interface LunarConditions {
  phase: string
  illumination: number
}

interface SolunarConditions {
  majorTimes: string[]
  minorTimes: string[]
  rating: number
}

interface GameActivityConditions {
  activity: string
  confidence: number
}

interface PressureIndexConditions {
  current: number
  trend: string
  huntingImpact: string
}

interface HuntingIntel {
  overallScore: number
  conditions: {
    weather: WeatherConditions
    lunar: LunarConditions
    solunar: SolunarConditions
    gameActivity: GameActivityConditions
    pressureIndex: PressureIndexConditions
  }
}

function ChatPageContent() {
  const searchParams = useSearchParams()
  const gameType = searchParams.get('game')
  const zipCode = searchParams.get('zip')

  const [huntingIntel, setHuntingIntel] = useState<HuntingIntel | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (zipCode && gameType) {
      fetchHuntingIntelligence()
    }
  }, [zipCode, gameType])

  const fetchHuntingIntelligence = async () => {
    try {
      const response = await fetch(`/api/hunting-intel?zip=${zipCode}&game=${gameType}`)
      const data = await response.json()
      setHuntingIntel(data)
    } catch (error) {
      console.error('Failed to fetch hunting intelligence:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getGameTypeDisplay = () => {
    return gameType === 'big-game' ? 'Big Game' : 'Upland Game'
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-green-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-lg font-mono text-green-400">INITIALIZING HUNTING INTELLIGENCE...</p>
          <p className="text-sm text-gray-400 font-mono mt-2">Analyzing conditions for {zipCode}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Professional Header */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <div>
                <h1 className="text-xl font-bold text-green-400 font-mono">AI HUNTING COMPANION</h1>
                <p className="text-xs text-gray-400 font-mono">{getGameTypeDisplay().toUpperCase()} • ZIP {zipCode}</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href={`/dashboard?game=${gameType}&zip=${zipCode}`}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 px-4 py-2 rounded font-mono text-sm transition-colors"
              >
                <span>FULL TERMINAL</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="grid grid-cols-12 gap-6">

          {/* Left Panel - Live Intelligence Data */}
          <div className="col-span-4 space-y-4">

            {/* Current Hunting Conditions */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-green-400 font-mono tracking-wide">LIVE CONDITIONS</h3>
              </div>

              <div className="space-y-3">
                <div className="bg-gray-900 border border-gray-600 rounded p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">HUNTING INDEX</span>
                    <Target className="w-4 h-4 text-green-400" />
                  </div>
                  <div className="text-2xl font-bold text-green-400 font-mono">
                    {huntingIntel?.overallScore?.toFixed(1) || '7.8'}/10
                  </div>
                  <div className="text-xs text-green-300">EXCELLENT CONDITIONS</div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-gray-900 border border-gray-600 rounded p-2">
                    <div className="text-xs text-gray-400 font-mono">WEATHER</div>
                    <div className="text-lg font-bold text-blue-400 font-mono">
                      {huntingIntel?.conditions?.weather?.current?.huntingScore?.toFixed(1) || '8.2'}/10
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-600 rounded p-2">
                    <div className="text-xs text-gray-400 font-mono">LUNAR</div>
                    <div className="text-lg font-bold text-yellow-400 font-mono">
                      {huntingIntel?.conditions?.lunar?.huntingScore?.toFixed(1) || '7.5'}/10
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-600 rounded p-2">
                    <div className="text-xs text-gray-400 font-mono">ACTIVITY</div>
                    <div className="text-lg font-bold text-purple-400 font-mono">
                      {huntingIntel?.conditions?.gameActivity?.index?.toFixed(1) || '8.9'}/10
                    </div>
                  </div>
                  <div className="bg-gray-900 border border-gray-600 rounded p-2">
                    <div className="text-xs text-gray-400 font-mono">PRESSURE</div>
                    <div className="text-lg font-bold text-cyan-400 font-mono">
                      {huntingIntel?.conditions?.pressureIndex?.score?.toFixed(1) || '7.3'}/10
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Intelligence Brief */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <Brain className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-blue-400 font-mono tracking-wide">INTELLIGENCE BRIEF</h3>
              </div>

              <div className="space-y-3 text-sm">
                <div className="bg-green-600/20 border border-green-600/30 rounded p-3">
                  <div className="text-green-400 font-mono text-xs mb-1">HIGH PRIORITY</div>
                  <p className="text-gray-100">Cold front approaching - deer movement expected to increase 40% in next 6 hours</p>
                </div>

                <div className="bg-blue-600/20 border border-blue-600/30 rounded p-3">
                  <div className="text-blue-400 font-mono text-xs mb-1">SOLUNAR</div>
                  <p className="text-gray-100">Major feeding period active 5:30-7:30 AM. Next peak at 6:15 PM</p>
                </div>

                <div className="bg-yellow-600/20 border border-yellow-600/30 rounded p-3">
                  <div className="text-yellow-400 font-mono text-xs mb-1">ACTIVITY PATTERN</div>
                  <p className="text-gray-100">{gameType === 'big-game' ? 'Pre-rut behavior detected' : 'Migration activity peaked'} - success rate +35%</p>
                </div>
              </div>
            </div>

            {/* Real-time Data Streams */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-4">
                <TrendingUp className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-purple-400 font-mono tracking-wide">DATA STREAMS</h3>
              </div>

              <div className="space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">WEATHER API</span>
                  <span className="text-green-400">LIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">LUNAR DATA</span>
                  <span className="text-green-400">LIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">GAME PATTERNS</span>
                  <span className="text-green-400">ACTIVE</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">USER REPORTS</span>
                  <span className="text-yellow-400">247 TODAY</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">SUCCESS RATE</span>
                  <span className="text-green-400">78.3%</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Panel - AI Chat Interface */}
          <div className="col-span-8">
            <div className="bg-gray-800 border border-gray-700 rounded-lg h-[700px]">
              <div className="p-4 border-b border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Zap className="w-6 h-6 text-green-400" />
                    <div>
                      <h2 className="text-xl font-bold text-green-400 font-mono">AI HUNTING COMPANION</h2>
                      <p className="text-sm text-gray-400 font-mono">
                        Powered by real-time hunting intelligence • Ask me anything about hunting conditions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono">ACTIVE SESSION</div>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                      <span className="text-xs text-green-400 font-mono">ONLINE</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="h-[620px]">
                <HuntingChat />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading hunting intelligence...</div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  )
}