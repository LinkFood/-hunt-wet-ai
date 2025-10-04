'use client'

import { useState, useEffect } from 'react'
import { Sparkles, TrendingUp, Clock, Target, AlertCircle } from 'lucide-react'

interface Location {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

interface AIIntelSummaryProps {
  location: Location
  gameType: string | null
}

export default function AIIntelSummary({ location, gameType }: AIIntelSummaryProps) {
  const [intel, setIntel] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    generateIntel()
  }, [location, gameType])

  const generateIntel = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/hunting-intel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: {
            lat: location.lat,
            lon: location.lon,
            displayName: location.displayName,
            zip: location.displayZip
          },
          gameType: gameType || 'big-game'
        })
      })

      const data = await response.json()

      if (data.success && data.intel) {
        setIntel(data.intel)
      } else {
        setError('Could not generate intel')
      }
    } catch (err) {
      console.error('Intel generation error:', err)
      setError('Failed to load intel')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-orange-600/20 via-purple-600/20 to-orange-600/20 border-2 border-orange-500/50 rounded-xl p-8">
        <div className="flex items-center justify-center space-x-3">
          <div className="w-6 h-6 border-3 border-orange-400 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-lg font-bold text-orange-400">Analyzing {location.displayName}...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-600/10 border border-red-600/30 rounded-xl p-6">
        <div className="flex items-center space-x-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <span className="font-bold">{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-br from-orange-600/30 via-purple-600/20 to-orange-600/30 border-2 border-orange-500 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center space-x-2 mb-4">
        <Sparkles className="w-6 h-6 text-orange-400" />
        <h2 className="text-xl font-bold text-orange-400">AI Hunting Intel</h2>
        <div className="flex-1"></div>
        <div className="text-xs bg-orange-600/30 text-orange-300 px-3 py-1 rounded-full font-bold">
          AUTO-GENERATED
        </div>
      </div>

      {/* Intel Content */}
      <div className="prose prose-invert max-w-none">
        <div className="text-gray-100 text-base leading-relaxed whitespace-pre-wrap">
          {intel}
        </div>
      </div>

      {/* Footer hint */}
      <div className="mt-6 pt-4 border-t border-orange-500/30">
        <div className="flex items-center space-x-2 text-sm text-gray-400">
          <Target className="w-4 h-4 text-orange-400" />
          <span>Want more details? Use the chat below to ask specific questions.</span>
        </div>
      </div>
    </div>
  )
}
