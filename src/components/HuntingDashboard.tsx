'use client'

import { useState, useEffect } from 'react'
import { Cloud, MapPin, Calendar, TrendingUp, AlertTriangle } from 'lucide-react'

interface WeatherAlert {
  region: string
  condition: string
  impact: string
  severity: 'high' | 'medium' | 'low'
}

interface HuntingNews {
  id: string
  title: string
  region: string
  timestamp: Date
  category: 'weather' | 'activity' | 'season' | 'alert'
}

export default function HuntingDashboard() {
  const [weatherAlerts] = useState<WeatherAlert[]>([
    {
      region: "Midwest",
      condition: "Cold front approaching",
      impact: "Deer activity expected to increase 40%",
      severity: "high"
    },
    {
      region: "Southeast",
      condition: "High pressure system",
      impact: "Stable conditions, moderate activity",
      severity: "medium"
    }
  ])

  const [huntingNews] = useState<HuntingNews[]>([
    {
      id: "1",
      title: "Rut activity peaks in northern regions",
      region: "Northern States",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      category: "season"
    },
    {
      id: "2",
      title: "Major weather front moving through midwest",
      region: "Midwest",
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
      category: "weather"
    },
    {
      id: "3",
      title: "Duck migration hitting peak numbers",
      region: "Central Flyway",
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000), // 6 hours ago
      category: "activity"
    }
  ])

  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

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
    <div className="space-y-6">
      {/* Live Intelligence Header */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Live Hunting Intelligence</h2>
            <p className="text-sm text-gray-500">
              {currentTime.toLocaleString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>
      </div>

      {/* Weather Patterns */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-2 mb-3">
          <Cloud className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Major Weather Patterns</h3>
        </div>
        <div className="space-y-3">
          {weatherAlerts.map((alert, index) => (
            <div
              key={index}
              className={`p-3 rounded-lg border ${getSeverityColor(alert.severity)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="font-medium text-sm">{alert.region}</span>
                  </div>
                  <p className="text-sm font-medium">{alert.condition}</p>
                  <p className="text-xs mt-1">{alert.impact}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Hunting News Ticker */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center space-x-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-600" />
          <h3 className="font-semibold text-gray-900">Hunting Intelligence Updates</h3>
        </div>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {huntingNews.map((news) => (
            <div key={news.id} className="flex items-start space-x-3 p-2 hover:bg-gray-50 rounded">
              <div className="mt-1">
                {getCategoryIcon(news.category)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                  {news.title}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-gray-500">{news.region}</span>
                  <span className="text-xs text-gray-400">•</span>
                  <span className="text-xs text-gray-500">{formatTimeAgo(news.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-green-600">73%</div>
          <div className="text-xs text-gray-500">Success Rate Today</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">847</div>
          <div className="text-xs text-gray-500">Active Hunters</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm border p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">156</div>
          <div className="text-xs text-gray-500">Reports Today</div>
        </div>
      </div>
    </div>
  )
}