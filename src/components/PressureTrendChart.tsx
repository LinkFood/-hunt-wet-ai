'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface PressureTrendChartProps {
  data: Array<{
    time: string
    pressure: number
  }>
}

export default function PressureTrendChart({ data }: PressureTrendChartProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm font-bold text-gray-300">PRESSURE TREND (24HR)</h3>
        <div className="text-xs text-gray-400">
          {data.length > 0 && (
            <>
              Current: <span className="text-white font-mono">{data[data.length - 1].pressure}mb</span>
              {' | '}
              Change: <span className={`font-mono ${
                data[data.length - 1].pressure < data[0].pressure ? 'text-red-400' : 'text-green-400'
              }`}>
                {(data[data.length - 1].pressure - data[0].pressure).toFixed(1)}mb
              </span>
            </>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="time"
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            tickFormatter={(value) => value.slice(0, 5)}
          />
          <YAxis
            stroke="#9CA3AF"
            style={{ fontSize: '11px' }}
            domain={['dataMin - 2', 'dataMax + 2']}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '4px',
              fontSize: '12px'
            }}
            labelStyle={{ color: '#9CA3AF' }}
            formatter={(value: number) => [`${value}mb`, 'Pressure']}
          />
          <Line
            type="monotone"
            dataKey="pressure"
            stroke="#3B82F6"
            strokeWidth={2}
            dot={{ fill: '#3B82F6', r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-2 text-xs text-gray-400 flex justify-between">
        <span>Falling pressure = Storm approaching / Animal movement</span>
        <span>Rising pressure = High system / Less activity</span>
      </div>
    </div>
  )
}
