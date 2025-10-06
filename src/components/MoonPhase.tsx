'use client'

interface MoonPhaseProps {
  phase: number // 0-1 (0=new, 0.25=first quarter, 0.5=full, 0.75=last quarter, 1=new)
  forecastPhases?: number[] // Next 7 days of moon phases for trend
  size?: 'small' | 'medium' | 'large'
}

export default function MoonPhase({ phase, forecastPhases, size = 'medium' }: MoonPhaseProps) {
  const sizeMap = { small: 40, medium: 60, large: 100 }
  const moonSize = sizeMap[size]

  // Calculate illumination percentage
  const illumination = Math.round(
    phase <= 0.5
      ? phase * 200  // 0 to 0.5 = 0% to 100%
      : (1 - phase) * 200  // 0.5 to 1 = 100% to 0%
  )

  // Get moon phase name
  const getPhaseName = (p: number): string => {
    if (p < 0.03) return 'New Moon'
    if (p < 0.22) return 'Waxing Crescent'
    if (p < 0.28) return 'First Quarter'
    if (p < 0.47) return 'Waxing Gibbous'
    if (p < 0.53) return 'Full Moon'
    if (p < 0.72) return 'Waning Gibbous'
    if (p < 0.78) return 'Last Quarter'
    if (p < 0.97) return 'Waning Crescent'
    return 'New Moon'
  }

  const phaseName = getPhaseName(phase)
  const waxing = phase < 0.5

  // Calculate days until next major phase
  const getDaysToNextPhase = () => {
    if (!forecastPhases || forecastPhases.length === 0) return null

    // Find next major phase transition
    const majorPhases = [0, 0.25, 0.5, 0.75]
    const currentMajor = majorPhases.reduce((prev, curr) =>
      Math.abs(curr - phase) < Math.abs(prev - phase) ? curr : prev
    )

    let nextMajorIndex = majorPhases.indexOf(currentMajor) + 1
    if (nextMajorIndex >= majorPhases.length) nextMajorIndex = 0
    const nextMajor = majorPhases[nextMajorIndex]

    // Count days until we reach next major phase
    for (let i = 0; i < forecastPhases.length; i++) {
      const diff = Math.abs(forecastPhases[i] - nextMajor)
      if (diff < 0.05) { // Within 5% of major phase
        return { days: i + 1, phase: getPhaseName(nextMajor) }
      }
    }
    return null
  }

  const nextPhaseInfo = getDaysToNextPhase()

  // Calculate trend (waxing or waning)
  const trend = phase < 0.5 ? 'Waxing' : 'Waning'
  const trendIcon = phase < 0.5 ? '→' : '←'

  // SVG moon visualization
  const renderMoon = () => {
    const radius = moonSize / 2
    const center = moonSize / 2

    // Calculate shadow position for crescent/gibbous phases
    const shadowOffset = (phase <= 0.5 ? phase : (1 - phase)) * radius * 2

    return (
      <svg width={moonSize} height={moonSize} viewBox={`0 0 ${moonSize} ${moonSize}`}>
        {/* Full moon circle */}
        <circle
          cx={center}
          cy={center}
          r={radius - 2}
          fill="#E5E7EB"
          stroke="#9CA3AF"
          strokeWidth="2"
        />

        {/* Shadow overlay */}
        {phase !== 0.5 && (
          <ellipse
            cx={waxing ? center + shadowOffset - radius : center - shadowOffset + radius}
            cy={center}
            rx={radius - shadowOffset}
            ry={radius - 2}
            fill="#1F2937"
            opacity={phase < 0.05 || phase > 0.95 ? 1 : 0.9}
          />
        )}
      </svg>
    )
  }

  return (
    <div className="flex flex-col items-center gap-3">
      {renderMoon()}
      <div className="text-center space-y-1.5">
        {/* Phase Name - Bigger */}
        <div className="text-sm font-mono text-gray-300 uppercase font-bold">{phaseName}</div>

        {/* Illumination - BIGGEST */}
        <div className="text-2xl font-mono text-white font-bold">{illumination}%</div>

        {/* Context: Trend */}
        <div className="text-xs text-gray-400 font-mono">
          {trend} {trendIcon}
        </div>

        {/* Context: Next Phase - More prominent */}
        {nextPhaseInfo && (
          <div className="text-sm text-yellow-500 font-mono font-bold">
            {nextPhaseInfo.phase} in {nextPhaseInfo.days}d
          </div>
        )}

        {/* Context: Hunting Quality - More prominent */}
        <div className={`text-sm font-mono font-bold ${
          illumination > 75 ? 'text-red-400' : illumination < 25 ? 'text-green-400' : 'text-gray-400'
        }`}>
          {illumination > 75 ? 'LOW ACTIVITY' : illumination < 25 ? 'PEAK ACTIVITY' : 'MODERATE'}
        </div>
      </div>
    </div>
  )
}
