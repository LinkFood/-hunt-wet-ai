'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface HourlyMetricsChartProps {
  data: Array<{
    time: string
    temperature: number
    feels_like: number
    wind_speed: number
    humidity: number
  }>
}

export default function HourlyMetricsChart({ data }: HourlyMetricsChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-bold text-gray-300 mb-4">HOURLY CONDITIONS (TODAY)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => value.slice(0, 5)}
          />
          <YAxis
            yAxisId="temp"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            label={{ value: '°F', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '11px' } }}
          />
          <YAxis
            yAxisId="other"
            orientation="right"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#9CA3AF' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
            iconType="line"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="temperature"
            stroke="#EF4444"
            strokeWidth={2}
            dot={false}
            name="Temp"
          />
          <Line
            yAxisId="temp"
            type="monotone"
            dataKey="feels_like"
            stroke="#F97316"
            strokeWidth={1}
            strokeDasharray="5 5"
            dot={false}
            name="Feels Like"
          />
          <Line
            yAxisId="other"
            type="monotone"
            dataKey="wind_speed"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={false}
            name="Wind (mph)"
          />
          <Line
            yAxisId="other"
            type="monotone"
            dataKey="humidity"
            stroke="#10B981"
            strokeWidth={1}
            dot={false}
            name="Humidity (%)"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
