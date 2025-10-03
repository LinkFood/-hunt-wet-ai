'use client'

import { useState, useEffect, useRef } from 'react'
import { AlertTriangle, TrendingUp, Cloud, Target, Activity, Zap } from 'lucide-react'

interface TickerItem {
  id: string
  timestamp: string
  region: string
  type: 'WEATHER_ALERT' | 'REGIONAL_UPDATE' | 'SOLUNAR_UPDATE' | 'MIGRATION_UPDATE' | 'SUCCESS_REPORT' | 'TACTICAL_UPDATE'
  message: string
  data: any
}

export default function LiveTicker({ gameType }: { gameType: string }) {
  const [tickerItems, setTickerItems] = useState<TickerItem[]>([])
  const [isPaused, setIsPaused] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetchTickerData()
    const interval = setInterval(fetchTickerData, 15000) // Update every 15 seconds

    return () => clearInterval(interval)
  }, [gameType])

  const fetchTickerData = async () => {
    try {
      const response = await fetch(`/api/live-feed?region=national&game=${gameType}`)
      const data = await response.json()

      if (data.feeds) {
        setTickerItems(data.feeds.slice(0, 10)) // Show latest 10 items
      }
    } catch (error) {
      console.error('Error fetching ticker data:', error)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'WEATHER_ALERT': return <Cloud className="w-4 h-4 text-blue-400" />
      case 'REGIONAL_UPDATE': return <TrendingUp className="w-4 h-4 text-green-400" />
      case 'SOLUNAR_UPDATE': return <Activity className="w-4 h-4 text-yellow-400" />
      case 'MIGRATION_UPDATE': return <Target className="w-4 h-4 text-purple-400" />
      case 'SUCCESS_REPORT': return <Zap className="w-4 h-4 text-emerald-400" />
      case 'TACTICAL_UPDATE': return <AlertTriangle className="w-4 h-4 text-orange-400" />
      default: return <Activity className="w-4 h-4 text-gray-400" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'WEATHER_ALERT': return 'text-blue-400 bg-blue-400/10 border-blue-400/30'
      case 'REGIONAL_UPDATE': return 'text-green-400 bg-green-400/10 border-green-400/30'
      case 'SOLUNAR_UPDATE': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30'
      case 'MIGRATION_UPDATE': return 'text-purple-400 bg-purple-400/10 border-purple-400/30'
      case 'SUCCESS_REPORT': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/30'
      case 'TACTICAL_UPDATE': return 'text-orange-400 bg-orange-400/10 border-orange-400/30'
      default: return 'text-gray-400 bg-gray-400/10 border-gray-400/30'
    }
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60))

    if (diffMinutes < 1) return 'NOW'
    if (diffMinutes < 60) return `${diffMinutes}m`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h`
    return date.toLocaleDateString()
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
      {/* Ticker Header */}
      <div className="bg-gray-900 border-b border-gray-700 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-mono font-bold text-red-400 tracking-wider">
              LIVE HUNTING INTELLIGENCE
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="text-xs text-gray-400 hover:text-white transition-colors font-mono"
            >
              {isPaused ? 'RESUME' : 'PAUSE'}
            </button>
            <span className="text-xs text-gray-500 font-mono">
              {gameType.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Scrolling Ticker */}
      <div
        ref={scrollRef}
        className="h-12 overflow-hidden bg-black/50"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`flex items-center h-full space-x-8 ${!isPaused ? 'animate-scroll' : ''}`}>
          {tickerItems.map((item, index) => (
            <div key={`${item.id}-${index}`} className="flex items-center space-x-2 whitespace-nowrap">
              {getTypeIcon(item.type)}
              <span className="text-sm font-mono text-white">
                <span className="text-gray-400">[{formatTimestamp(item.timestamp)}]</span>
                <span className="ml-2 text-yellow-400 font-bold">{item.region}:</span>
                <span className="ml-2">{item.message}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Alert Cards */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {tickerItems.slice(0, 5).map((item) => (
          <div key={item.id} className={`border rounded-lg p-3 ${getTypeColor(item.type)}`}>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {getTypeIcon(item.type)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-mono font-bold tracking-wide">
                    {item.type.replace('_', ' ')}
                  </span>
                  <span className="text-xs font-mono text-gray-400">
                    {formatTimestamp(item.timestamp)}
                  </span>
                </div>
                <p className="text-sm font-mono leading-relaxed">
                  <span className="font-bold">{item.region}:</span> {item.message}
                </p>

                {/* Additional data display */}
                {item.data && (
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs font-mono">
                    {Object.entries(item.data).map(([key, value]) => (
                      <div key={key} className="flex justify-between bg-black/30 rounded px-2 py-1">
                        <span className="text-gray-400 uppercase">{key}:</span>
                        <span className="font-bold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .animate-scroll {
          animation: scroll 60s linear infinite;
        }

        @keyframes scroll {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  )
}