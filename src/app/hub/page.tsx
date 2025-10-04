'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MessageSquare, MapPin } from 'lucide-react'

interface HuntLocation {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

interface WeatherDay {
  date: string
  dayName: string
  tempHigh: number
  tempLow: number
  conditions: string
  icon: string
  precipChance: number
}

interface HuntingIntel {
  summary: string
  species: string[]
  bestTimes: string
  tactics: string
  seasons: string
  regulations: string
}

export default function HubPage() {
  const [location, setLocation] = useState<HuntLocation | null>(null)
  const [gameType, setGameType] = useState<string>('big-game')
  const [forecast, setForecast] = useState<WeatherDay[]>([])
  const [intel, setIntel] = useState<HuntingIntel | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Load location on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('huntWet_location')
    const savedGame = localStorage.getItem('huntWet_gameType')

    if (!savedLocation) {
      router.push('/')
      return
    }

    try {
      const parsedLocation = JSON.parse(savedLocation) as HuntLocation
      setLocation(parsedLocation)
      setGameType(savedGame || 'big-game')

      // Fetch weather and intel
      fetchHubData(parsedLocation, savedGame || 'big-game')
    } catch (error) {
      console.error('Error loading location:', error)
      router.push('/')
    }
  }, [router])

  const fetchHubData = async (loc: HuntLocation, game: string) => {
    setLoading(true)
    try {
      // Fetch weather data
      const weatherResponse = await fetch(`/api/weather?lat=${loc.lat}&lon=${loc.lon}`)
      const weatherData = await weatherResponse.json()

      if (weatherData.success && weatherData.data?.daily) {
        const days: WeatherDay[] = weatherData.data.daily.slice(0, 7).map((day: any, i: number) => ({
          date: day.date,
          dayName: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : new Date(day.timestamp * 1000).toLocaleDateString('en-US', { weekday: 'short' }),
          tempHigh: day.temp_max,
          tempLow: day.temp_min,
          conditions: day.conditions,
          icon: getWeatherIcon(day.conditions),
          precipChance: day.precipitation_chance
        }))
        setForecast(days)
      }

      // Fetch comprehensive hunting intel
      const intelResponse = await fetch('/api/hunting-intel-full', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: loc,
          gameType: game,
          weatherData: weatherData.data
        })
      })

      const intelData = await intelResponse.json()
      if (intelData.success) {
        setIntel(intelData.intel)
      }

    } catch (error) {
      console.error('Error fetching hub data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getWeatherIcon = (conditions: string): string => {
    const icons: Record<string, string> = {
      'Clear': '☀️',
      'Clouds': '☁️',
      'Rain': '🌧️',
      'Snow': '❄️',
      'Thunderstorm': '⛈️',
      'Drizzle': '🌦️',
      'Mist': '🌫️',
      'Fog': '🌫️'
    }
    return icons[conditions] || '🌤️'
  }

  if (loading || !location) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading hunting intelligence...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-br from-orange-600 to-orange-700 text-white px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-4xl font-bold">Hunt Wet</h1>
            <button
              onClick={() => {
                localStorage.removeItem('huntWet_location')
                localStorage.removeItem('huntWet_gameType')
                router.push('/')
              }}
              className="text-sm underline opacity-90 hover:opacity-100"
            >
              Change Location
            </button>
          </div>
          <div className="flex items-center space-x-2 text-orange-100">
            <MapPin className="w-5 h-5" />
            <span className="text-lg">{location.displayName}</span>
            {location.displayZip && <span className="text-sm opacity-75">({location.displayZip})</span>}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* 7-Day Forecast */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">7-Day Forecast</h2>
          <div className="grid grid-cols-7 gap-2">
            {forecast.map((day, i) => (
              <div
                key={i}
                className="bg-gray-50 rounded-xl p-3 text-center border-2 border-gray-200"
              >
                <div className="text-sm font-semibold text-gray-700 mb-1">{day.dayName}</div>
                <div className="text-3xl mb-2">{day.icon}</div>
                <div className="text-xs text-gray-600 mb-2">{day.conditions}</div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-gray-900">{day.tempHigh}°</div>
                  <div className="text-xs text-gray-500">{day.tempLow}°</div>
                </div>
                {day.precipChance > 0 && (
                  <div className="text-xs text-blue-600 mt-1">{day.precipChance}%</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Complete Hunting Intel */}
        {intel && (
          <>
            {/* Summary */}
            <section className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border-2 border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Hunting Intelligence</h2>
              <p className="text-gray-700 text-lg leading-relaxed">{intel.summary}</p>
            </section>

            {/* Species */}
            {intel.species.length > 0 && (
              <section>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Available Species</h3>
                <div className="flex flex-wrap gap-2">
                  {intel.species.map((species, i) => (
                    <span
                      key={i}
                      className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-semibold"
                    >
                      {species}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Best Times */}
            <section className="bg-blue-50 rounded-2xl p-6 border-2 border-blue-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Best Hunting Times</h3>
              <p className="text-gray-700 whitespace-pre-line">{intel.bestTimes}</p>
            </section>

            {/* Tactics */}
            <section>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Recommended Tactics</h3>
              <p className="text-gray-700 whitespace-pre-line leading-relaxed">{intel.tactics}</p>
            </section>

            {/* Seasons */}
            <section className="bg-green-50 rounded-2xl p-6 border-2 border-green-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Season Dates</h3>
              <p className="text-gray-700 whitespace-pre-line">{intel.seasons}</p>
            </section>

            {/* Regulations */}
            <section className="bg-red-50 rounded-2xl p-6 border-2 border-red-200">
              <h3 className="text-xl font-bold text-gray-900 mb-3">Regulations & Rules</h3>
              <p className="text-gray-700 whitespace-pre-line text-sm">{intel.regulations}</p>
            </section>
          </>
        )}

        {/* Chat Button */}
        <section className="pt-4 pb-8">
          <button
            onClick={() => router.push('/chat')}
            className="w-full bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-all shadow-lg flex items-center justify-center space-x-3"
          >
            <MessageSquare className="w-6 h-6" />
            <span>Ask Hunt Wet AI</span>
          </button>
          <p className="text-center text-gray-500 text-sm mt-3">
            Get personalized hunting advice based on real-time conditions
          </p>
        </section>
      </div>
    </div>
  )
}
