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
}

export default function DataMetric({
  label,
  current,
  unit,
  data24h,
  avg7d,
  avg30d,
  size = 'medium',
  color = '#3B82F6'
}: DataMetricProps) {
  const heightMap = { large: 200, medium: 120, small: 80 }
  const fontMap = { large: 'text-5xl', medium: 'text-3xl', small: 'text-xl' }

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
        <span className={`${fontMap[size]} font-mono text-white`}>
          {current.toFixed(size === 'small' ? 0 : 1)}{unit}
        </span>
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
              domain={['dataMin - 2', 'dataMax + 2']}
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
