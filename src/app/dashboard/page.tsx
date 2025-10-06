'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DataMetric from '@/components/DataMetric'
import TimelineMetric from '@/components/TimelineMetric'
import MoonPhase from '@/components/MoonPhase'
import SunMoonTimes from '@/components/SunMoonTimes'
import WindCompass from '@/components/WindCompass'

interface WeatherDay {
  date: string
  temp_max: number
  temp_min: number
  conditions: string
  description: string
  hours: any[]
}

export default function DashboardPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'weather' | 'log' | 'hunts' | 'chat'>('weather')
  const [chatMessage, setChatMessage] = useState('')
  const [chatHistory, setChatHistory] = useState<{role: string, content: string}[]>([])
  const [chatLoading, setChatLoading] = useState(false)
  const [weather, setWeather] = useState<WeatherDay[]>([])
  const [historicalWeather, setHistoricalWeather] = useState<WeatherDay[]>([])
  const [forecastWeather, setForecastWeather] = useState<WeatherDay[]>([])
  const [currentWeather, setCurrentWeather] = useState<any>(null)
  const [hunts, setHunts] = useState<any[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [showLogForm, setShowLogForm] = useState(false)
  const [location, setLocation] = useState({ lat: 39.4, lon: -76.6, name: 'Baltimore, MD' })

  // Form state
  const [formData, setFormData] = useState({
    hunt_date: new Date().toISOString().split('T')[0],
    hunt_time: '06:30:00',
    location_name: location.name,
    latitude: location.lat.toString(),
    longitude: location.lon.toString(),
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
    loadWeather()
    loadHistoricalWeather()
    loadForecastWeather()
    loadHunts()
  }, [])

  const loadWeather = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/test-visual-crossing?type=forecast&lat=${location.lat}&lon=${location.lon}&days=7`)
      const data = await res.json()
      console.log('Weather data:', data)
      if (data.success) {
        setWeather(data.data)
        if (data.data[0]?.hours) {
          const now = new Date().getHours()
          setCurrentWeather(data.data[0].hours[now] || data.data[0].hours[0])
        }
      } else {
        console.error('Weather API returned error:', data)
      }
    } catch (error) {
      console.error('Weather load error:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadHistoricalWeather = async () => {
    try {
      const endDate = new Date()
      endDate.setDate(endDate.getDate() - 1)
      const startDate = new Date(endDate)
      startDate.setDate(startDate.getDate() - 30)

      const res = await fetch(`/api/test-visual-crossing?type=historical&lat=${location.lat}&lon=${location.lon}&startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`)
      const data = await res.json()
      if (data.success) {
        setHistoricalWeather(data.data)
      }
    } catch (error) {
      console.error('Historical weather load error:', error)
    }
  }

  const loadForecastWeather = async () => {
    try {
      const res = await fetch(`/api/test-visual-crossing?type=forecast&lat=${location.lat}&lon=${location.lon}&days=7`)
      const data = await res.json()
      if (data.success) {
        setForecastWeather(data.data)
      }
    } catch (error) {
      console.error('Forecast weather load error:', error)
    }
  }

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

  const handleLogHunt = async (e: React.FormEvent) => {
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
        alert('Hunt logged with full environmental data!')
        setShowLogForm(false)
        loadHunts()
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert('Failed to log hunt')
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    localStorage.removeItem('hunt_wet_auth')
    router.push('/')
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold">Hunt Wet</h1>
              <p className="text-sm text-gray-400">One click. All data. Always learning.</p>
            </div>
            <button onClick={logout} className="px-4 py-2 text-sm bg-gray-800 hover:bg-gray-700 rounded">
              Logout
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('weather')}
              className={`px-4 py-2 font-medium rounded-t ${activeTab === 'weather' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Weather
            </button>
            <button
              onClick={() => setActiveTab('log')}
              className={`px-4 py-2 font-medium rounded-t ${activeTab === 'log' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              Log Hunt
            </button>
            <button
              onClick={() => setActiveTab('hunts')}
              className={`px-4 py-2 font-medium rounded-t ${activeTab === 'hunts' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              My Hunts {hunts.length > 0 && `(${hunts.length})`}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* WEATHER TAB */}
        {activeTab === 'weather' && (
          <div className="space-y-6">
            {/* Loading State */}
            {loading && weather.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-gray-400">Loading weather data...</div>
              </div>
            )}

            {/* Error State */}
            {!loading && weather.length === 0 && (
              <div className="bg-gray-800 rounded-lg p-12 border border-gray-700 text-center">
                <div className="text-red-400 mb-2">No weather data loaded</div>
                <button onClick={loadWeather} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                  Retry
                </button>
              </div>
            )}

            {/* KEY HUNTING INDICATORS */}
            {currentWeather && weather.length > 0 && (
              <div className="grid grid-cols-3 gap-1 mb-4">
                {/* Moon Phase */}
                {weather[0]?.hours?.[0]?.moonphase !== undefined && (
                  <div className="bg-gray-900 border border-gray-700 p-4 flex justify-center">
                    <MoonPhase phase={weather[0].hours[0].moonphase} size="large" />
                  </div>
                )}

                {/* Sun Times */}
                {currentWeather?.sunrise && currentWeather?.sunset && (
                  <SunMoonTimes
                    sunrise={currentWeather.sunrise}
                    sunset={currentWeather.sunset}
                  />
                )}

                {/* Wind Compass */}
                <WindCompass
                  direction={currentWeather.wind_direction}
                  speed={currentWeather.wind_speed}
                  gust={currentWeather.wind_gust}
                  size="medium"
                />
              </div>
            )}

            {/* TIMELINE VIEW: PAST → NOW → FUTURE */}
            {currentWeather && historicalWeather.length > 0 && forecastWeather.length > 0 && (() => {
              // Format timeline data: historical (30d) + current + forecast (7d)
              const buildTimeline = (field: string) => {
                const historical = historicalWeather.map(d => ({
                  date: d.date,
                  value: d.hours?.[12]?.[field] || 0,
                  isForecast: false
                }))

                const forecast = forecastWeather.slice(1).map(d => ({
                  date: d.date,
                  value: d.hours?.[12]?.[field] || 0,
                  isForecast: true
                }))

                return { historical, forecast }
              }

              return (
                <div className="space-y-1">
                  <div className="bg-gray-800 px-3 py-2 border border-gray-700">
                    <span className="text-xs text-gray-400 font-mono uppercase">TIMELINE: PAST 30 DAYS → NOW → FUTURE 7 DAYS</span>
                  </div>

                  {/* PRESSURE - Most Critical */}
                  <TimelineMetric
                    label="PRESSURE"
                    unit="mb"
                    historicalData={buildTimeline('pressure').historical}
                    currentValue={currentWeather.pressure}
                    forecastData={buildTimeline('pressure').forecast}
                    color="#3B82F6"
                    size="large"
                  />

                  {/* Other key metrics */}
                  <div className="grid grid-cols-2 gap-1">
                    <TimelineMetric
                      label="TEMPERATURE"
                      unit="°F"
                      historicalData={buildTimeline('temperature').historical}
                      currentValue={currentWeather.temperature}
                      forecastData={buildTimeline('temperature').forecast}
                      color="#EF4444"
                      size="medium"
                    />
                    <TimelineMetric
                      label="WIND SPEED"
                      unit="mph"
                      historicalData={buildTimeline('wind_speed').historical}
                      currentValue={currentWeather.wind_speed}
                      forecastData={buildTimeline('wind_speed').forecast}
                      color="#06B6D4"
                      size="medium"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-1">
                    <TimelineMetric
                      label="HUMIDITY"
                      unit="%"
                      historicalData={buildTimeline('humidity').historical}
                      currentValue={currentWeather.humidity}
                      forecastData={buildTimeline('humidity').forecast}
                      color="#10B981"
                      size="small"
                    />
                    <TimelineMetric
                      label="DEW POINT"
                      unit="°F"
                      historicalData={buildTimeline('dew_point').historical}
                      currentValue={currentWeather.dew_point}
                      forecastData={buildTimeline('dew_point').forecast}
                      color="#F97316"
                      size="small"
                    />
                  </div>
                </div>
              )
            })()}

            {/* Data Terminal */}
            {currentWeather && weather.length > 0 && historicalWeather.length > 0 && (() => {
              // Calculate averages
              const calc7d = (field: string) => {
                const vals = historicalWeather.slice(-7).map(d => d.hours?.[12]?.[field]).filter(Boolean)
                return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
              }
              const calc30d = (field: string) => {
                const vals = historicalWeather.map(d => d.hours?.[12]?.[field]).filter(Boolean)
                return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0
              }

              return (
                <div className="mt-4 grid grid-cols-4 gap-1">
                  <div className="col-span-2 row-span-2">
                    <DataMetric
                      label="PRESSURE"
                      current={currentWeather.pressure}
                      unit="mb"
                      data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.pressure })) || []}
                      avg7d={calc7d('pressure')}
                      avg30d={calc30d('pressure')}
                      size="large"
                      color="#3B82F6"
                    />
                  </div>
                  <DataMetric label="TEMPERATURE" current={currentWeather.temperature} unit="°F" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.temperature })) || []} avg7d={calc7d('temperature')} avg30d={calc30d('temperature')} size="medium" color="#EF4444" />
                  <DataMetric label="HUMIDITY" current={currentWeather.humidity} unit="%" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.humidity })) || []} avg7d={calc7d('humidity')} avg30d={calc30d('humidity')} size="medium" color="#10B981" />
                  <DataMetric label="WIND SPEED" current={currentWeather.wind_speed} unit="mph" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.wind_speed })) || []} avg7d={calc7d('wind_speed')} avg30d={calc30d('wind_speed')} size="medium" color="#06B6D4" />
                  <DataMetric label="DEW POINT" current={currentWeather.dew_point} unit="°F" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.dew_point })) || []} avg7d={calc7d('dew_point')} avg30d={calc30d('dew_point')} size="medium" color="#F97316" />
                  <DataMetric label="CLOUD COVER" current={currentWeather.cloud_cover} unit="%" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.cloud_cover })) || []} avg7d={calc7d('cloud_cover')} avg30d={calc30d('cloud_cover')} size="small" color="#9CA3AF" />
                  <DataMetric label="VISIBILITY" current={currentWeather.visibility} unit="mi" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.visibility })) || []} avg7d={calc7d('visibility')} avg30d={calc30d('visibility')} size="small" color="#6366F1" />
                  <DataMetric label="UV INDEX" current={currentWeather.uv_index} unit="" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.uv_index })) || []} avg7d={calc7d('uv_index')} avg30d={calc30d('uv_index')} size="small" color="#F59E0B" />
                  <DataMetric label="WIND GUST" current={currentWeather.wind_gust} unit="mph" data24h={weather[0]?.hours.map((h: any) => ({ x: h.datetime.slice(0,5), value: h.wind_gust })) || []} avg7d={calc7d('wind_gust')} avg30d={calc30d('wind_gust')} size="small" color="#06B6D4" />
                </div>
              )
            })()}

            {/* Old content - keep for now */}
            {currentWeather && weather.length > 0 && false && (
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-sm text-gray-400 mb-1">{location.name}</h2>
                    <div className="text-6xl font-bold mb-2">{currentWeather.temperature}°</div>
                    <div className="text-lg text-gray-300">{currentWeather.conditions}</div>
                    <div className="text-sm text-gray-400">Feels like {currentWeather.feels_like}°</div>
                  </div>
                  <div className="text-right space-y-2">
                    <div>
                      <div className="text-sm text-gray-400">Pressure</div>
                      <div className="text-xl font-bold">{currentWeather.pressure}mb</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-400">Humidity</div>
                      <div className="text-lg">{currentWeather.humidity}%</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Wind</div>
                    <div className="font-medium">{currentWeather.wind_speed} mph {currentWeather.wind_direction_cardinal}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Dew Point</div>
                    <div className="font-medium">{currentWeather.dew_point}°</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Visibility</div>
                    <div className="font-medium">{currentWeather.visibility} mi</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-400 mb-1">Cloud Cover</div>
                    <div className="font-medium">{currentWeather.cloud_cover}%</div>
                  </div>
                </div>
              </div>
            )}

            {/* 7-Day Forecast */}
            <div>
              <h3 className="text-lg font-bold mb-4">7-Day Forecast</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {weather.map((day, idx) => (
                  <div key={idx} className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors">
                    <div className="text-sm text-gray-400 mb-2">
                      {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                    <div className="flex justify-between items-center mb-3">
                      <div className="text-3xl font-bold">{Math.round(day.temp_max)}°</div>
                      <div className="text-lg text-gray-400">{Math.round(day.temp_min)}°</div>
                    </div>
                    <div className="text-sm text-gray-300 mb-3">{day.conditions}</div>
                    {day.hours && day.hours[12] && (
                      <div className="space-y-1 text-xs text-gray-400 pt-3 border-t border-gray-700">
                        <div className="flex justify-between">
                          <span>Pressure:</span>
                          <span className="text-gray-300">{day.hours[12].pressure}mb</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Wind:</span>
                          <span className="text-gray-300">{day.hours[12].wind_speed}mph {day.hours[12].wind_direction_cardinal}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Humidity:</span>
                          <span className="text-gray-300">{day.hours[12].humidity}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* LOG HUNT TAB */}
        {activeTab === 'log' && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">Log Hunt</h2>
            <form onSubmit={handleLogHunt} className="bg-gray-800 p-6 rounded-lg border border-gray-700 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Date</label>
                  <input type="date" value={formData.hunt_date} onChange={e => setFormData({...formData, hunt_date: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Time</label>
                  <input type="time" value={formData.hunt_time.slice(0,5)} onChange={e => setFormData({...formData, hunt_time: e.target.value + ':00'})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-300">Location</label>
                <input type="text" value={formData.location_name} onChange={e => setFormData({...formData, location_name: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Latitude</label>
                  <input type="number" step="0.000001" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required />
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Longitude</label>
                  <input type="number" step="0.000001" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" required />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Species</label>
                  <select value={formData.species} onChange={e => setFormData({...formData, species: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="deer">Deer</option>
                    <option value="duck">Duck</option>
                    <option value="turkey">Turkey</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Outcome</label>
                  <select value={formData.outcome} onChange={e => setFormData({...formData, outcome: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white">
                    <option value="success">Success</option>
                    <option value="failure">Failure</option>
                    <option value="scouting">Scouting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm mb-1 text-gray-300">Animals Killed</label>
                  <input type="number" value={formData.animals_killed} onChange={e => setFormData({...formData, animals_killed: e.target.value as any})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white" />
                </div>
              </div>

              <div>
                <label className="block text-sm mb-1 text-gray-300">Notes</label>
                <textarea value={formData.user_notes} onChange={e => setFormData({...formData, user_notes: e.target.value})} className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white h-24" />
              </div>

              <button type="submit" disabled={loading} className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded font-medium disabled:opacity-50 transition-colors">
                {loading ? 'Logging Hunt + Fetching Weather...' : 'Log Hunt (Captures 40+ Data Points)'}
              </button>
            </form>
          </div>
        )}

        {/* MY HUNTS TAB */}
        {activeTab === 'hunts' && (
          <div>
            {stats && (
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-3xl font-bold">{stats.total_hunts}</div>
                  <div className="text-sm text-gray-400">Total Hunts</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-3xl font-bold">{stats.successful_hunts}</div>
                  <div className="text-sm text-gray-400">Successful</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-3xl font-bold">{stats.success_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Success Rate</div>
                </div>
                <div className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                  <div className="text-3xl font-bold">{stats.animals_killed_total}</div>
                  <div className="text-sm text-gray-400">Total Kills</div>
                </div>
              </div>
            )}

            <div className="space-y-4">
              <h2 className="text-2xl font-bold">Hunt History</h2>
              {hunts.length === 0 ? (
                <div className="bg-gray-800 p-12 rounded-lg border border-gray-700 text-center">
                  <p className="text-gray-400 mb-4">No hunts logged yet</p>
                  <button onClick={() => setActiveTab('log')} className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded">
                    Log Your First Hunt
                  </button>
                </div>
              ) : (
                hunts.map((hunt, idx) => (
                  <div key={idx} className="bg-gray-800 p-4 rounded-lg border border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="font-bold text-lg">{hunt.hunt_date} at {hunt.hunt_time}</div>
                        <div className="text-sm text-gray-400">{hunt.location_name}</div>
                      </div>
                      <div className={`px-3 py-1 rounded text-sm ${hunt.outcome === 'success' ? 'bg-green-900/30 text-green-400 border border-green-700' : 'bg-gray-700 text-gray-300'}`}>
                        {hunt.outcome}
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Temp:</span> <span className="text-white">{hunt.temperature}°F</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Pressure:</span> <span className="text-white">{hunt.barometric_pressure}mb</span> <span className="text-xs text-gray-500">({hunt.pressure_trend})</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Wind:</span> <span className="text-white">{hunt.wind_speed}mph {hunt.wind_direction}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Moon:</span> <span className="text-white">{hunt.moon_phase} ({hunt.moon_illumination}%)</span>
                      </div>
                    </div>
                    {hunt.user_notes && (
                      <div className="mt-3 text-sm text-gray-300 pt-3 border-t border-gray-700">{hunt.user_notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
