'use client'

import { useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import HuntingChat from '@/components/HuntingChat'
import LiveDataGrid from '@/components/LiveDataGrid'
import LiveTicker from '@/components/LiveTicker'
import HuntingCharts from '@/components/HuntingCharts'
import {
  Cloud, MapPin, Calendar, TrendingUp, AlertTriangle, ArrowLeft,
  Thermometer, Wind, Droplets, Compass, Clock, Activity,
  Target, Zap, Eye, RadioIcon, Satellite
} from 'lucide-react'
import Link from 'next/link'

interface PersonalizedNews {
  id: string
  title: string
  timestamp: Date
  category: 'weather' | 'activity' | 'season'
  gameSpecific: boolean
}

interface WeatherAlert {
  condition: string
  impact: string
  severity: 'high' | 'medium' | 'low'
}

function DashboardContent() {
  const searchParams = useSearchParams()
  const gameType = searchParams.get('game')
  const zipCode = searchParams.get('zip')

  const [news, setNews] = useState<PersonalizedNews[]>([])
  const [weatherAlert, setWeatherAlert] = useState<WeatherAlert | null>(null)

  useEffect(() => {
    // Log user dashboard visit for engine learning
    if (gameType && zipCode) {
      const visitData = {
        gameType,
        zipCode,
        timestamp: new Date().toISOString(),
        action: 'dashboard_visit'
      }

      // Store in localStorage for now (later: send to database)
      const existingData = JSON.parse(localStorage.getItem('huntWet_interactions') || '[]')
      existingData.push(visitData)
      localStorage.setItem('huntWet_interactions', JSON.stringify(existingData))
    }

    // Generate personalized news based on game type and location
    generatePersonalizedContent()
  }, [gameType, zipCode])

  const generatePersonalizedContent = () => {
    if (gameType === 'big-game') {
      setNews([
        {
          id: '1',
          title: `Deer activity up 35% in your area (${zipCode})`,
          timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
          category: 'activity',
          gameSpecific: true
        },
        {
          id: '2',
          title: 'Cold front moving through - prime big game conditions',
          timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
          category: 'weather',
          gameSpecific: true
        },
        {
          id: '3',
          title: 'Rut predictions show peak activity this weekend',
          timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
          category: 'season',
          gameSpecific: true
        }
      ])

      setWeatherAlert({
        condition: 'Barometric pressure dropping',
        impact: 'Deer movement expected to increase significantly',
        severity: 'high'
      })
    } else if (gameType === 'upland') {
      setNews([
        {
          id: '1',
          title: `Duck migration peaks in your region (${zipCode})`,
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          category: 'activity',
          gameSpecific: true
        },
        {
          id: '2',
          title: 'Light winds forecast - perfect for waterfowl',
          timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
          category: 'weather',
          gameSpecific: true
        },
        {
          id: '3',
          title: 'Pheasant reports show strong populations',
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
          category: 'season',
          gameSpecific: true
        }
      ])

      setWeatherAlert({
        condition: 'Stable weather pattern',
        impact: 'Consistent bird movement expected',
        severity: 'medium'
      })
    }
  }

  const getGameTypeDisplay = () => {
    return gameType === 'big-game' ? 'Big Game' : 'Upland Game'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 border-red-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      default: return 'text-green-600 bg-green-50 border-green-200'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'weather': return <Cloud className="w-4 h-4" />
      case 'activity': return <TrendingUp className="w-4 h-4" />
      case 'season': return <Calendar className="w-4 h-4" />
      default: return <AlertTriangle className="w-4 h-4" />
    }
  }

  const formatTimeAgo = (timestamp: Date) => {
    const hours = Math.floor((Date.now() - timestamp.getTime()) / (1000 * 60 * 60))
    return `${hours}h ago`
  }

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100">
      {/* Header - OnX Style */}
      <header className="bg-gray-800 border-b border-gray-700 shadow-xl">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <Link href="/" className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors">
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">HuntWet Terminal</span>
              </Link>
              <div className="w-px h-6 bg-gray-600"></div>
              <div className="flex items-center space-x-4">
                <div className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-semibold tracking-wide">
                  {getGameTypeDisplay().toUpperCase()}
                </div>
                <div className="flex items-center space-x-2 text-gray-300">
                  <MapPin className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-mono font-medium">ZIP {zipCode}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">LIVE</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400 font-mono">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6">

        {/* Critical Alert Bar */}
        {weatherAlert && (
          <div className={`mb-6 p-4 rounded-lg border-l-4 ${
            weatherAlert.severity === 'high'
              ? 'bg-red-900/30 border-red-500 text-red-100'
              : weatherAlert.severity === 'medium'
              ? 'bg-yellow-900/30 border-yellow-500 text-yellow-100'
              : 'bg-green-900/30 border-green-500 text-green-100'
          }`}>
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-semibold text-sm tracking-wide">
                  {weatherAlert.condition.toUpperCase()}
                </div>
                <div className="text-sm opacity-90 mt-1">{weatherAlert.impact}</div>
              </div>
              <div className="text-xs font-mono opacity-75">
                PRIORITY: {weatherAlert.severity.toUpperCase()}
              </div>
            </div>
          </div>
        )}

        {/* Live Intelligence Ticker */}
        <div className="mb-4">
          <LiveTicker gameType={gameType || 'big-game'} />
        </div>

        {/* Main Grid - Dense Professional Layout */}
        <div className="grid grid-cols-12 gap-4">

          {/* Left Panel - Live Data Feeds */}
          <div className="col-span-8 space-y-4">

            {/* Live Data Grid - Real-time hunting intelligence */}
            <LiveDataGrid zipCode={zipCode || '10001'} gameType={gameType || 'big-game'} />

            {/* Live Charts and Analytics */}
            <HuntingCharts zipCode={zipCode || '10001'} gameType={gameType || 'big-game'} />

            {/* Game-Specific Intelligence Feed */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-green-400 tracking-wide">
                  {getGameTypeDisplay().toUpperCase()} INTELLIGENCE FEED
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <span className="text-xs text-green-400 font-medium">STREAMING</span>
                </div>
              </div>
              <div className="divide-y divide-gray-700">
                {news.map((item) => (
                  <div key={item.id} className="px-4 py-3 hover:bg-gray-750 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          {getCategoryIcon(item.category)}
                          <span className="text-sm text-white font-medium">{item.title}</span>
                        </div>
                        <div className="flex items-center space-x-4 text-xs">
                          <span className="text-gray-400 font-mono">
                            {formatTimeAgo(item.timestamp)}
                          </span>
                          {item.gameSpecific && (
                            <span className="bg-green-600/20 text-green-400 px-2 py-0.5 rounded text-xs font-medium">
                              {getGameTypeDisplay().toUpperCase()}
                            </span>
                          )}
                          <span className="text-green-400 font-medium">VERIFIED</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Target className="w-4 h-4 text-green-400" />
                  <span className="text-xs text-gray-400 font-mono">SUCCESS</span>
                </div>
                <div className="text-2xl font-bold text-green-400 mb-1">
                  {gameType === 'big-game' ? '78.3' : '65.7'}%
                </div>
                <div className="text-xs text-gray-400">7-DAY AVERAGE</div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-gray-400 font-mono">REPORTS</span>
                </div>
                <div className="text-2xl font-bold text-blue-400 mb-1">
                  {gameType === 'big-game' ? '247' : '312'}
                </div>
                <div className="text-xs text-gray-400">LAST 24H</div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <span className="text-xs text-gray-400 font-mono">ACTIVITY</span>
                </div>
                <div className="text-2xl font-bold text-yellow-400 mb-1">
                  {gameType === 'big-game' ? '94' : '76'}%
                </div>
                <div className="text-xs text-gray-400">VS AVERAGE</div>
              </div>

              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <div className="flex items-center justify-between mb-2">
                  <Eye className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-gray-400 font-mono">OPTIMAL</span>
                </div>
                <div className="text-2xl font-bold text-purple-400 mb-1">
                  5:45
                </div>
                <div className="text-xs text-gray-400">AM WINDOW</div>
              </div>
            </div>
          </div>

          {/* Right Panel - Command Center */}
          <div className="col-span-4 space-y-4">

            {/* AI Terminal */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-green-400 tracking-wide">
                    AI HUNTING TERMINAL
                  </h3>
                  <p className="text-xs text-gray-400 mt-1">
                    {getGameTypeDisplay().toUpperCase()} • ZIP {zipCode}
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioIcon className="w-3 h-3 text-green-400" />
                  <span className="text-xs text-green-400 font-medium">ONLINE</span>
                </div>
              </div>
              <div className="h-[350px] bg-gray-900">
                <HuntingChat />
              </div>
            </div>

            {/* Mission Control */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="px-4 py-3 border-b border-gray-700">
                <h3 className="text-sm font-semibold text-green-400 tracking-wide">
                  MISSION CONTROL
                </h3>
              </div>
              <div className="p-4 space-y-4">

                {/* Next Optimal Window */}
                <div className="bg-gray-900 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">NEXT OPTIMAL</span>
                    <Satellite className="w-3 h-3 text-green-400" />
                  </div>
                  <div className="text-lg font-bold text-green-400">05:45 - 07:30</div>
                  <div className="text-xs text-gray-400">TOMORROW MORNING</div>
                </div>

                {/* Weather Trend */}
                <div className="bg-gray-900 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">PRESSURE TREND</span>
                    <TrendingUp className="w-3 h-3 text-blue-400" />
                  </div>
                  <div className="text-lg font-bold text-blue-400">↗ RISING</div>
                  <div className="text-xs text-gray-400">+2.3 MB/HR</div>
                </div>

                {/* Moon Phase */}
                <div className="bg-gray-900 rounded-md p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-400 font-mono">LUNAR PHASE</span>
                    <Calendar className="w-3 h-3 text-purple-400" />
                  </div>
                  <div className="text-lg font-bold text-purple-400">WANING</div>
                  <div className="text-xs text-gray-400">62% ILLUMINATION</div>
                </div>
              </div>
            </div>

            {/* Pro Upgrade - Terminal Style */}
            <div className="bg-gradient-to-r from-green-800 to-green-600 rounded-lg border border-green-500/50">
              <div className="px-4 py-3 border-b border-green-500/30">
                <h3 className="text-sm font-semibold text-green-100 tracking-wide">
                  UPGRADE TO PRO TERMINAL
                </h3>
              </div>
              <div className="p-4">
                <div className="mb-3">
                  <div className="text-sm text-green-100 mb-2">
                    Unlock advanced hunting intelligence:
                  </div>
                  <ul className="text-xs text-green-200 space-y-1">
                    <li>• Proactive hunt alerts</li>
                    <li>• Advanced weather modeling</li>
                    <li>• Predictive game movement</li>
                    <li>• Personal success analytics</li>
                  </ul>
                </div>
                <button className="w-full bg-white text-green-700 py-2.5 px-4 rounded-md font-semibold text-sm hover:bg-gray-100 transition-colors">
                  ACTIVATE PRO
                </button>
                <div className="text-center text-xs text-green-300 mt-2 font-mono">
                  YOUR DIGITAL HUNTING DOG
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  )
}

export default function Dashboard() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-green-400 font-mono">Loading dashboard...</div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  )
}