'use client'

interface SunMoonTimesProps {
  sunrise: string // "HH:MM:SS"
  sunset: string // "HH:MM:SS"
  currentTime?: Date
  forecastSunrise?: string[] // Next 7 days sunrise times for trend
  forecastSunset?: string[] // Next 7 days sunset times for trend
}

export default function SunMoonTimes({ sunrise, sunset, forecastSunrise, forecastSunset, currentTime = new Date() }: SunMoonTimesProps) {
  // Convert times to display format
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
    return `${displayHour}:${minutes} ${ampm}`
  }

  // Calculate minutes until sunrise/sunset
  const calculateMinutesUntil = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number)
    const targetMinutes = hours * 60 + minutes
    const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
    return targetMinutes - currentMinutes
  }

  const minutesUntilSunrise = calculateMinutesUntil(sunrise)
  const minutesUntilSunset = calculateMinutesUntil(sunset)

  const isDaylight = minutesUntilSunrise < 0 && minutesUntilSunset > 0

  // Calculate total daylight hours
  const timeToMinutes = (time: string) => {
    const [h, m] = time.split(':').map(Number)
    return h * 60 + m
  }

  const daylightMinutes = timeToMinutes(sunset) - timeToMinutes(sunrise)
  const daylightHours = Math.floor(daylightMinutes / 60)
  const daylightMins = daylightMinutes % 60

  // Calculate daylight trend (are days getting longer or shorter?)
  const calculateDaylightTrend = () => {
    if (!forecastSunrise || !forecastSunset || forecastSunrise.length < 2 || forecastSunset.length < 2) {
      return null
    }

    const tomorrow = timeToMinutes(forecastSunset[1]) - timeToMinutes(forecastSunrise[1])
    const change = tomorrow - daylightMinutes

    return {
      direction: change > 0 ? 'longer' : 'shorter',
      minutes: Math.abs(change)
    }
  }

  const daylightTrend = calculateDaylightTrend()

  // Calculate current position in day (% through daylight)
  const currentMinutes = currentTime.getHours() * 60 + currentTime.getMinutes()
  const sunriseMinutes = timeToMinutes(sunrise)
  const sunsetMinutes = timeToMinutes(sunset)
  const dayProgress = isDaylight
    ? ((currentMinutes - sunriseMinutes) / (sunsetMinutes - sunriseMinutes)) * 100
    : 0

  return (
    <div className="bg-gray-900 border border-gray-700 p-3">
      <div className="flex justify-between items-start mb-3">
        <span className="text-xs text-gray-400 font-mono uppercase">SUN TIMES</span>
        <div className="text-right space-y-1">
          <div className={`text-sm font-mono font-bold ${isDaylight ? 'text-yellow-500' : 'text-blue-400'}`}>
            {isDaylight ? 'DAYLIGHT' : 'DARK'}
          </div>
          <div className="text-lg text-white font-mono font-bold">
            {daylightHours}h {daylightMins}m
          </div>
          {daylightTrend && (
            <div className={`text-xs font-mono ${daylightTrend.direction === 'longer' ? 'text-yellow-500' : 'text-blue-400'}`}>
              {daylightTrend.minutes}min {daylightTrend.direction}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* Sunrise */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-yellow-500 text-lg">↑</div>
            <div className="text-xs text-gray-400">SUNRISE</div>
          </div>
          <div className="text-xl font-mono text-white">{formatTime(sunrise)}</div>
          {minutesUntilSunrise > 0 && minutesUntilSunrise < 120 && (
            <div className="text-xs text-yellow-500 font-mono">
              in {minutesUntilSunrise} min
            </div>
          )}
        </div>

        {/* Sunset */}
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-orange-500 text-lg">↓</div>
            <div className="text-xs text-gray-400">SUNSET</div>
          </div>
          <div className="text-xl font-mono text-white">{formatTime(sunset)}</div>
          {minutesUntilSunset > 0 && minutesUntilSunset < 120 && (
            <div className="text-xs text-orange-500 font-mono">
              in {minutesUntilSunset} min
            </div>
          )}
        </div>
      </div>

      {/* Daylight bar */}
      <div className="mt-3 relative">
        <div className="h-1 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-yellow-500 via-orange-400 to-yellow-500"
            style={{
              width: isDaylight ? '100%' : '0%',
              transition: 'width 1s ease'
            }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-gray-500 font-mono">
          <span>{formatTime(sunrise)}</span>
          <span>{formatTime(sunset)}</span>
        </div>
      </div>

      {/* Prime hunting windows */}
      <div className="mt-3 pt-3 border-t border-gray-800 text-xs text-gray-500 font-mono">
        <div className="flex justify-between">
          <span>Dawn Window: {formatTime(sunrise)} - {formatTime(addMinutes(sunrise, 30))}</span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Dusk Window: {formatTime(subtractMinutes(sunset, 30))} - {formatTime(sunset)}</span>
        </div>
      </div>
    </div>
  )
}

// Helper functions
function addMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m + minutes
  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`
}

function subtractMinutes(time: string, minutes: number): string {
  const [h, m] = time.split(':').map(Number)
  const totalMinutes = h * 60 + m - minutes
  const newH = Math.floor(totalMinutes / 60) % 24
  const newM = totalMinutes % 60
  return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}:00`
}
