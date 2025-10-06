'use client'

interface WindCompassProps {
  direction: number // Degrees 0-360
  speed: number // MPH
  gust?: number // MPH
  forecastSpeeds?: number[] // Next 6 hours of wind speeds for trend
  forecastGusts?: number[] // Next 6 hours of gusts for trend
  size?: 'small' | 'medium' | 'large'
}

export default function WindCompass({ direction, speed, gust, forecastSpeeds, forecastGusts, size = 'medium' }: WindCompassProps) {
  const sizeMap = { small: 80, medium: 120, large: 160 }
  const compassSize = sizeMap[size]
  const center = compassSize / 2

  // Calculate wind trend
  const calculateWindTrend = () => {
    if (!forecastSpeeds || forecastSpeeds.length < 3) return null

    const avg3hr = forecastSpeeds.slice(0, 3).reduce((a, b) => a + b, 0) / 3
    const change = avg3hr - speed

    return {
      direction: change > 0.5 ? 'increasing' : change < -0.5 ? 'decreasing' : 'steady',
      amount: Math.abs(Math.round(change))
    }
  }

  const windTrend = calculateWindTrend()

  // Calculate peak gust forecast
  const peakGust = forecastGusts && forecastGusts.length > 0
    ? Math.max(...forecastGusts)
    : gust || speed

  // Cardinal directions
  const cardinals = [
    { label: 'N', angle: 0 },
    { label: 'NE', angle: 45 },
    { label: 'E', angle: 90 },
    { label: 'SE', angle: 135 },
    { label: 'S', angle: 180 },
    { label: 'SW', angle: 225 },
    { label: 'W', angle: 270 },
    { label: 'NW', angle: 315 }
  ]

  return (
    <div className="bg-gray-900 border border-gray-700 p-3 flex flex-col items-center">
      <div className="text-xs text-gray-400 font-mono uppercase mb-2">WIND</div>

      {/* Compass SVG */}
      <svg width={compassSize} height={compassSize} viewBox={`0 0 ${compassSize} ${compassSize}`}>
        {/* Outer circle */}
        <circle
          cx={center}
          cy={center}
          r={center - 10}
          fill="none"
          stroke="#374151"
          strokeWidth="2"
        />

        {/* Cardinal marks */}
        {cardinals.map((cardinal) => {
          const angle = (cardinal.angle - 90) * (Math.PI / 180)
          const radius = center - 15
          const x = center + radius * Math.cos(angle)
          const y = center + radius * Math.sin(angle)

          return (
            <text
              key={cardinal.label}
              x={x}
              y={y}
              textAnchor="middle"
              dominantBaseline="middle"
              className="text-xs font-mono fill-gray-500"
            >
              {cardinal.label}
            </text>
          )
        })}

        {/* Wind arrow */}
        <g transform={`rotate(${direction}, ${center}, ${center})`}>
          {/* Arrow line */}
          <line
            x1={center}
            y1={center}
            x2={center}
            y2={20}
            stroke="#06B6D4"
            strokeWidth="3"
            strokeLinecap="round"
          />
          {/* Arrowhead */}
          <polygon
            points={`${center},10 ${center - 8},25 ${center + 8},25`}
            fill="#06B6D4"
          />
        </g>

        {/* Center dot */}
        <circle cx={center} cy={center} r="4" fill="#9CA3AF" />
      </svg>

      {/* Wind data */}
      <div className="mt-3 text-center space-y-1.5">
        {/* Speed - BIGGEST */}
        <div className="text-3xl font-mono text-white font-bold">{speed} mph</div>

        {/* Direction */}
        <div className="text-sm text-gray-400 font-mono">{direction}° {getCardinal(direction)}</div>

        {/* Context: Current Gusts - More prominent */}
        {gust && gust > speed && (
          <div className="text-sm text-yellow-500 font-mono font-bold">
            Gusts: {gust} mph
          </div>
        )}

        {/* Context: Trend - More prominent */}
        {windTrend && windTrend.direction !== 'steady' && (
          <div className={`text-sm font-mono font-bold ${
            windTrend.direction === 'increasing' ? 'text-red-400' : 'text-green-400'
          }`}>
            {windTrend.direction} to {speed + (windTrend.direction === 'increasing' ? windTrend.amount : -windTrend.amount)}mph
          </div>
        )}

        {/* Context: Peak Gusts Forecast - More prominent */}
        {peakGust > speed + 2 && (
          <div className="text-sm text-orange-500 font-mono font-bold">
            Peak: {Math.round(peakGust)}mph
          </div>
        )}
      </div>
    </div>
  )
}

function getCardinal(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW']
  const index = Math.round(degrees / 22.5) % 16
  return directions[index]
}
