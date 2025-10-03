'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, BarChart3, Activity, Target } from 'lucide-react'

interface ChartData {
  time: string
  huntingScore: number
  weather: number
  activity: number
  pressure: number
  success: number
}

export default function HuntingCharts({ zipCode, gameType }: { zipCode: string, gameType: string }) {
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [selectedMetric, setSelectedMetric] = useState<keyof ChartData>('huntingScore')
  const [timeframe, setTimeframe] = useState<'1h' | '6h' | '24h' | '7d'>('6h')

  useEffect(() => {
    generateChartData()
    const interval = setInterval(generateChartData, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [zipCode, gameType, timeframe])

  const generateChartData = () => {
    const dataPoints: ChartData[] = []
    const now = new Date()
    const intervals = timeframe === '1h' ? 12 : timeframe === '6h' ? 36 : timeframe === '24h' ? 48 : 168 // Data points
    const minuteIncrement = timeframe === '1h' ? 5 : timeframe === '6h' ? 10 : timeframe === '24h' ? 30 : 1440 // Minutes between points

    for (let i = intervals; i >= 0; i--) {
      const time = new Date(now)
      time.setMinutes(time.getMinutes() - (i * minuteIncrement))

      // Generate realistic data with trends
      const baseScore = 5.5 + Math.sin(i * 0.1) * 2 + Math.random() * 0.5
      const weatherScore = baseScore + (Math.random() - 0.5) * 1.5
      const activityScore = baseScore + (Math.random() - 0.5) * 2
      const pressure = 1000 + Math.sin(i * 0.05) * 20 + Math.random() * 10
      const success = (baseScore / 10) * 100

      dataPoints.push({
        time: time.toLocaleTimeString('en-US', {
          hour: timeframe === '7d' ? 'numeric' : '2-digit',
          minute: timeframe === '7d' ? undefined : '2-digit',
          month: timeframe === '7d' ? 'short' : undefined,
          day: timeframe === '7d' ? 'numeric' : undefined
        }),
        huntingScore: Math.round(Math.max(1, Math.min(10, baseScore)) * 10) / 10,
        weather: Math.round(Math.max(1, Math.min(10, weatherScore)) * 10) / 10,
        activity: Math.round(Math.max(1, Math.min(10, activityScore)) * 10) / 10,
        pressure: Math.round(pressure),
        success: Math.round(Math.max(0, Math.min(100, success)))
      })
    }

    setChartData(dataPoints)
  }

  const getMetricColor = (metric: keyof ChartData) => {
    const colors = {
      huntingScore: 'text-green-400 border-green-400',
      weather: 'text-blue-400 border-blue-400',
      activity: 'text-purple-400 border-purple-400',
      pressure: 'text-yellow-400 border-yellow-400',
      success: 'text-emerald-400 border-emerald-400'
    }
    return colors[metric] || 'text-gray-400 border-gray-400'
  }

  const getMetricLabel = (metric: keyof ChartData) => {
    const labels = {
      huntingScore: 'HUNTING INDEX',
      weather: 'WEATHER SCORE',
      activity: 'ACTIVITY LEVEL',
      pressure: 'PRESSURE (MB)',
      success: 'SUCCESS RATE (%)'
    }
    return labels[metric] || metric.toUpperCase()
  }

  const renderSparkline = (data: ChartData[], metric: keyof ChartData) => {
    if (data.length === 0) return null

    const values = data.map(d => typeof d[metric] === 'number' ? d[metric] : 0)
    const max = Math.max(...values)
    const min = Math.min(...values)
    const range = max - min || 1

    const points = values.map((value, index) => {
      const x = (index / (values.length - 1)) * 200 // SVG width
      const y = 60 - ((value - min) / range) * 40 // SVG height with padding
      return `${x},${y}`
    }).join(' ')

    return (
      <svg width="200" height="60" className="w-full h-12">
        <polyline
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          points={points}
          className="opacity-80"
        />
        {/* Data points */}
        {values.map((value, index) => {
          const x = (index / (values.length - 1)) * 200
          const y = 60 - ((value - min) / range) * 40
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r="1.5"
              fill="currentColor"
              className="opacity-60"
            />
          )
        })}
      </svg>
    )
  }

  const renderBarChart = (data: ChartData[], metric: keyof ChartData) => {
    if (data.length === 0) return null

    const values = data.map(d => typeof d[metric] === 'number' ? d[metric] : 0)
    const max = Math.max(...values)
    const recent = data.slice(-12) // Show last 12 data points

    return (
      <div className="flex items-end space-x-1 h-32">
        {recent.map((point, index) => {
          const value = typeof point[metric] === 'number' ? point[metric] : 0
          const height = metric === 'pressure'
            ? ((value - 980) / 60) * 100  // Pressure scale adjustment
            : (value / (max || 10)) * 100

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className={`w-full bg-current opacity-70 rounded-t transition-all duration-500 ${getMetricColor(metric)}`}
                style={{ height: `${Math.max(2, height)}%` }}
              />
              <div className="text-xs text-gray-400 mt-1 transform rotate-45 origin-left">
                {point.time.split(' ')[0]}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  const getCurrentValue = () => {
    if (chartData.length === 0) return '0'
    const latest = chartData[chartData.length - 1]
    return latest[selectedMetric]?.toString() || '0'
  }

  const getTrend = () => {
    if (chartData.length < 2) return 'stable'
    const latest = chartData[chartData.length - 1]
    const previous = chartData[chartData.length - 2]

    const current = typeof latest[selectedMetric] === 'number' ? latest[selectedMetric] : 0
    const prev = typeof previous[selectedMetric] === 'number' ? previous[selectedMetric] : 0

    if (current > prev) return 'up'
    if (current < prev) return 'down'
    return 'stable'
  }

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-bold text-green-400 font-mono tracking-wide">
            HUNTING ANALYTICS
          </h3>
        </div>

        {/* Timeframe Selector */}
        <div className="flex space-x-1 bg-gray-900 rounded p-1">
          {(['1h', '6h', '24h', '7d'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeframe(tf)}
              className={`px-3 py-1 text-xs font-mono rounded transition-colors ${
                timeframe === tf
                  ? 'bg-green-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tf.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Metric Selector */}
      <div className="grid grid-cols-5 gap-2 mb-4">
        {(['huntingScore', 'weather', 'activity', 'pressure', 'success'] as const).map((metric) => (
          <button
            key={metric}
            onClick={() => setSelectedMetric(metric)}
            className={`p-3 border rounded text-center transition-all ${
              selectedMetric === metric
                ? getMetricColor(metric) + ' bg-current/10'
                : 'border-gray-600 text-gray-400 hover:text-white hover:border-gray-400'
            }`}
          >
            <div className="text-xs font-mono font-bold mb-1">
              {getMetricLabel(metric)}
            </div>
            <div className="text-sm">
              {chartData.length > 0 ? chartData[chartData.length - 1][metric] : '0'}
            </div>
          </button>
        ))}
      </div>

      {/* Current Value Display */}
      <div className="bg-gray-900 border border-gray-600 rounded p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 font-mono mb-1">
              CURRENT {getMetricLabel(selectedMetric)}
            </div>
            <div className={`text-3xl font-bold font-mono ${getMetricColor(selectedMetric)}`}>
              {getCurrentValue()}
              {selectedMetric === 'pressure' ? 'mb' : selectedMetric === 'success' ? '%' : '/10'}
            </div>
          </div>
          <div className="text-right">
            <div className={`flex items-center space-x-1 ${
              getTrend() === 'up' ? 'text-green-400' :
              getTrend() === 'down' ? 'text-red-400' : 'text-gray-400'
            }`}>
              <TrendingUp className={`w-4 h-4 ${getTrend() === 'down' ? 'rotate-180' : ''}`} />
              <span className="text-xs font-mono">
                {getTrend().toUpperCase()}
              </span>
            </div>
            <div className="text-xs text-gray-400 font-mono">
              {timeframe.toUpperCase()} TREND
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Sparkline Chart */}
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">
            TREND LINE • {timeframe.toUpperCase()}
          </div>
          <div className={`${getMetricColor(selectedMetric)} h-12`}>
            {renderSparkline(chartData, selectedMetric)}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-2">
            DISTRIBUTION • RECENT VALUES
          </div>
          <div className={getMetricColor(selectedMetric)}>
            {renderBarChart(chartData, selectedMetric)}
          </div>
        </div>
      </div>

      {/* Performance Summary */}
      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">24H HIGH</div>
          <div className="text-lg font-bold text-green-400 font-mono">
            {chartData.length > 0 ? Math.max(...chartData.map(d => typeof d[selectedMetric] === 'number' ? d[selectedMetric] : 0)).toFixed(1) : '0'}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">24H LOW</div>
          <div className="text-lg font-bold text-red-400 font-mono">
            {chartData.length > 0 ? Math.min(...chartData.map(d => typeof d[selectedMetric] === 'number' ? d[selectedMetric] : 0)).toFixed(1) : '0'}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-600 rounded p-3">
          <div className="text-xs text-gray-400 font-mono mb-1">AVERAGE</div>
          <div className="text-lg font-bold text-yellow-400 font-mono">
            {chartData.length > 0 ? (chartData.reduce((sum, d) => sum + (typeof d[selectedMetric] === 'number' ? d[selectedMetric] : 0), 0) / chartData.length).toFixed(1) : '0'}
          </div>
        </div>
      </div>
    </div>
  )
}