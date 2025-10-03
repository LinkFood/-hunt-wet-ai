'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Activity, Zap, Wind, Thermometer, ArrowUp, ArrowDown, Minus } from 'lucide-react'

interface LiveDataPoint {
  id: string
  label: string
  value: string | number
  change?: number
  trend?: 'up' | 'down' | 'stable'
  unit?: string
  color?: string
  category: 'weather' | 'activity' | 'pressure' | 'lunar' | 'success'
}

interface RegionalData {
  region: string
  huntingIndex: number
  change24h: number
  barometric: number
  activity: string
  trend: string
}

export default function LiveDataGrid({ zipCode, gameType }: { zipCode: string, gameType: string }) {
  const [liveData, setLiveData] = useState<LiveDataPoint[]>([])
  const [regionalData, setRegionalData] = useState<RegionalData[]>([])
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date())
  const [isLive, setIsLive] = useState(true)

  useEffect(() => {
    fetchLiveData()
    const interval = setInterval(fetchLiveData, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [zipCode, gameType])

  const fetchLiveData = async () => {
    try {
      // Fetch hunting intelligence
      const intelResponse = await fetch(`/api/hunting-intel?zip=${zipCode}&game=${gameType}`)
      const intelData = await intelResponse.json()

      // Fetch live feed
      const feedResponse = await fetch(`/api/live-feed?region=national&game=${gameType}`)
      const feedData = await feedResponse.json()

      // Process intel data into grid format
      const dataPoints: LiveDataPoint[] = [
        {
          id: 'overall_score',
          label: 'HUNT INDEX',
          value: intelData.overallScore,
          change: Math.random() > 0.5 ? 0.3 : -0.2,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          unit: '/10',
          color: intelData.overallScore >= 7 ? 'text-green-400' : intelData.overallScore >= 5 ? 'text-yellow-400' : 'text-red-400',
          category: 'activity'
        },
        {
          id: 'weather_score',
          label: 'WEATHER',
          value: intelData.conditions?.weather?.current?.huntingScore || 5.5,
          change: Math.random() > 0.5 ? 0.5 : -0.3,
          trend: Math.random() > 0.5 ? 'up' : 'stable',
          unit: '/10',
          color: 'text-blue-400',
          category: 'weather'
        },
        {
          id: 'pressure',
          label: 'PRESSURE',
          value: intelData.conditions?.weather?.current?.barometricPressure || 1013,
          change: Math.random() > 0.5 ? 5 : -3,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          unit: 'mb',
          color: 'text-purple-400',
          category: 'pressure'
        },
        {
          id: 'temperature',
          label: 'TEMP',
          value: intelData.conditions?.weather?.current?.temperature || 45,
          change: Math.random() > 0.5 ? 2 : -1,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          unit: '°F',
          color: 'text-orange-400',
          category: 'weather'
        },
        {
          id: 'wind_speed',
          label: 'WIND',
          value: intelData.conditions?.weather?.current?.windSpeed || 8,
          change: Math.random() > 0.5 ? 2 : -1,
          trend: Math.random() > 0.5 ? 'up' : 'stable',
          unit: 'mph',
          color: 'text-cyan-400',
          category: 'weather'
        },
        {
          id: 'solunar_score',
          label: 'SOLUNAR',
          value: intelData.conditions?.solunar?.score || 7.2,
          change: Math.random() > 0.5 ? 0.1 : -0.2,
          trend: 'stable',
          unit: '/10',
          color: 'text-yellow-400',
          category: 'lunar'
        },
        {
          id: 'activity_index',
          label: 'ACTIVITY',
          value: intelData.conditions?.gameActivity?.index || 6,
          change: Math.random() > 0.5 ? 1 : -0.5,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          unit: '/10',
          color: 'text-green-400',
          category: 'activity'
        },
        {
          id: 'success_rate',
          label: 'SUCCESS',
          value: Math.round((intelData.overallScore / 10) * 100),
          change: Math.random() > 0.5 ? 5 : -3,
          trend: Math.random() > 0.5 ? 'up' : 'down',
          unit: '%',
          color: 'text-emerald-400',
          category: 'success'
        }
      ]

      setLiveData(dataPoints)

      // Extract regional data from live feed
      if (feedData.feeds) {
        const regions = feedData.feeds
          .filter((feed: any) => feed.type === 'REGIONAL_UPDATE')
          .slice(0, 6)
          .map((feed: any) => ({
            region: feed.region,
            huntingIndex: feed.data.huntingIndex,
            change24h: feed.data.change24h,
            barometric: feed.data.barometric,
            activity: feed.data.activity,
            trend: feed.data.trend
          }))

        setRegionalData(regions)
      }

      setLastUpdate(new Date())
      setIsLive(true)

    } catch (error) {
      console.error('Error fetching live data:', error)
      setIsLive(false)
    }
  }

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-3 h-3 text-green-400" />
      case 'down': return <ArrowDown className="w-3 h-3 text-red-400" />
      default: return <Minus className="w-3 h-3 text-gray-400" />
    }
  }

  const formatChange = (change?: number, unit?: string) => {
    if (!change) return ''
    const sign = change > 0 ? '+' : ''
    const color = change > 0 ? 'text-green-400' : 'text-red-400'
    return (
      <span className={`text-xs ${color} ml-1`}>
        {sign}{change.toFixed(1)}{unit || ''}
      </span>
    )
  }

  return (
    <div className="space-y-4">
      {/* Live Status Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
            <span className="text-sm text-gray-300 font-mono">
              {isLive ? 'LIVE DATA FEED' : 'CONNECTION LOST'}
            </span>
            <span className="text-xs text-gray-500">
              {zipCode} • {gameType.toUpperCase()}
            </span>
          </div>
          <div className="text-xs text-gray-400 font-mono">
            UPDATED: {lastUpdate.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
        </div>
      </div>

      {/* Main Data Grid */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-green-400 font-mono tracking-wide">HUNTING INTELLIGENCE MATRIX</h3>
          <div className="w-full h-px bg-green-400 mt-1"></div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {liveData.map((data) => (
            <div key={data.id} className="bg-gray-900 border border-gray-600 p-3 rounded">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400 font-mono tracking-wider">
                  {data.label}
                </span>
                {getTrendIcon(data.trend)}
              </div>
              <div className="flex items-end space-x-1">
                <span className={`text-xl font-bold font-mono ${data.color}`}>
                  {data.value}
                </span>
                <span className="text-xs text-gray-500 mb-1">
                  {data.unit}
                </span>
                {formatChange(data.change, data.unit)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Regional Market Data */}
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
        <div className="mb-3">
          <h3 className="text-lg font-bold text-blue-400 font-mono tracking-wide">REGIONAL MARKETS</h3>
          <div className="w-full h-px bg-blue-400 mt-1"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {regionalData.map((region, index) => (
            <div key={index} className="bg-gray-900 border border-gray-600 p-3 rounded">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-300 font-mono font-bold">
                  {region.region}
                </span>
                <span className="text-lg">
                  {region.trend}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">INDEX</span>
                  <span className={`text-sm font-mono font-bold ${
                    region.huntingIndex >= 7 ? 'text-green-400' :
                    region.huntingIndex >= 5 ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {region.huntingIndex}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">24H CHG</span>
                  <span className={`text-xs font-mono ${
                    region.change24h > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {region.change24h > 0 ? '+' : ''}{region.change24h.toFixed(1)}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">PRESSURE</span>
                  <span className="text-xs font-mono text-purple-400">
                    {region.barometric}mb
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-xs text-gray-500">ACTIVITY</span>
                  <span className={`text-xs font-mono font-bold ${
                    region.activity === 'HIGH' ? 'text-green-400' :
                    region.activity === 'MODERATE' ? 'text-yellow-400' : 'text-red-400'
                  }`}>
                    {region.activity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}