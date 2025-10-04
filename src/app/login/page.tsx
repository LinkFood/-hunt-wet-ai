'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

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
        // Set auth cookie
        document.cookie = `hunt-wet-auth=${password}; path=/; max-age=2592000; secure; samesite=strict`

        // Clear location data to force location entry
        localStorage.removeItem('huntWet_location')
        localStorage.removeItem('huntWet_gameType')

        router.push('/')
      } else {
        setError('Invalid password')
      }
    } catch (error) {
      setError('Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        {/* Minimal branding */}
        <div className="mb-16">
          <h1 className="text-7xl font-bold text-gray-900 mb-4">Hunt Wet</h1>
          <p className="text-2xl text-gray-500">tech + data = Hunt</p>
        </div>

        {/* Clean password form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-5 bg-white border-2 border-gray-300 text-gray-900 text-lg rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 placeholder-gray-400 text-center"
            placeholder="password"
            required
            autoFocus
          />

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gray-900 hover:bg-gray-800 text-white font-medium text-lg py-5 px-6 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Checking...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  )
}
