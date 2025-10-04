'use client'

import { useState, useEffect } from 'react'
import { Cloud, Sun, Wind, Droplets, Activity, Calendar, FileText, MapPin, AlertCircle, ExternalLink } from 'lucide-react'

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

  return (
    <div className="space-y-4">
      {/* Location Header */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <div className="flex items-center space-x-2 mb-2">
          <MapPin className="w-5 h-5 text-orange-400" />
          <h2 className="text-lg font-bold text-gray-100">{location.displayName}</h2>
        </div>
        <p className="text-sm text-gray-400">
          {gameType ? `Hunting ${gameType}` : 'Select game type for specific regulations'}
        </p>
      </div>

      {/* Current Conditions - THE MOST IMPORTANT CARD */}
      {weather && (
        <div className="bg-gradient-to-br from-orange-600/20 to-orange-800/20 border-2 border-orange-600/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Cloud className="w-6 h-6 text-orange-400" />
              <h3 className="text-xl font-bold text-orange-400">Current Conditions</h3>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-gray-100">{weather.current.temperature}°F</div>
              <div className="text-sm text-gray-400">Feels {weather.current.feels_like}°F</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Barometric Pressure - CRITICAL FOR HUNTING */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-gray-400">Pressure</span>
              </div>
              <div className="text-lg font-bold text-gray-100">{weather.current.barometric_pressure} mb</div>
              <div className="text-xs text-gray-400">
                {weather.current.barometric_pressure > 1020 ? 'High - Stable' :
                 weather.current.barometric_pressure < 1000 ? 'Low - Active' : 'Normal'}
              </div>
            </div>

            {/* Wind */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Wind className="w-4 h-4 text-green-400" />
                <span className="text-xs text-gray-400">Wind</span>
              </div>
              <div className="text-lg font-bold text-gray-100">{weather.current.wind_speed} mph</div>
              <div className="text-xs text-gray-400">{weather.current.wind_direction}</div>
            </div>

            {/* Humidity */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Droplets className="w-4 h-4 text-cyan-400" />
                <span className="text-xs text-gray-400">Humidity</span>
              </div>
              <div className="text-lg font-bold text-gray-100">{weather.current.humidity}%</div>
            </div>

            {/* Conditions */}
            <div className="bg-gray-800/50 rounded-lg p-3">
              <div className="flex items-center space-x-2 mb-1">
                <Sun className="w-4 h-4 text-yellow-400" />
                <span className="text-xs text-gray-400">Conditions</span>
              </div>
              <div className="text-sm font-bold text-gray-100 capitalize">{weather.current.description}</div>
            </div>
          </div>
        </div>
      )}

      {/* 5-Day Forecast */}
      {weather && weather.forecast.length > 0 && (
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
          <h3 className="font-bold text-gray-100 mb-3 flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-blue-400" />
            <span>5-Day Forecast</span>
          </h3>
          <div className="space-y-2">
            {weather.forecast.map((day, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3">
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-100">
                    {i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-xs text-gray-400 capitalize">{day.conditions}</div>
                </div>
                <div className="text-right mr-4">
                  <div className="text-sm font-bold text-gray-100">{day.temp_max}° / {day.temp_min}°</div>
                  <div className="text-xs text-gray-400">{day.barometric_pressure} mb</div>
                </div>
                <div className="text-xs text-gray-400">
                  <Wind className="w-3 h-3 inline mr-1" />
                  {day.wind_speed} mph
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hunting Seasons (PLACEHOLDER - Need state data) */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="font-bold text-gray-100 mb-3 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-green-400" />
          <span>Hunting Seasons</span>
        </h3>
        <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-lg p-4 mb-3">
          <div className="flex items-center space-x-2 mb-2">
            <AlertCircle className="w-4 h-4 text-yellow-400" />
            <span className="text-xs font-bold text-yellow-400">VERIFY CURRENT REGULATIONS</span>
          </div>
          <p className="text-xs text-gray-400">
            Always check your state's official wildlife agency for current season dates and regulations.
          </p>
        </div>

        {/* Example season data - will be replaced with real API */}
        <div className="space-y-2">
          <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="font-bold text-green-400">Deer - Archery</span>
              <span className="text-xs bg-green-600/20 text-green-400 px-2 py-1 rounded">OPEN</span>
            </div>
            <div className="text-xs text-gray-400">Sep 15 - Jan 31 • 30 days remaining</div>
            <div className="text-xs text-gray-300 mt-2">Bag limit: 1 buck, 2 doe (antlerless permits)</div>
          </div>

          {gameType && gameType !== 'big-game' && (
            <div className="bg-gray-700/30 border border-gray-600 rounded-lg p-3">
              <div className="flex items-center justify-between mb-1">
                <span className="font-bold text-gray-300 capitalize">{gameType}</span>
                <span className="text-xs bg-gray-600/50 text-gray-400 px-2 py-1 rounded">Check dates</span>
              </div>
              <div className="text-xs text-gray-400">View your state's regulations for specific dates</div>
            </div>
          )}
        </div>
      </div>

      {/* Regulations Summary */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="font-bold text-gray-100 mb-3 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-red-400" />
          <span>Regulations</span>
        </h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <span className="text-sm text-gray-400">Legal Hours</span>
            <span className="text-sm font-bold text-gray-100">30 min before sunrise - 30 min after sunset</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-gray-700">
            <span className="text-sm text-gray-400">License Required</span>
            <span className="text-sm font-bold text-yellow-400">Yes + Tags</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <span className="text-sm text-gray-400">Hunter Orange</span>
            <span className="text-sm font-bold text-orange-400">Required during gun seasons</span>
          </div>
        </div>
      </div>

      {/* License Info */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="font-bold text-gray-100 mb-3 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span>Get Licensed</span>
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Purchase hunting licenses and tags from your state's official website:
        </p>
        <a
          href={`https://www.google.com/search?q=${encodeURIComponent(location.displayName + ' hunting license')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between bg-purple-600/20 hover:bg-purple-600/30 border border-purple-600/50 rounded-lg p-3 transition-colors"
        >
          <span className="text-sm font-bold text-purple-400">Find License Info</span>
          <ExternalLink className="w-4 h-4 text-purple-400" />
        </a>
      </div>

      {/* Public Land Resources */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
        <h3 className="font-bold text-gray-100 mb-3 flex items-center space-x-2">
          <MapPin className="w-5 h-5 text-cyan-400" />
          <span>Public Land</span>
        </h3>
        <p className="text-sm text-gray-400 mb-3">
          Find public hunting land near you:
        </p>
        <div className="space-y-2">
          <a
            href={`https://www.google.com/maps/search/public+hunting+land+near+${encodeURIComponent(location.displayZip)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-cyan-600/20 hover:bg-cyan-600/30 border border-cyan-600/50 rounded-lg p-3 transition-colors"
          >
            <span className="text-sm font-bold text-cyan-400">View on Google Maps</span>
            <ExternalLink className="w-4 h-4 text-cyan-400" />
          </a>
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(location.displayName + ' WMA hunting')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between bg-green-600/20 hover:bg-green-600/30 border border-green-600/50 rounded-lg p-3 transition-colors"
          >
            <span className="text-sm font-bold text-green-400">Wildlife Management Areas</span>
            <ExternalLink className="w-4 h-4 text-green-400" />
          </a>
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 border-2 border-orange-600 rounded-xl p-6 text-center">
        <div className="text-2xl font-bold text-orange-400 mb-2">Want More?</div>
        <p className="text-gray-300 mb-4">
          Track YOUR hunt outcomes, see YOUR success patterns, get AI predictions based on YOUR data.
        </p>
        <button className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">
          Upgrade to Premium - $200/year
        </button>
        <p className="text-xs text-gray-500 mt-3">
          Coming soon • Early access for testing
        </p>
      </div>
    </div>
  )
}
