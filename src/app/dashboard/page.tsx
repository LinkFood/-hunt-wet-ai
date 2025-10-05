'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function DashboardPage() {
  const router = useRouter()
  const [hunts, setHunts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    hunt_date: new Date().toISOString().split('T')[0],
    hunt_time: '06:30:00',
    location_name: 'Baltimore, MD',
    latitude: '39.4',
    longitude: '-76.6',
    species: 'deer',
    outcome: 'success',
    animals_seen: 0,
    animals_killed: 0,
    user_notes: '',
    season: 'archery',
    hunting_method: 'stand'
  })

  useEffect(() => {
    const auth = localStorage.getItem('hunt_wet_auth')
    if (!auth) {
      router.push('/')
      return
    }
    loadHunts()
  }, [])

  const loadHunts = async () => {
    try {
      const res = await fetch('/api/log-hunt?user_id=james')
      const data = await res.json()
      if (data.success) {
        setHunts(data.hunts || [])
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Load hunts error:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await fetch('/api/log-hunt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          user_id: 'james',
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          animals_seen: parseInt(formData.animals_seen as any) || 0,
          animals_killed: parseInt(formData.animals_killed as any) || 0
        })
      })

      const data = await res.json()

      if (data.success) {
        alert('Hunt logged successfully with complete environmental data!')
        setShowForm(false)
        loadHunts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to log hunt')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hunt_wet_auth')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">Hunt Wet AI</h1>
            <p className="text-gray-400">Phase 1: Hunt Logging System</p>
          </div>
          <button onClick={logout} className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded">
            Logout
          </button>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold">{stats.total_hunts}</div>
              <div className="text-sm text-gray-400">Total Hunts</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold">{stats.successful_hunts}</div>
              <div className="text-sm text-gray-400">Successful</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold">{stats.success_rate.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">Success Rate</div>
            </div>
            <div className="bg-gray-800 p-4 rounded">
              <div className="text-2xl font-bold">{stats.animals_killed_total}</div>
              <div className="text-sm text-gray-400">Total Kills</div>
            </div>
          </div>
        )}

        {/* Log Hunt Button */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-6 px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium"
        >
          {showForm ? 'Cancel' : '+ Log New Hunt'}
        </button>

        {/* Hunt Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded mb-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input type="date" value={formData.hunt_date} onChange={e => setFormData({...formData, hunt_date: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded" required />
              </div>
              <div>
                <label className="block text-sm mb-1">Time</label>
                <input type="time" value={formData.hunt_time} onChange={e => setFormData({...formData, hunt_time: e.target.value + ':00'})} className="w-full px-3 py-2 bg-gray-700 rounded" required />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Location</label>
              <input type="text" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Latitude</label>
                <input type="number" step="0.000001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded" required />
              </div>
              <div>
                <label className="block text-sm mb-1">Longitude</label>
                <input type="number" step="0.000001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded" required />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Species</label>
                <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded">
                  <option value="deer">Deer</option>
                  <option value="duck">Duck</option>
                  <option value="turkey">Turkey</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Outcome</label>
                <select value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded">
                  <option value="success">Success</option>
                  <option value="failure">Failure</option>
                  <option value="scouting">Scouting</option>
                </select>
              </div>
              <div>
                <label className="block text-sm mb-1">Animals Killed</label>
                <input type="number" value={formData.animals_killed} onChange={e => setFormData({...formData, animals_killed: e.target.value as any})} className="w-full px-3 py-2 bg-gray-700 rounded" />
              </div>
            </div>

            <div>
              <label className="block text-sm mb-1">Notes</label>
              <textarea value={formData.user_notes} onChange={e => setFormData({...formData, user_notes: e.target.value})} className="w-full px-3 py-2 bg-gray-700 rounded h-20" />
            </div>

            <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 rounded font-medium disabled:opacity-50">
              {loading ? 'Logging Hunt + Fetching Weather...' : 'Log Hunt (Will Capture 40+ Data Points)'}
            </button>
          </form>
        )}

        {/* Hunt History */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold">Hunt History</h2>
          {hunts.length === 0 ? (
            <div className="bg-gray-800 p-8 rounded text-center text-gray-400">
              No hunts logged yet. Log your first hunt above!
            </div>
          ) : (
            hunts.map((hunt, idx) => (
              <div key={idx} className="bg-gray-800 p-4 rounded">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="font-bold">{hunt.hunt_date} at {hunt.hunt_time}</div>
                    <div className="text-sm text-gray-400">{hunt.location_name}</div>
                  </div>
                  <div className={`px-3 py-1 rounded text-sm ${hunt.outcome === 'success' ? 'bg-green-600' : 'bg-gray-700'}`}>
                    {hunt.outcome}
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">Temp:</span> {hunt.temperature}°F
                  </div>
                  <div>
                    <span className="text-gray-400">Pressure:</span> {hunt.barometric_pressure}mb ({hunt.pressure_trend})
                  </div>
                  <div>
                    <span className="text-gray-400">Wind:</span> {hunt.wind_speed}mph {hunt.wind_direction}
                  </div>
                  <div>
                    <span className="text-gray-400">Moon:</span> {hunt.moon_phase} ({hunt.moon_illumination}%)
                  </div>
                </div>
                {hunt.user_notes && (
                  <div className="mt-2 text-sm text-gray-400">{hunt.user_notes}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
