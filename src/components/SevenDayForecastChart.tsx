'use client'

import { ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SevenDayForecastChartProps {
  data: Array<{
    date: string
    temp_max: number
    temp_min: number
    pressure: number
    precip_prob: number
  }>
}

export default function SevenDayForecastChart({ data }: SevenDayForecastChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <h3 className="text-sm font-bold text-gray-300 mb-4">7-DAY FORECAST</h3>
      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })}
          />
          <YAxis
            yAxisId="temp"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            label={{ value: '°F', angle: -90, position: 'insideLeft', style: { fill: '#9CA3AF', fontSize: '11px' } }}
          />
          <YAxis
            yAxisId="pressure"
            orientation="right"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            domain={['dataMin - 5', 'dataMax + 5']}
            label={{ value: 'mb', angle: 90, position: 'insideRight', style: { fill: '#9CA3AF', fontSize: '11px' } }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#9CA3AF' }}
            labelFormatter={(value) => new Date(value).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          />
          <Legend
            wrapperStyle={{ fontSize: '11px' }}
          />
          <Bar
            yAxisId="temp"
            dataKey="temp_max"
            fill="#EF4444"
            name="High"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            yAxisId="temp"
            dataKey="temp_min"
            fill="#3B82F6"
            name="Low"
            radius={[4, 4, 0, 0]}
          />
          <Line
            yAxisId="pressure"
            type="monotone"
            dataKey="pressure"
            stroke="#FBBF24"
            strokeWidth={2}
            dot={{ fill: '#FBBF24', r: 4 }}
            name="Pressure"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}
