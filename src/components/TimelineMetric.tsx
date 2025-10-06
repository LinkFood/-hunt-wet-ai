'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, ComposedChart } from 'recharts'

interface TimelineDataPoint {
  date: string
  value: number
  isForecast: boolean
}

interface TimelineMetricProps {
  label: string
  unit: string
  historicalData: TimelineDataPoint[] // Past 30 days
  currentValue: number
  forecastData: TimelineDataPoint[] // Next 7 days
  color?: string
  size?: 'large' | 'medium' | 'small'
}

export default function TimelineMetric({
  label,
  unit,
  historicalData,
  currentValue,
  forecastData,
  color = '#3B82F6',
  size = 'medium'
}: TimelineMetricProps) {
  // Combine historical + current + forecast into one timeline
  const now = new Date()
  const currentPoint = {
    date: now.toISOString().split('T')[0],
    value: currentValue,
    isForecast: false
  }

  const allData = [...historicalData, currentPoint, ...forecastData]

  // Calculate stats from historical data only
  const historicalValues = historicalData.map(d => d.value).filter(Boolean)
  const avg30d = historicalValues.length > 0
    ? historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length
    : currentValue

  const recent7 = historicalData.slice(-7).map(d => d.value).filter(Boolean)
  const avg7d = recent7.length > 0
    ? recent7.reduce((a, b) => a + b, 0) / recent7.length
    : currentValue

  const min = Math.min(...allData.map(d => d.value))
  const max = Math.max(...allData.map(d => d.value))

  const heightMap = { large: 250, medium: 150, small: 100 }
  const fontMap = { large: 'text-4xl', medium: 'text-2xl', small: 'text-xl' }

  return (
    <div className="bg-gray-900 border border-gray-700">
      {/* Header */}
      <div className="bg-gray-800 px-3 py-2 border-b border-gray-700 flex justify-between items-center">
        <span className="text-xs text-gray-400 font-mono uppercase">{label}</span>
        <div className="flex gap-4 text-xs font-mono">
          <span className="text-gray-500">7d: {avg7d.toFixed(1)}</span>
          <span className="text-gray-500">30d: {avg30d.toFixed(1)}</span>
          <span className="text-gray-500">Min: {min.toFixed(1)}</span>
          <span className="text-gray-500">Max: {max.toFixed(1)}</span>
        </div>
      </div>

      {/* Current Value */}
      <div className="px-3 py-2 bg-gray-850 border-b border-gray-700 flex justify-between items-baseline">
        <span className={`${fontMap[size]} font-mono text-white`}>
          {currentValue.toFixed(1)}{unit}
        </span>
        <div className="text-xs text-gray-500 font-mono">
          NOW: {now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {/* Timeline Chart: PAST → NOW → FUTURE */}
      <div className="bg-gray-900 p-2">
        <ResponsiveContainer width="100%" height={heightMap[size]}>
          <ComposedChart data={allData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

            <XAxis
              dataKey="date"
              stroke="#4B5563"
              style={{ fontSize: '9px' }}
              tickLine={false}
              axisLine={false}
              tickFormatter={(value) => {
                const d = new Date(value)
                return `${d.getMonth() + 1}/${d.getDate()}`
              }}
            />

            <YAxis
              stroke="#4B5563"
              style={{ fontSize: '9px' }}
              tickLine={false}
              axisLine={false}
              domain={[min - 2, max + 2]}
            />

            <Tooltip
              contentStyle={{
                backgroundColor: '#111827',
                border: '1px solid #374151',
                borderRadius: 0,
                fontSize: '10px',
                fontFamily: 'monospace'
              }}
              labelFormatter={(value) => {
                const d = new Date(value)
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
              }}
              formatter={(value: any, name: any, props: any) => {
                const isForecast = props.payload.isForecast
                return [`${value}${unit} ${isForecast ? '(forecast)' : '(actual)'}`, ''
              ]}
            />

            {/* Reference lines for averages - FACTS */}
            <ReferenceLine
              y={avg7d}
              stroke="#6B7280"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: '7d avg', position: 'right', fill: '#6B7280', fontSize: 9 }}
            />
            <ReferenceLine
              y={avg30d}
              stroke="#4B5563"
              strokeDasharray="3 3"
              strokeWidth={1}
              label={{ value: '30d avg', position: 'right', fill: '#4B5563', fontSize: 9 }}
            />

            {/* NOW marker - vertical line */}
            <ReferenceLine
              x={currentPoint.date}
              stroke="#FBBF24"
              strokeWidth={2}
              label={{ value: 'NOW', position: 'top', fill: '#FBBF24', fontSize: 10 }}
            />

            {/* Historical data - solid line */}
            <Line
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
              connectNulls
            />

            {/* Forecast data - show differently (lighter/dashed) */}
            {/* Note: In a real implementation, you'd split this into two datasets */}
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend */}
        <div className="flex gap-4 justify-center mt-2 text-xs text-gray-500 font-mono">
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: color }}></div>
            HISTORICAL (FACTS)
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-yellow-500"></div>
            NOW
          </span>
          <span className="flex items-center gap-1">
            <div className="w-3 h-0.5" style={{ backgroundColor: color, opacity: 0.5 }}></div>
            FORECAST (PREDICTIONS)
          </span>
        </div>
      </div>
    </div>
  )
}
