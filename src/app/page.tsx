'use client'

import { useState, useEffect } from 'react'
import { Target, Cloud, Activity, Calendar, MapPin } from 'lucide-react'
import HuntingChat from '@/components/HuntingChat'
import { getQuickLocationName } from '@/lib/geocoding'

export default function Home() {
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null)
  const [zipCode, setZipCode] = useState('')
  const [locationName, setLocationName] = useState('')
  const [hasZipCode, setHasZipCode] = useState(false)
  const [activeTab, setActiveTab] = useState(0) // 0=Chat, 1=Weather, 2=Intel, 3=Regs

  // Load saved data on mount
  useEffect(() => {
    const savedZip = localStorage.getItem('huntWet_zipCode')
    const savedGame = localStorage.getItem('huntWet_gameType')
    if (savedZip) {
      setZipCode(savedZip)
      setLocationName(getQuickLocationName(savedZip))
      setHasZipCode(true)
      setSelectedGameType(savedGame || 'big-game')
    }
  }, [])

  const handleZipCodeSubmission = (zip: string, gameType?: string) => {
    setZipCode(zip)
    setLocationName(getQuickLocationName(zip))
    setHasZipCode(true)
    localStorage.setItem('huntWet_zipCode', zip)

    const finalGameType = gameType || 'big-game'
    setSelectedGameType(finalGameType)
    localStorage.setItem('huntWet_gameType', finalGameType)
  }

  const handleGameTypeChange = (gameType: string) => {
    setSelectedGameType(gameType)
    localStorage.setItem('huntWet_gameType', gameType)
  }

  // Auto-detect GPS location
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsStatus('error')
      return
    }

    setGpsStatus('loading')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Use the geocoding API to get ZIP from coordinates
          const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
          const response = await fetch(
            `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${apiKey}`
          )
          const data = await response.json()

          // OpenWeather reverse geocode doesn't return zip_code directly
          // We need to use a different approach - get closest city and infer ZIP
          if (data && data.length > 0 && data[0].name) {
            // For now, use geocoding from the city/state to get a working ZIP
            const location = data[0]
            const zipResponse = await fetch(
              `https://api.openweathermap.org/geo/1.0/zip?zip=${location.name},US&appid=${apiKey}`
            )

            // Fallback: Just use coordinates directly to get weather and infer location
            // Better approach: use browser's geolocation to get approximate ZIP
            const weatherResponse = await fetch(
              `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}`
            )
            const weatherData = await weatherResponse.json()

            // Extract ZIP from weather data or use geocoder service
            // For now, let's use a fallback geocoding service
            const geocodeResponse = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
              {
                headers: {
                  'User-Agent': 'HuntWetAI/1.0'
                }
              }
            )
            const geocodeData = await geocodeResponse.json()

            if (geocodeData?.address?.postcode) {
              // Extract just the 5-digit ZIP
              const zip = geocodeData.address.postcode.split('-')[0]
              handleZipCodeSubmission(zip)
              setGpsStatus('idle')
            } else {
              setGpsStatus('error')
            }
          } else {
            setGpsStatus('error')
          }
        } catch (error) {
          console.error('Error getting ZIP from GPS:', error)
          setGpsStatus('error')
        }
      },
      (error) => {
        console.error('GPS error:', error)
        setGpsStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  if (!hasZipCode) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        {/* Mobile Onboarding */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          <div className="w-full max-w-md text-center mb-8">
            <div className="flex items-center justify-center mb-6">
              <Target className="w-16 h-16 text-orange-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-100 mb-4">
              Hunt Wet AI
            </h1>
            <p className="text-gray-400 text-lg mb-6">
              Get AI-powered hunting intelligence for your area
            </p>
          </div>

          {/* Location Options */}
          <div className="w-full max-w-md space-y-3 mb-6">
            <button
              onClick={handleGetLocation}
              disabled={gpsStatus === 'loading'}
              className={`w-full font-medium py-4 px-6 rounded-xl flex items-center justify-center space-x-2 transition-colors ${
                gpsStatus === 'error'
                  ? 'bg-gray-600 text-gray-300'
                  : gpsStatus === 'loading'
                  ? 'bg-orange-500 text-white cursor-wait'
                  : 'bg-orange-600 hover:bg-orange-700 text-white'
              }`}
            >
              {gpsStatus === 'loading' ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Getting location...</span>
                </>
              ) : gpsStatus === 'error' ? (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Location unavailable</span>
                </>
              ) : (
                <>
                  <MapPin className="w-5 h-5" />
                  <span>Use My Current Location</span>
                </>
              )}
            </button>
            <div className="text-center">
              <div className="text-gray-500 text-sm mb-2">or</div>
              <div className="text-gray-400 text-sm">
                {gpsStatus === 'error'
                  ? 'Enter your ZIP code below →'
                  : 'Enter your ZIP code below ↓'
                }
              </div>
            </div>
          </div>

          {/* Chat Interface */}
          <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6">
            <HuntingChat
              hasZipCode={false}
              zipCode=""
              gameType={null}
              onZipCodeSubmission={handleZipCodeSubmission}
              onGameTypeChange={handleGameTypeChange}
            />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      {/* Mobile Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-7 h-7 text-orange-400" />
            <div>
              <h1 className="text-xl font-bold text-orange-400">HUNT WET AI</h1>
              <p className="text-xs text-gray-400">
                {locationName} • Learning patterns
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.clear()
              setHasZipCode(false)
              setZipCode('')
              setLocationName('')
            }}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-2 rounded-lg text-xs transition-colors"
          >
            Change Location
          </button>
        </div>
      </header>

      {/* Mobile Navigation Tabs */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 flex-shrink-0">
        <div className="flex">
          {[
            { name: 'Chat', icon: Target },
            { name: 'Weather', icon: Cloud },
            { name: 'Intel', icon: Activity },
            { name: 'Regs', icon: Calendar }
          ].map((tab, index) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(index)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === index
                  ? 'border-orange-400 text-orange-400'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile Content */}
      <div className="flex-1 bg-gray-900 overflow-hidden">
        {/* Tab 0: Chat */}
        {activeTab === 0 && (
          <div className="h-full flex flex-col p-4">
            <HuntingChat
              hasZipCode={true}
              zipCode={zipCode}
              gameType={selectedGameType}
              onZipCodeSubmission={handleZipCodeSubmission}
              onGameTypeChange={handleGameTypeChange}
            />
          </div>
        )}

        {/* Tab 1: Weather */}
        {activeTab === 1 && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
                <span className="text-red-400 font-bold text-sm">COLD FRONT ALERT</span>
              </div>
              <div className="text-gray-200 mb-2">Hits {locationName} at 3:00 AM tomorrow</div>
              <div className="text-red-400 font-bold text-lg">85% movement increase expected</div>
            </div>

            <div className="bg-yellow-600/10 border border-yellow-600/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-yellow-400 rounded-full animate-pulse"></div>
                <span className="text-yellow-400 font-bold text-sm">PRESSURE DROP</span>
              </div>
              <div className="text-gray-200 mb-2">Falling 0.15" per hour</div>
              <div className="text-yellow-400 font-bold text-lg">Prime hunting conditions</div>
            </div>

            <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                <span className="text-green-400 font-bold text-sm">WIND ADVANTAGE</span>
              </div>
              <div className="text-gray-200 mb-2">NE 8-12 mph steady</div>
              <div className="text-green-400 font-bold text-lg">Favors north-facing stands</div>
            </div>
          </div>
        )}

        {/* Tab 2: Intel */}
        {activeTab === 2 && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-5 h-5 text-green-400" />
                <h3 className="font-bold text-green-400">WILDLIFE ACTIVITY</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                  <div className="text-green-400 font-bold text-lg mb-1">Population: 78/100</div>
                  <div className="text-gray-300 text-sm">High activity based on 12 recent sightings</div>
                </div>
                <div className="bg-blue-600/10 border border-blue-600/30 rounded-lg p-3">
                  <div className="text-blue-400 font-bold mb-1">Recent Sighting</div>
                  <div className="text-gray-300 text-sm">8-point buck • 2 miles SE • Yesterday 6:15 PM</div>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <div className="flex items-center space-x-2 mb-3">
                <Activity className="w-5 h-5 text-blue-400" />
                <h3 className="font-bold text-blue-400">SOCIAL INTEL</h3>
              </div>
              <div className="space-y-3">
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                  <div className="text-green-400 font-bold text-sm mb-1">FRESH REPORT</div>
                  <div className="text-gray-200 text-sm">"Got a nice 6-pointer this morning at first light near the oak ridge"</div>
                  <div className="text-gray-400 text-xs mt-2">Facebook • 2 hours ago</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Regulations */}
        {activeTab === 3 && (
          <div className="p-4 space-y-4 overflow-y-auto h-full">
            <div className="bg-green-600/10 border border-green-600/30 rounded-xl p-4 text-center">
              <div className="text-green-400 font-bold text-2xl mb-2">SEASON OPEN</div>
              <div className="text-gray-300 text-lg">23 days remaining</div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4">
              <h3 className="font-bold text-red-400 mb-4">HUNTING REGULATIONS</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-300">Bag Limit</span>
                  <span className="text-blue-400 font-bold">
                    {selectedGameType === 'big-game' ? '1 buck, 2 doe' : '6 daily'}
                  </span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-700">
                  <span className="text-gray-300">Legal Hours</span>
                  <span className="text-purple-400 font-bold">6:05 AM - 6:47 PM</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-300">License Required</span>
                  <span className="text-yellow-400 font-bold">Valid + Tags</span>
                </div>
              </div>
            </div>

            <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 text-center">
              <div className="flex items-center justify-center space-x-2 mb-4">
                <Calendar className="w-5 h-5 text-purple-400" />
                <h3 className="font-bold text-purple-400">MOON PHASE</h3>
              </div>
              <div className="text-6xl mb-3">🌗</div>
              <div className="text-white font-bold text-lg mb-1">Last Quarter</div>
              <div className="text-gray-400 mb-4">68% illuminated</div>

              <div className="space-y-2">
                <div className="bg-green-600/10 border border-green-600/30 rounded-lg p-3">
                  <div className="text-green-400 font-bold text-sm mb-1">MAJOR PERIODS</div>
                  <div className="text-gray-200 text-sm">5:30 AM - 7:30 AM</div>
                  <div className="text-gray-200 text-sm">5:30 PM - 7:30 PM</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Footer */}
      <div className="bg-gray-800 border-t border-gray-700 px-4 py-3 flex-shrink-0">
        <div className="text-center">
          <p className="text-xs text-gray-500">Hunt Wet AI • Learning {locationName} patterns</p>
        </div>
      </div>
    </div>
  )
}