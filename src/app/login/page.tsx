'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Target } from 'lucide-react'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      })

      if (response.ok) {
        // Set auth cookie and redirect
        document.cookie = `hunt-wet-auth=${password}; path=/; max-age=2592000; secure; samesite=strict`

        // Clear any existing location data to force ZIP onboarding for new session
        localStorage.removeItem('huntWet_zipCode')
        localStorage.removeItem('huntWet_gameType')

        router.push('/')
      } else {
        setError('Invalid access code')
      }
    } catch (error) {
      setError('Login failed - try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-6">
            <Target className="w-16 h-16 text-orange-400" />
          </div>
          <h1 className="text-3xl font-bold text-gray-100 mb-2">Hunt Wet AI</h1>
          <p className="text-gray-400">Private Access Required</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Access Code
              </label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Enter hunting crew access code"
                required
              />
            </div>

            {error && (
              <div className="bg-red-600/10 border border-red-600/30 rounded-lg p-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-800 text-white font-medium py-3 px-6 rounded-xl transition-colors flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Checking access...</span>
                </>
              ) : (
                <span>Enter Hunt Wet AI</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-800">
            <p className="text-xs text-gray-500 text-center">
              🎯 Private hunting intelligence platform<br/>
              Contact admin for access code
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}