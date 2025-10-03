'use client'

import { useState } from 'react'
import { CheckCircle, XCircle, Clock, Star } from 'lucide-react'

interface OutcomeTrackerProps {
  sessionId: string
  onOutcomeLogged: () => void
}

/**
 * Outcome Tracker Component - THE LEARNING FLYWHEEL
 *
 * This is the critical component that makes Hunt Wet AI smarter over time.
 * Every success/failure report from hunters in a specific ZIP code teaches
 * the AI what works and what doesn't work in that local area.
 *
 * THE FLYWHEEL:
 * 1. AI gives hunting advice for specific ZIP
 * 2. Hunter reports success/failure with details
 * 3. AI learns local patterns for that ZIP
 * 4. Next hunter gets better predictions
 * 5. More accurate advice → more hunters → more data → better predictions
 *
 * This creates a competitive moat - the more hunters use Hunt Wet in an area,
 * the smarter it gets about that specific location's hunting patterns.
 */
export default function OutcomeTracker({ sessionId, onOutcomeLogged }: OutcomeTrackerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [outcome, setOutcome] = useState<'success' | 'failure' | 'partial' | null>(null)
  const [details, setDetails] = useState('')
  const [gameType, setGameType] = useState('')
  const [huntDate, setHuntDate] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async () => {
    if (!outcome) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/log-outcome', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          outcome,
          details,
          gameType,
          huntDate
        }),
      })

      const data = await response.json()

      if (data.success) {
        setIsOpen(false)
        onOutcomeLogged()
        // Reset form
        setOutcome(null)
        setDetails('')
        setGameType('')
        setHuntDate('')
      } else {
        console.error('Failed to log outcome:', data.error)
      }
    } catch (error) {
      console.error('Error logging outcome:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="mt-4 p-3 bg-blue-50 rounded-lg border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Did this advice help your hunt?
            </span>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="text-xs bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
          >
            Log Outcome
          </button>
        </div>
        <p className="text-xs text-blue-700 mt-1">
          Help the AI learn by sharing your hunting results
        </p>
      </div>
    )
  }

  return (
    <div className="mt-4 p-4 bg-white rounded-lg border-2 border-blue-200">
      <div className="flex items-center space-x-2 mb-4">
        <Star className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">How did your hunt go?</h3>
      </div>

      {/* Outcome Selection */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <button
          onClick={() => setOutcome('success')}
          className={`p-3 rounded-lg border-2 transition-all ${
            outcome === 'success'
              ? 'border-green-500 bg-green-50'
              : 'border-gray-200 hover:border-green-300'
          }`}
        >
          <CheckCircle className={`w-6 h-6 mx-auto mb-1 ${
            outcome === 'success' ? 'text-green-600' : 'text-gray-400'
          }`} />
          <div className="text-sm font-medium">Success</div>
          <div className="text-xs text-gray-500">Got game!</div>
        </button>

        <button
          onClick={() => setOutcome('partial')}
          className={`p-3 rounded-lg border-2 transition-all ${
            outcome === 'partial'
              ? 'border-yellow-500 bg-yellow-50'
              : 'border-gray-200 hover:border-yellow-300'
          }`}
        >
          <Clock className={`w-6 h-6 mx-auto mb-1 ${
            outcome === 'partial' ? 'text-yellow-600' : 'text-gray-400'
          }`} />
          <div className="text-sm font-medium">Partial</div>
          <div className="text-xs text-gray-500">Saw game</div>
        </button>

        <button
          onClick={() => setOutcome('failure')}
          className={`p-3 rounded-lg border-2 transition-all ${
            outcome === 'failure'
              ? 'border-red-500 bg-red-50'
              : 'border-gray-200 hover:border-red-300'
          }`}
        >
          <XCircle className={`w-6 h-6 mx-auto mb-1 ${
            outcome === 'failure' ? 'text-red-600' : 'text-gray-400'
          }`} />
          <div className="text-sm font-medium">No Luck</div>
          <div className="text-xs text-gray-500">No game</div>
        </button>
      </div>

      {/* Details Form */}
      {outcome && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What did you hunt?
            </label>
            <input
              type="text"
              value={gameType}
              onChange={(e) => setGameType(e.target.value)}
              placeholder="e.g., Whitetail deer, Duck, Elk"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Hunt Date
            </label>
            <input
              type="date"
              value={huntDate}
              onChange={(e) => setHuntDate(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              What happened? (Optional)
            </label>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="e.g., Shot a 6-point buck at 7:15am exactly when AI predicted peak activity"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSubmit}
              disabled={isLoading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
            >
              {isLoading ? 'Logging...' : 'Submit'}
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}