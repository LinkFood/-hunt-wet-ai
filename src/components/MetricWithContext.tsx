'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

interface DataPoint {
  time: string
  value: number
}

interface MetricWithContextProps {
  title: string
  currentValue: number
  unit: string
  data: DataPoint[]
  historicalData: DataPoint[]
  color?: string
  importance?: 'critical' | 'high' | 'medium'
}

export default function MetricWithContext({
  title,
  currentValue,
  unit,
  data,
  historicalData,
  color = '#3B82F6',
  importance = 'medium'
}: MetricWithContextProps) {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '30d'>('24h')

  // Calculate averages and ranges from historical data
  const calculate7DayAvg = () => {
    if (!historicalData || historicalData.length === 0) return currentValue
    const recent7 = historicalData.slice(-7)
    return recent7.reduce((sum, d) => sum + d.value, 0) / recent7.length
  }

  const calculate30DayAvg = () => {
    if (!historicalData || historicalData.length === 0) return currentValue
    return historicalData.reduce((sum, d) => sum + d.value, 0) / historicalData.length
  }

  const calculateTrend = () => {
    if (!data || data.length < 2) return 'steady'
    const first = data[0].value
    const last = data[data.length - 1].value
    const change = last - first
    const changePercent = (change / first) * 100

    if (changePercent > 2) return 'rising-fast'
    if (changePercent > 0.5) return 'rising'
    if (changePercent < -2) return 'falling-fast'
    if (changePercent < -0.5) return 'falling'
    return 'steady'
  }

  const avg7d = calculate7DayAvg()
  const avg30d = calculate30DayAvg()
  const trend = calculateTrend()
  const vsAvg7d = currentValue - avg7d
  const vsAvg30d = currentValue - avg30d

  const trendIcon = {
    'rising-fast': '↗',
    'rising': '↑',
    'steady': '→',
    'falling': '↓',
    'falling-fast': '↘'
  }[trend]

  const trendColor = {
    'rising-fast': 'text-green-400',
    'rising': 'text-green-500',
    'steady': 'text-gray-400',
    'falling': 'text-red-500',
    'falling-fast': 'text-red-400'
  }[trend]

  const sizeClass = {
    'critical': 'col-span-2 row-span-2',
    'high': 'col-span-2',
    'medium': ''
  }[importance]

  const displayData = timeRange === '24h' ? data : historicalData.slice(timeRange === '7d' ? -7 : -30)

  return (
    <div className={`bg-gray-800 rounded-lg p-4 border border-gray-700 ${sizeClass}`}>
      {/* Header */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="text-xs text-gray-400 mb-1">{title}</div>
          <div className="flex items-baseline gap-2">
            <span className={`${importance === 'critical' ? 'text-4xl' : 'text-2xl'} font-mono text-white`}>
              {currentValue.toFixed(importance === 'critical' ? 1 : 0)}{unit}
            </span>
            <span className={`text-xl ${trendColor}`}>{trendIcon}</span>
          </div>
        </div>

        {/* Time range selector */}
        <div className="flex gap-1">
          {(['24h', '7d', '30d'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2 py-1 text-xs rounded ${
                timeRange === range
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              }`}
            >
              {range.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Context stats */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
        <div>
          <span className="text-gray-400">7d avg:</span>
          <span className="ml-1 text-white font-mono">{avg7d.toFixed(1)}{unit}</span>
          <span className={`ml-1 ${vsAvg7d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({vsAvg7d >= 0 ? '+' : ''}{vsAvg7d.toFixed(1)})
          </span>
        </div>
        <div>
          <span className="text-gray-400">30d avg:</span>
          <span className="ml-1 text-white font-mono">{avg30d.toFixed(1)}{unit}</span>
          <span className={`ml-1 ${vsAvg30d >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            ({vsAvg30d >= 0 ? '+' : ''}{vsAvg30d.toFixed(1)})
          </span>
        </div>
      </div>

      {/* Chart with reference lines */}
      <ResponsiveContainer width="100%" height={importance === 'critical' ? 200 : 120}>
        <LineChart data={displayData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: '10px' }}
            tickFormatter={(value) => timeRange === '24h' ? value.substring(0, 5) : value.substring(5)}
            hide={importance !== 'critical'}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '10px' }}
            domain={['dataMin - 5', 'dataMax + 5']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '11px'
            }}
            formatter={(value: any) => [`${value}${unit}`, title]}
          />

          {/* Reference lines for averages */}
          <ReferenceLine
            y={avg7d}
            stroke="#FBBF24"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: '7d avg', position: 'right', fill: '#FBBF24', fontSize: 10 }}
          />
          <ReferenceLine
            y={avg30d}
            stroke="#F97316"
            strokeDasharray="3 3"
            strokeWidth={1}
            label={{ value: '30d avg', position: 'right', fill: '#F97316', fontSize: 10 }}
          />

          {/* Current value line */}
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            name={title}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
