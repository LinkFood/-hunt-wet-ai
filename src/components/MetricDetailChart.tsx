'use client'

import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

type TimeRange = '24h' | '7d' | '30d' | '90d' | '1y'

interface MetricDetailChartProps {
  title: string
  data: Array<{
    time: string
    value: number
    label?: string
  }>
  unit: string
  color?: string
  historicalData?: Array<{
    date: string
    value: number
  }>
  onExpand?: () => void
  isExpanded?: boolean
  onTimeRangeChange?: (days: number) => void
}

export default function MetricDetailChart({
  title,
  data,
  unit,
  color = '#3B82F6',
  historicalData,
  onExpand,
  isExpanded = false,
  onTimeRangeChange
}: MetricDetailChartProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('24h')

  const handleTimeRangeChange = (range: TimeRange) => {
    setTimeRange(range)

    // Trigger data fetch for longer ranges
    if (onTimeRangeChange) {
      const daysMap = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, '1y': 365 }
      onTimeRangeChange(daysMap[range])
    }
  }

  const currentValue = data[data.length - 1]?.value || 0
  const startValue = data[0]?.value || 0
  const change = currentValue - startValue
  const changePercent = startValue !== 0 ? ((change / startValue) * 100).toFixed(1) : '0'

  // Filter data based on time range
  const getFilteredData = () => {
    if (!historicalData || historicalData.length === 0) return historicalData

    const now = new Date()
    let cutoffDate = new Date()

    switch (timeRange) {
      case '24h':
        return null // Use hourly data instead
      case '7d':
        cutoffDate.setDate(now.getDate() - 7)
        break
      case '30d':
        cutoffDate.setDate(now.getDate() - 30)
        break
      case '90d':
        cutoffDate.setDate(now.getDate() - 90)
        break
      case '1y':
        cutoffDate.setFullYear(now.getFullYear() - 1)
        break
    }

    return historicalData.filter(d => new Date(d.date) >= cutoffDate)
  }

  const filteredHistoricalData = getFilteredData()
  const displayData = timeRange === '24h' ? data : filteredHistoricalData

  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-gray-600 transition-colors cursor-pointer"
         onClick={onExpand}>
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-300 mb-1">{title}</h3>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono text-white">{currentValue}{unit}</span>
            <span className={`text-sm font-mono ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {change >= 0 ? '+' : ''}{change.toFixed(1)}{unit}
            </span>
            <span className="text-xs text-gray-400">
              ({change >= 0 ? '+' : ''}{changePercent}%)
            </span>
          </div>
        </div>
        <div className="text-right text-xs text-gray-400">
          <div>24hr range</div>
          <div className="font-mono text-white">
            {Math.min(...data.map(d => d.value)).toFixed(1)} - {Math.max(...data.map(d => d.value)).toFixed(1)}{unit}
          </div>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex gap-1 mb-4 pb-3 border-b border-gray-700" onClick={(e) => e.stopPropagation()}>
        {(['24h', '7d', '30d', '90d', '1y'] as TimeRange[]).map((range) => (
          <button
            key={range}
            onClick={() => handleTimeRangeChange(range)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            {range.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div className="mb-4">
        <div className="text-xs text-gray-400 mb-2">
          {timeRange === '24h' ? 'LAST 24 HOURS' :
           timeRange === '7d' ? 'LAST 7 DAYS' :
           timeRange === '30d' ? 'LAST 30 DAYS' :
           timeRange === '90d' ? 'LAST 90 DAYS' : 'LAST 1 YEAR'}
        </div>
        <ResponsiveContainer width="100%" height={isExpanded ? 300 : 200}>
          <LineChart
            data={timeRange === '24h' ? data : filteredHistoricalData || []}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis
              dataKey={timeRange === '24h' ? 'time' : 'date'}
              stroke="#9CA3AF"
              style={{ fontSize: '10px' }}
              tickFormatter={(value) => {
                if (timeRange === '24h') return value.substring(0, 5)
                return new Date(value).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' })
              }}
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
              labelStyle={{ color: '#9CA3AF' }}
              labelFormatter={(value) => {
                if (timeRange === '24h') return value
                return new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
              }}
              formatter={(value: any) => [`${value}${unit}`, title]}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={{ fill: color, r: timeRange === '24h' ? 3 : 2 }}
              name={title}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
