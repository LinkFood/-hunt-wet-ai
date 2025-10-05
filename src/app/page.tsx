'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    // Check password (stored in localStorage for now)
    if (password === 'huntseason2024') {
      localStorage.setItem('hunt_wet_auth', 'true')
      router.push('/dashboard')
    } else {
      setError('Wrong password')
      setPassword('')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-900 via-green-800 to-green-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2">🦌 Hunt Wet AI</h1>
          <p className="text-green-200 text-lg">Personal Hunting Intelligence</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 shadow-2xl border border-white/20">
          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-green-100 text-sm font-medium mb-2">
                Enter Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-green-300/50 focus:outline-none focus:ring-2 focus:ring-green-400"
                placeholder="Password"
                autoFocus
              />
              {error && (
                <p className="text-red-300 text-sm mt-2">{error}</p>
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-4 rounded-lg transition-colors duration-200"
            >
              Enter
            </button>
          </form>

          <div className="mt-6 text-center text-green-200 text-sm">
            <p>Track hunts • Analyze patterns • Smart alerts</p>
          </div>
        </div>

        <div className="mt-8 text-center text-green-300/60 text-xs">
          <p>Version 2.0 • Phase 1: Foundation</p>
        </div>
      </div>
    </div>
  )
}
