// Professional hunting intelligence color coding system
// Based on Bloomberg Terminal and OnX Hunt tactical aesthetics

export const huntingColors = {
  // Base Terminal Colors
  terminal: {
    background: '#111827',      // Gray-900
    surface: '#1F2937',         // Gray-800
    border: '#374151',          // Gray-700
    muted: '#6B7280',          // Gray-500
    text: '#F9FAFB',           // Gray-50
    textSecondary: '#D1D5DB'    // Gray-300
  },

  // Hunting Intelligence Status Colors
  intelligence: {
    excellent: '#10B981',       // Emerald-500 - Excellent hunting conditions
    good: '#22C55E',           // Green-500 - Good conditions
    fair: '#EAB308',           // Yellow-500 - Fair conditions
    poor: '#EF4444',           // Red-500 - Poor conditions
    critical: '#DC2626'         // Red-600 - Critical alerts
  },

  // Data Stream Colors (Bloomberg-inspired)
  streams: {
    live: '#10B981',           // Green - Live data streaming
    delayed: '#F59E0B',        // Amber - Delayed data
    offline: '#6B7280',        // Gray - Offline
    error: '#EF4444'           // Red - Error state
  },

  // Metric Categories
  metrics: {
    weather: '#3B82F6',        // Blue-500 - Weather data
    pressure: '#8B5CF6',       // Violet-500 - Barometric pressure
    lunar: '#F59E0B',          // Amber-500 - Lunar/solunar data
    activity: '#10B981',       // Emerald-500 - Game activity
    success: '#06B6D4',        // Cyan-500 - Success rates
    alerts: '#F97316'          // Orange-500 - Alerts and warnings
  },

  // Game Type Colors
  gameTypes: {
    bigGame: '#059669',        // Emerald-600 - Big game (deer, elk)
    upland: '#0EA5E9',         // Sky-500 - Upland game (birds)
    waterfowl: '#0891B2'       // Cyan-600 - Waterfowl specific
  },

  // Tactical/Military Colors (OnX-inspired)
  tactical: {
    primary: '#22C55E',        // Green-500 - Primary tactical
    secondary: '#84CC16',      // Lime-500 - Secondary tactical
    accent: '#10B981',         // Emerald-500 - Accent tactical
    warning: '#F59E0B',        // Amber-500 - Tactical warning
    danger: '#EF4444',         // Red-500 - Tactical danger
    neutral: '#6B7280'         // Gray-500 - Neutral/standby
  },

  // Score-based Color Gradients
  scoreGradient: {
    0: '#DC2626',  // Red-600 - Score 0-2
    1: '#EF4444',  // Red-500 - Score 1-3
    2: '#F97316',  // Orange-500 - Score 2-4
    3: '#F59E0B',  // Amber-500 - Score 3-5
    4: '#EAB308',  // Yellow-500 - Score 4-6
    5: '#84CC16',  // Lime-500 - Score 5-7
    6: '#22C55E',  // Green-500 - Score 6-8
    7: '#10B981',  // Emerald-500 - Score 7-9
    8: '#059669',  // Emerald-600 - Score 8-10
    9: '#047857',  // Emerald-700 - Score 9-10
    10: '#065F46'  // Emerald-800 - Perfect 10
  }
}

// Color utility functions
export const getScoreColor = (score: number): string => {
  const roundedScore = Math.round(Math.max(0, Math.min(10, score)))
  return huntingColors.scoreGradient[roundedScore as keyof typeof huntingColors.scoreGradient]
}

export const getIntelligenceStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'excellent': return huntingColors.intelligence.excellent
    case 'good': return huntingColors.intelligence.good
    case 'fair': return huntingColors.intelligence.fair
    case 'poor': return huntingColors.intelligence.poor
    case 'critical': return huntingColors.intelligence.critical
    default: return huntingColors.intelligence.fair
  }
}

export const getMetricCategoryColor = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'weather': return huntingColors.metrics.weather
    case 'pressure': return huntingColors.metrics.pressure
    case 'lunar': return huntingColors.metrics.lunar
    case 'activity': return huntingColors.metrics.activity
    case 'success': return huntingColors.metrics.success
    case 'alerts': return huntingColors.metrics.alerts
    default: return huntingColors.tactical.neutral
  }
}

export const getGameTypeColor = (gameType: string): string => {
  switch (gameType.toLowerCase()) {
    case 'big-game': return huntingColors.gameTypes.bigGame
    case 'upland': return huntingColors.gameTypes.upland
    case 'waterfowl': return huntingColors.gameTypes.waterfowl
    default: return huntingColors.gameTypes.bigGame
  }
}

export const getStreamStatusColor = (status: string): string => {
  switch (status.toLowerCase()) {
    case 'live': return huntingColors.streams.live
    case 'delayed': return huntingColors.streams.delayed
    case 'offline': return huntingColors.streams.offline
    case 'error': return huntingColors.streams.error
    default: return huntingColors.streams.offline
  }
}

// Tailwind CSS class helpers
export const getTailwindScoreClasses = (score: number): string => {
  if (score >= 8) return 'text-emerald-400 border-emerald-400 bg-emerald-400/10'
  if (score >= 6) return 'text-green-400 border-green-400 bg-green-400/10'
  if (score >= 4) return 'text-yellow-400 border-yellow-400 bg-yellow-400/10'
  return 'text-red-400 border-red-400 bg-red-400/10'
}

export const getTailwindMetricClasses = (category: string): string => {
  switch (category.toLowerCase()) {
    case 'weather': return 'text-blue-400 border-blue-400'
    case 'pressure': return 'text-purple-400 border-purple-400'
    case 'lunar': return 'text-yellow-400 border-yellow-400'
    case 'activity': return 'text-green-400 border-green-400'
    case 'success': return 'text-emerald-400 border-emerald-400'
    case 'alerts': return 'text-orange-400 border-orange-400'
    default: return 'text-gray-400 border-gray-400'
  }
}