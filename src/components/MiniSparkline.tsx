'use client'

interface MiniSparklineProps {
  data: number[]
  width?: number
  height?: number
  color?: string
  showDots?: boolean
}

export default function MiniSparkline({
  data,
  width = 60,
  height = 20,
  color = '#3B82F6',
  showDots = false
}: MiniSparklineProps) {
  if (!data || data.length === 0) return null

  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1

  // Normalize data to 0-1 scale
  const normalized = data.map(val => (val - min) / range)

  // Create SVG path
  const stepX = width / (data.length - 1)
  const points = normalized.map((val, idx) => ({
    x: idx * stepX,
    y: height - (val * height)
  }))

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`)
    .join(' ')

  return (
    <svg width={width} height={height} className="inline-block">
      <path
        d={pathD}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {showDots && points.map((p, i) => (
        <circle
          key={i}
          cx={p.x}
          cy={p.y}
          r="1.5"
          fill={color}
        />
      ))}
    </svg>
  )
}
