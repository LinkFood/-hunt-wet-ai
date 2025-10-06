'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface DataPoint {
  x: string
  value: number
}

interface DataMetricProps {
  label: string
  current: number
  unit: string
  data24h: DataPoint[]
  avg7d?: number
  avg30d?: number
  size?: 'large' | 'medium' | 'small'
  color?: string
  showRateOfChange?: boolean // For pressure
}

export default function DataMetric({
  label,
  current,
  unit,
  data24h,
  avg7d,
  avg30d,
  size = 'medium',
  color = '#3B82F6',
  showRateOfChange = false
}: DataMetricProps) {
  const heightMap = { large: 200, medium: 120, small: 80 }
  const fontMap = { large: 'text-5xl', medium: 'text-3xl', small: 'text-xl' }

  // Calculate rate of change (for pressure)
  const calculateRateOfChange = () => {
    if (!showRateOfChange || data24h.length < 4) return null

    // Get last 3 hours of data
    const recent3 = data24h.slice(-3)
    if (recent3.length < 2) return null

    const first = recent3[0].value
    const last = recent3[recent3.length - 1].value
    const change = last - first
    const hoursSpan = recent3.length - 1

    const changePerHour = change / hoursSpan

    return {
      value: changePerHour,
      direction: changePerHour > 0.5 ? 'rising' : changePerHour < -0.5 ? 'falling' : 'steady',
      icon: changePerHour > 0.5 ? '↗' : changePerHour < -0.5 ? '↘' : '→'
    }
  }

  const rateOfChange = calculateRateOfChange()

  return (
    <div className="bg-gray-900 border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono uppercase">{label}</span>
        {avg7d && avg30d && (
          <div className="flex gap-3 text-xs font-mono text-gray-500">
            <span>7d: {avg7d.toFixed(1)}</span>
            <span>30d: {avg30d.toFixed(1)}</span>
          </div>
        )}
      </div>

      {/* Current Value */}
      <div className="px-3 py-2 bg-gray-850">
        <div className="flex items-baseline justify-between">
          <span className={`${fontMap[size]} font-mono text-white`}>
            {current.toFixed(size === 'small' ? 0 : 1)}{unit}
          </span>

          {/* Rate of Change - For Pressure */}
          {rateOfChange && (
            <div className="flex flex-col items-end">
              <span className={`text-lg font-mono ${
                rateOfChange.direction === 'rising' ? 'text-red-400' :
                rateOfChange.direction === 'falling' ? 'text-green-400' :
                'text-gray-400'
              }`}>
                {rateOfChange.icon}
              </span>
              <span className="text-xs text-gray-500 font-mono">
                {Math.abs(rateOfChange.value).toFixed(1)} mb/hr
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Chart */}
      <div className="bg-gray-900">
        <ResponsiveContainer width="100%" height={heightMap[size]}>
          <LineChart data={data24h} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />
            <XAxis
              dataKey="x"
              stroke="#4B5563"
              style={{ fontSize: '9px' }}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#4B5563"
              style={{ fontSize: '9px' }}
              tickLine={false}
              axisLine={false}
              domain={[(dataMin: number) => Math.floor(dataMin * 0.98), (dataMax: number) => Math.ceil(dataMax * 1.02)]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: 0,
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
              labelStyle={{ color: '#9CA3AF' }}
              formatter={(value: any) => [`${value}${unit}`, '']}
            />

            {/* Reference lines - FACTS not predictions */}
            {avg7d && (
              <ReferenceLine
                y={avg7d}
                stroke="#6B7280"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}
            {avg30d && (
              <ReferenceLine
                y={avg30d}
                stroke="#4B5563"
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            )}

            {/* Data line */}
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={1.5}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
