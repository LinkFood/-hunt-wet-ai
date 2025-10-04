'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin } from 'lucide-react'
import { trackLocationSearch } from '@/lib/supabase-setup'

// Location model: lat/lon primary
interface HuntLocation {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

export default function Home() {
  const [location, setLocation] = useState<HuntLocation | null>(null)
  const [selectedGameType, setSelectedGameType] = useState<string | null>(null)
  const [zipInput, setZipInput] = useState('')
  const [gpsLoading, setGpsLoading] = useState(false)
  const router = useRouter()

  // Load saved location
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

    // DATA COLLECTION: Track location search
    try {
      await trackLocationSearch({
        latitude: location.lat,
        longitude: location.lon,
        display_name: location.displayName,
        display_zip: location.displayZip
      })
    } catch (error) {
      console.error('Failed to track location:', error)
    }
  }

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const zip = zipInput.trim()
    if (!zip) return

    try {
      // Convert ZIP to lat/lon
      const apiKey = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || ''
      const response = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${apiKey}`
      )
      const data = await response.json()

      if (data.lat && data.lon) {
        const newLocation: HuntLocation = {
          lat: data.lat,
          lon: data.lon,
          displayName: data.name || `ZIP ${zip}`,
          displayZip: zip
        }
        handleLocationSubmission(newLocation)
      }
    } catch (error) {
      console.error('Error geocoding ZIP:', error)
      alert('Could not find that ZIP code. Please try again.')
    }
  }

  const handleGPSLocation = () => {
    if (!navigator.geolocation) {
      alert('Location services not available')
      return
    }

    setGpsLoading(true)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        try {
          // Reverse geocode with Nominatim
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`,
            {
              headers: { 'User-Agent': 'HuntWetAI/1.0' }
            }
          )
          const geocodeData = await geocodeResponse.json()

          if (geocodeData?.address) {
            const address = geocodeData.address
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
          }
        } catch (error) {
          console.error('Error getting location:', error)
          alert('Could not get your location. Please enter ZIP code instead.')
        } finally {
          setGpsLoading(false)
        }
      },
      (error) => {
        console.error('GPS error:', error)
        alert('Location access denied. Please enter your ZIP code instead.')
        setGpsLoading(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    )
  }

  // LOCATION ENTRY PAGE (Page 2 from PDF)
  if (!location) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="w-full max-w-2xl text-center">
          {/* Branding */}
          <div className="mb-12">
            <h1 className="text-6xl font-bold text-gray-900 mb-4">Hunt Wet</h1>
            <p className="text-2xl text-gray-500">tech + data = Hunt</p>
          </div>

          {/* Call to action */}
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              enter zip to hunt like never before
            </h2>
          </div>

          {/* GPS Button */}
          <button
            onClick={handleGPSLocation}
            disabled={gpsLoading}
            className="w-full mb-6 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xl py-6 px-8 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
          >
            <MapPin className="w-6 h-6" />
            <span>{gpsLoading ? 'Getting location...' : 'Use My Current Location'}</span>
          </button>

          <div className="text-gray-400 text-lg mb-6">or</div>

          {/* ZIP Input */}
          <form onSubmit={handleZipSubmit} className="space-y-4">
            <input
              type="text"
              value={zipInput}
              onChange={(e) => setZipInput(e.target.value)}
              className="w-full px-6 py-5 bg-white border-2 border-gray-300 text-gray-900 text-xl rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 placeholder-gray-400 text-center"
              placeholder="Enter ZIP code"
              pattern="[0-9]{5}"
              maxLength={5}
              required
            />
            <button
              type="submit"
              className="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold text-xl py-5 px-6 rounded-2xl transition-all"
            >
              Get Hunting Intel
            </button>
          </form>
        </div>
      </div>
    )
  }

  // MAIN INFO HUB PAGE (Page 3 from PDF)
  // Will redirect to /hub when location is set
  router.push('/hub')
  return null
}
