'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, Wind, Droplets, Activity, Calendar, FileText, MapPin, AlertCircle, ExternalLink, TrendingUp, TrendingDown, Minus, Moon, Eye, CloudRain } from 'lucide-react'

interface Location {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

interface WeatherData {
  current: {
    temperature: number
    feels_like: number
    barometric_pressure: number
    humidity: number
    wind_speed: number
    wind_direction: string
    conditions: string
    description: string
  }
  forecast: Array<{
    date: string
    temp_min: number
    temp_max: number
    conditions: string
    barometric_pressure: number
    wind_speed: number
  }>
}

interface InformationHubProps {
  location: Location
  gameType: string | null
}

export default function InformationHub({ location, gameType }: InformationHubProps) {
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchWeatherData()
  }, [location])

  const fetchWeatherData = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/weather-info?lat=${location.lat}&lon=${location.lon}`)
      const data = await response.json()

      if (data.success) {
        setWeather(data.weather)
      } else {
        setError('Failed to load weather data')
      }
    } catch (err) {
      setError('Network error')
      console.error('Weather fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-orange-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Loading hunting intelligence...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-6 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <p className="text-red-400 mb-2 font-bold">Failed to Load Data</p>
        <p className="text-gray-400 text-sm">{error}</p>
        <button
          onClick={fetchWeatherData}
          className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-colors"
        >
          Retry
        </button>
      </div>
    )
  }

  // Calculate pressure trend
  const getPressureTrend = () => {
    if (!weather || weather.forecast.length < 2) return 'stable'
    const currentPressure = weather.current.barometric_pressure
    const futurePressure = weather.forecast[1]?.barometric_pressure || currentPressure
    const diff = futurePressure - currentPressure
    if (diff > 2) return 'rising'
    if (diff < -2) return 'falling'
    return 'stable'
  }

  // Get hunting quality score based on conditions (visual indicator)
  const getHuntQualityColor = (pressure: number) => {
    if (pressure < 1000) return 'text-red-400'
    if (pressure < 1010) return 'text-orange-400'
    if (pressure > 1025) return 'text-yellow-400'
    return 'text-green-400'
  }

  return (
    <div className="pb-6">
      {/* Location Header - Compact */}
      <div className="bg-gray-900/50 border-b border-gray-800 px-4 py-3 mb-4 -mx-4 sm:mx-0 sm:rounded-xl sm:border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MapPin className="w-4 h-4 text-orange-400" />
            <h2 className="text-sm font-bold text-gray-100">{location.displayName}</h2>
          </div>
          {gameType && (
            <div className="text-xs text-gray-400 capitalize">{gameType}</div>
          )}
        </div>
      </div>

      {weather && (
        <>
          {/* HERO CARD - Big Temperature Display */}
          <div className="bg-gradient-to-br from-orange-600/30 via-orange-700/20 to-gray-800 border border-orange-600/50 rounded-2xl p-6 mb-4">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="text-6xl sm:text-7xl font-bold text-white mb-2">
                  {weather.current.temperature}°
                </div>
                <div className="text-lg text-gray-300 capitalize mb-1">{weather.current.description}</div>
                <div className="text-sm text-gray-400">Feels like {weather.current.feels_like}°F</div>
              </div>
              <div className="text-right">
                <Cloud className="w-16 h-16 text-orange-400/70" />
              </div>
            </div>

            {/* Mini stats in hero card */}
            <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700/50">
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">High / Low</div>
                <div className="text-sm font-bold text-gray-100">
                  {weather.forecast[0]?.temp_max}° / {weather.forecast[0]?.temp_min}°
                </div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Humidity</div>
                <div className="text-sm font-bold text-cyan-400">{weather.current.humidity}%</div>
              </div>
              <div className="text-center">
                <div className="text-xs text-gray-400 mb-1">Conditions</div>
                <div className={`text-sm font-bold ${getHuntQualityColor(weather.current.barometric_pressure)}`}>
                  {weather.current.barometric_pressure > 1020 ? 'Good' :
                   weather.current.barometric_pressure < 1000 ? 'Prime' : 'Fair'}
                </div>
              </div>
            </div>
          </div>

          {/* CRITICAL METRICS GRID - 2x2 on mobile, 4 cols on desktop */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {/* Barometric Pressure - MOST IMPORTANT */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-blue-600/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Activity className="w-5 h-5 text-blue-400" />
                {getPressureTrend() === 'rising' && <TrendingUp className="w-4 h-4 text-green-400" />}
                {getPressureTrend() === 'falling' && <TrendingDown className="w-4 h-4 text-red-400" />}
                {getPressureTrend() === 'stable' && <Minus className="w-4 h-4 text-gray-400" />}
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {weather.current.barometric_pressure}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Pressure (mb)</div>
              <div className="text-xs text-blue-400 mt-2 font-medium">
                {weather.current.barometric_pressure > 1020 ? 'High & Stable' :
                 weather.current.barometric_pressure < 1000 ? 'Low - Active Wildlife' :
                 getPressureTrend() === 'falling' ? 'Dropping - Hunt Now' : 'Normal'}
              </div>
            </div>

            {/* Wind Speed & Direction */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-green-600/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Wind className="w-5 h-5 text-green-400" />
                <div className="text-xs text-gray-400">{weather.current.wind_direction}</div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {weather.current.wind_speed}
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Wind (mph)</div>
              <div className="text-xs text-green-400 mt-2 font-medium">
                {weather.current.wind_speed < 5 ? 'Calm' :
                 weather.current.wind_speed < 15 ? 'Ideal' : 'Strong'}
              </div>
            </div>

            {/* Humidity */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-cyan-600/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Droplets className="w-5 h-5 text-cyan-400" />
                {/* Circular progress indicator */}
                <div className="relative w-8 h-8">
                  <svg className="w-8 h-8 -rotate-90">
                    <circle cx="16" cy="16" r="12" stroke="currentColor" strokeWidth="3" fill="none" className="text-gray-700" />
                    <circle
                      cx="16"
                      cy="16"
                      r="12"
                      stroke="currentColor"
                      strokeWidth="3"
                      fill="none"
                      className="text-cyan-400"
                      strokeDasharray={`${(weather.current.humidity / 100) * 75.4} 75.4`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center text-[8px] font-bold text-cyan-400">
                    {weather.current.humidity}
                  </div>
                </div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                {weather.current.humidity}%
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Humidity</div>
              <div className="text-xs text-cyan-400 mt-2 font-medium">
                {weather.current.humidity > 80 ? 'High' :
                 weather.current.humidity < 40 ? 'Low' : 'Moderate'}
              </div>
            </div>

            {/* Moon Phase Placeholder */}
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 hover:border-purple-600/50 transition-colors">
              <div className="flex items-center justify-between mb-3">
                <Moon className="w-5 h-5 text-purple-400" />
                <div className="text-xs text-gray-400">Phase</div>
              </div>
              <div className="text-2xl font-bold text-white mb-1">
                🌓
              </div>
              <div className="text-xs text-gray-400 uppercase tracking-wide">Moon</div>
              <div className="text-xs text-purple-400 mt-2 font-medium">
                Waxing Crescent
              </div>
            </div>
          </div>

          {/* PRESSURE TREND CHART - Visual bar chart */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-100 flex items-center space-x-2">
                <Activity className="w-4 h-4 text-blue-400" />
                <span>5-Day Pressure Trend</span>
              </h3>
              <div className="text-xs text-gray-400">
                {getPressureTrend() === 'falling' && <span className="text-orange-400">⚠️ Dropping</span>}
                {getPressureTrend() === 'rising' && <span className="text-green-400">📈 Rising</span>}
              </div>
            </div>

            {/* Bar chart */}
            <div className="flex items-end justify-between space-x-2 h-32">
              {weather.forecast.slice(0, 5).map((day, i) => {
                const maxPressure = Math.max(...weather.forecast.slice(0, 5).map(d => d.barometric_pressure))
                const minPressure = Math.min(...weather.forecast.slice(0, 5).map(d => d.barometric_pressure))
                const range = maxPressure - minPressure || 1
                const heightPercent = ((day.barometric_pressure - minPressure) / range) * 70 + 30

                return (
                  <div key={i} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center justify-end h-full">
                      <div className="text-[10px] font-bold text-gray-300 mb-1">
                        {day.barometric_pressure}
                      </div>
                      <div
                        className={`w-full rounded-t-lg transition-all ${
                          day.barometric_pressure < 1000 ? 'bg-red-500/70' :
                          day.barometric_pressure < 1010 ? 'bg-orange-500/70' :
                          day.barometric_pressure > 1025 ? 'bg-yellow-500/70' :
                          'bg-blue-500/70'
                        }`}
                        style={{ height: `${heightPercent}%` }}
                      ></div>
                    </div>
                    <div className="text-[10px] text-gray-400 mt-2">
                      {i === 0 ? 'Now' : i === 1 ? 'Tom' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 5-DAY FORECAST - Compact cards */}
          <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-4">
            <h3 className="text-sm font-bold text-gray-100 mb-3 flex items-center space-x-2">
              <Calendar className="w-4 h-4 text-orange-400" />
              <span>Extended Forecast</span>
            </h3>
            <div className="space-y-2">
              {weather.forecast.slice(0, 5).map((day, i) => (
                <div key={i} className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="text-xs font-bold text-gray-300 w-12">
                      {i === 0 ? 'Today' : i === 1 ? 'Tmrw' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                    </div>
                    <CloudRain className="w-4 h-4 text-gray-400" />
                    <div className="text-xs text-gray-400 capitalize flex-1">{day.conditions}</div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-xs text-gray-400">
                      <Wind className="w-3 h-3 inline mr-1" />{day.wind_speed}
                    </div>
                    <div className="text-sm font-bold text-gray-100 text-right">
                      <span className="text-orange-400">{day.temp_max}°</span>
                      <span className="text-gray-500 mx-1">/</span>
                      <span className="text-cyan-400">{day.temp_min}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* QUICK INFO GRID - Seasons, Regs, Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Hunting Seasons */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-100 mb-3 flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-green-400" />
            <span>Active Seasons</span>
          </h3>
          <div className="space-y-2">
            <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-bold text-green-400">Deer - Archery</span>
                <span className="text-[10px] bg-green-600/30 text-green-300 px-2 py-0.5 rounded font-bold">OPEN</span>
              </div>
              <div className="text-[10px] text-gray-400">Sep 15 - Jan 31</div>
            </div>
            {gameType && gameType !== 'big-game' && (
              <div className="bg-gray-700/20 border border-gray-600/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-bold text-gray-300 capitalize">{gameType}</span>
                  <span className="text-[10px] bg-gray-600/30 text-gray-400 px-2 py-0.5 rounded font-bold">CHECK</span>
                </div>
                <div className="text-[10px] text-gray-400">Verify current dates</div>
              </div>
            )}
          </div>
          <div className="mt-3 pt-3 border-t border-gray-700">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-3 h-3 text-yellow-400 mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-gray-400">Always verify with your state wildlife agency</p>
            </div>
          </div>
        </div>

        {/* Regulations Quick View */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="text-sm font-bold text-gray-100 mb-3 flex items-center space-x-2">
            <FileText className="w-4 h-4 text-red-400" />
            <span>Key Regulations</span>
          </h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sun className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-400">Legal Hours</span>
              </div>
              <span className="text-xs font-bold text-gray-100">±30min sunrise/sunset</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <FileText className="w-3 h-3 text-yellow-400" />
                <span className="text-xs text-gray-400">License</span>
              </div>
              <span className="text-xs font-bold text-yellow-400">Required + Tags</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Eye className="w-3 h-3 text-orange-400" />
                <span className="text-xs text-gray-400">Safety Orange</span>
              </div>
              <span className="text-xs font-bold text-orange-400">Gun seasons</span>
            </div>
          </div>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(location.displayName + ' hunting regulations')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 rounded-lg p-2 transition-colors text-xs font-bold text-red-400"
          >
            <span>Full Regulations</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* RESOURCES GRID - License & Public Land */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        {/* Get Licensed */}
        <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/10 border border-purple-600/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <FileText className="w-5 h-5 text-purple-400" />
            <h3 className="text-sm font-bold text-purple-400">Get Licensed</h3>
          </div>
          <p className="text-xs text-gray-400 mb-3">Purchase licenses & tags online</p>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(location.displayName + ' buy hunting license online')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center space-x-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/50 rounded-lg p-3 transition-colors"
          >
            <span className="text-sm font-bold text-purple-300">Find License Portal</span>
            <ExternalLink className="w-4 h-4 text-purple-300" />
          </a>
        </div>

        {/* Public Land */}
        <div className="bg-gradient-to-br from-cyan-600/20 to-cyan-800/10 border border-cyan-600/50 rounded-xl p-4">
          <div className="flex items-center space-x-2 mb-3">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-cyan-400">Find Public Land</h3>
          </div>
          <div className="space-y-2">
            <a
              href={`https://www.google.com/maps/search/public+hunting+land+near+${encodeURIComponent(location.displayZip)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-500/30 rounded-lg p-2 transition-colors"
            >
              <span className="text-xs font-bold text-cyan-300">Google Maps</span>
              <ExternalLink className="w-3 h-3 text-cyan-300" />
            </a>
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(location.displayName + ' WMA hunting')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between bg-green-600/20 hover:bg-green-600/30 border border-green-500/30 rounded-lg p-2 transition-colors"
            >
              <span className="text-xs font-bold text-green-300">WMAs</span>
              <ExternalLink className="w-3 h-3 text-green-300" />
            </a>
          </div>
        </div>
      </div>

      {/* PREMIUM CTA - Sticky bottom banner style */}
      <div className="bg-gradient-to-r from-orange-600/40 via-red-600/40 to-orange-600/40 border-2 border-orange-500 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="text-xl font-bold text-orange-300 mb-1">Track YOUR Hunts</div>
            <p className="text-xs text-gray-300">
              Log outcomes • See patterns • Get AI predictions based on YOUR data
            </p>
          </div>
          <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors whitespace-nowrap shadow-lg">
            Premium - $200/yr
          </button>
        </div>
        <div className="text-[10px] text-gray-500 mt-3 text-center">Coming soon - Early access available</div>
      </div>
    </div>
  )
}
