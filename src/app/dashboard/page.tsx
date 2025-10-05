'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface WeatherForecast {
  date: string
  temp_max: number
  temp_min: number
  conditions: string
  description: string
  hours: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [weather, setWeather] = useState<WeatherForecast[]>([])
  const [loading, setLoading] = useState(true)
  const [location, setLocation] = useState({ lat: 39.4, lon: -76.6 }) // Baltimore default

  useEffect(() => {
    // Check auth
    const auth = localStorage.getItem('hunt_wet_auth')
    if (!auth) {
      router.push('/')
      return
    }

    // Load weather
    fetchWeather()
  }, [])

  const fetchWeather = async () => {
    try {
      const res = await fetch(`/api/test-visual-crossing?type=forecast&lat=${location.lat}&lon=${location.lon}&days=7`)
      const data = await res.json()
      if (data.success) {
        setWeather(data.data)
      }
    } catch (error) {
      console.error('Weather fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hunt_wet_auth')
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center">
        <div className="text-white text-xl">Loading weather data...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">🦌 Hunt Wet AI</h1>
            <p className="text-green-200">Your Personal Hunting Intelligence</p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Logout
          </button>
        </div>

        {/* Weather Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">📍 Location</h2>
            <p className="text-green-200 mb-4">Baltimore, MD</p>
            <p className="text-sm text-green-300/60">
              Lat: {location.lat}, Lon: {location.lon}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-2xl font-bold text-white mb-4">💰 Weather API Status</h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-200">Visual Crossing Active</span>
              </div>
              <p className="text-sm text-green-300/80">$250/month • Premium data</p>
              <p className="text-xs text-green-300/60">15-day forecast • Historical data • Hourly precision</p>
            </div>
          </div>
        </div>

        {/* 7-Day Forecast */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">🌤️ 7-Day Forecast</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {weather.map((day, idx) => (
              <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10 hover:bg-white/10 transition-colors">
                <div className="text-green-300 text-sm mb-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                </div>
                <div className="text-white text-3xl font-bold mb-2">
                  {Math.round(day.temp_max)}°
                </div>
                <div className="text-green-400 text-sm mb-3">
                  Low: {Math.round(day.temp_min)}°
                </div>
                <div className="text-green-200 text-sm">
                  {day.conditions}
                </div>
                {day.hours && day.hours.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-white/10">
                    <div className="text-xs text-green-300/60">
                      Pressure: {day.hours[12]?.pressure || 'N/A'} mb
                    </div>
                    <div className="text-xs text-green-300/60">
                      Wind: {day.hours[12]?.wind_speed || 'N/A'} mph {day.hours[12]?.wind_direction_cardinal || ''}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Hunt Logging - Coming Soon */}
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
          <h2 className="text-2xl font-bold text-white mb-4">📝 Log Hunt</h2>
          <p className="text-green-200 mb-4">Hunt logging form coming next...</p>
          <div className="text-sm text-green-300/60">
            <p>Will capture:</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Date, time, location</li>
              <li>Species, outcome, notes</li>
              <li>40+ environmental data points</li>
              <li>Weather, pressure, moon phase</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
