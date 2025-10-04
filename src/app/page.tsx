'use client'

import { useState, useEffect } from 'react'
import { Target, Cloud, Activity, Calendar, MapPin, MessageSquare } from 'lucide-react'
import HuntingChat from '@/components/HuntingChat'
import InformationHub from '@/components/InformationHub'
import AIIntelSummary from '@/components/AIIntelSummary'
import { getQuickLocationName } from '@/lib/geocoding'
import { trackLocationSearch } from '@/lib/supabase-setup'

// Location model: lat/lon primary, ZIP/city for display
interface HuntLocation {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

export default function Home() {
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null)
  const [location, setLocation] = useState<HuntLocation | null>(null)

  // Load saved data on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('huntWet_location')
    const savedGame = localStorage.getItem('huntWet_gameType')
    if (savedLocation) {
      try {
        const parsedLocation = JSON.parse(savedLocation) as HuntLocation
        setLocation(parsedLocation)
        setSelectedGameType(savedGame || 'big-game')
      } catch (error) {
        console.error('Error parsing saved location:', error)
        localStorage.removeItem('huntWet_location')
      }
    }
  }, [])

  const handleLocationSubmission = async (location: HuntLocation, gameType?: string) => {
    setLocation(location)
    localStorage.setItem('huntWet_location', JSON.stringify(location))

    const finalGameType = gameType || 'big-game'
    setSelectedGameType(finalGameType)
    localStorage.setItem('huntWet_gameType', finalGameType)

    // DATA COLLECTION: Track every location search
    try {
      await trackLocationSearch({
        latitude: location.lat,
        longitude: location.lon,
        display_name: location.displayName,
        display_zip: location.displayZip
      })
    } catch (error) {
      console.error('Failed to track location search:', error)
      // Don't block user experience if tracking fails
    }
  }

  // Legacy ZIP submission handler (converts ZIP to lat/lon)
  const handleZipCodeSubmission = async (zip: string, gameType?: string) => {
    try {
      // Convert ZIP to lat/lon using geocoding
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${apiKey}`
      )
      const data = await response.json()

      if (data.lat && data.lon) {
        const newLocation: HuntLocation = {
          lat: data.lat,
          lon: data.lon,
          displayName: data.name || getQuickLocationName(zip),
          displayZip: zip
        }
        handleLocationSubmission(newLocation, gameType)
      } else {
        console.error('Could not geocode ZIP:', zip)
      }
    } catch (error) {
      console.error('Error geocoding ZIP:', error)
    }
  }

  const handleGameTypeChange = (gameType: string) => {
    setSelectedGameType(gameType)
    localStorage.setItem('huntWet_gameType', gameType)
  }

  // Auto-detect GPS location
  const [gpsStatus, setGpsStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      console.error('Geolocation not supported')
      alert('Your browser does not support location services. Please enter your ZIP code instead.')
      setGpsStatus('error')
      return
    }

    setGpsStatus('loading')
    console.log('Requesting location permission...')

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        console.log('Location permission granted:', position.coords)
        const { latitude, longitude } = position.coords
        try {
          // Use OpenStreetMap Nominatim to get location details
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'HuntWetAI/1.0'
              }
            }
          )
          const geocodeData = await geocodeResponse.json()

          if (geocodeData?.address) {
            const address = geocodeData.address
            // Extract ZIP and create location object
            const zip = address.postcode?.split('-')[0] || ''
            const city = address.city || address.town || address.village || ''
            const state = address.state || ''

            const newLocation: HuntLocation = {
              lat: latitude,
              lon: longitude,
              displayName: city && state ? `${city}, ${state}` : geocodeData.display_name,
              displayZip: zip
            }

            handleLocationSubmission(newLocation)
            setGpsStatus('idle')
          } else {
            setGpsStatus('error')
          }
        } catch (error) {
          console.error('Error getting location from GPS:', error)
          setGpsStatus('error')
        }
      },
      (error) => {
        console.error('GPS error:', error)

        // Show user-friendly error message
        let errorMessage = 'Could not get your location. '
        if (error.code === 1) {
          errorMessage += 'You denied location access. Please enter your ZIP code instead.'
        } else if (error.code === 2) {
          errorMessage += 'Location unavailable. Please enter your ZIP code instead.'
        } else if (error.code === 3) {
          errorMessage += 'Request timed out. Please enter your ZIP code instead.'
        }

        alert(errorMessage)
        setGpsStatus('error')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  if (!location) {
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
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Header - Compact */}
      <header className="bg-gray-900/80 backdrop-blur border-b border-gray-800 px-4 py-3 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className="w-6 h-6 text-orange-400" />
            <div>
              <h1 className="text-lg font-bold text-orange-400">HUNT WET</h1>
              <p className="text-xs text-gray-400">{location.displayName}</p>
            </div>
          </div>
          <button
            onClick={() => {
              localStorage.clear()
              setLocation(null)
            }}
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1.5 rounded-lg text-xs transition-colors"
          >
            Change
          </button>
        </div>
      </header>

      {/* SINGLE PAGE LAYOUT - Everything flows down */}
      <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">

        {/* INFORMATION HUB (Weather, Seasons, Data) */}
        <InformationHub location={location} gameType={selectedGameType} />

        {/* AI INTEL SUMMARY - THE HOOK */}
        <AIIntelSummary location={location} gameType={selectedGameType} />

        {/* CHAT INTERFACE - At the bottom */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-2 mb-4">
            <MessageSquare className="w-5 h-5 text-orange-400" />
            <h2 className="text-lg font-bold text-gray-100">Ask Hunt Wet AI</h2>
          </div>
          <HuntingChat
            hasZipCode={true}
            zipCode={location.displayZip}
            gameType={selectedGameType}
            onZipCodeSubmission={handleZipCodeSubmission}
            onGameTypeChange={handleGameTypeChange}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 border-t border-gray-800 px-4 py-4 mt-12">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-xs text-gray-500">Hunt Wet AI • Mining {location.displayName} hunting patterns</p>
        </div>
      </footer>
    </div>
  )
}