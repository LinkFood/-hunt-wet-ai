// Centralized API Configuration & Usage Tracking
// Single place to manage all API keys and monitor usage for future monetization

export interface ApiUsage {
  apiName: string
  endpoint: string
  timestamp: Date
  success: boolean
  cost?: number
  responseTime?: number
  userId?: string
  zipCode?: string
}

export interface HunterInteraction {
  id: string
  zipCode: string
  gameType: string
  timestamp: Date
  weatherConditions: {
    temperature: number
    pressure: number
    windSpeed: number
    precipitation: number
  }
  userInput: string
  aiResponse: string
  userFeedback?: 'helpful' | 'not-helpful' | 'very-helpful'
  huntingOutcome?: {
    success: boolean
    details?: string
    species?: string
    timeOfDay?: string
  }
}

export class ApiManager {
  private static usage: ApiUsage[] = []
  private static interactions: HunterInteraction[] = []

  // Centralized API Keys
  static getApiKeys() {
    return {
      openai: process.env.OPENAI_API_KEY,
      supabase: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      },
      weather: process.env.OPENWEATHER_API_KEY,
      google: {
        apiKey: process.env.GOOGLE_API_KEY,
        searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID
      },
      ebird: process.env.EBIRD_API_KEY
    }
  }

  // Log API usage for monitoring/billing
  static logUsage(usage: ApiUsage) {
    this.usage.push(usage)

    // In production, save to database
    if (process.env.NODE_ENV === 'production') {
      this.saveUsageToDatabase(usage)
    }
  }

  // Get usage stats for monitoring
  static getUsageStats() {
    const stats = this.usage.reduce((acc, usage) => {
      acc[usage.apiName] = acc[usage.apiName] || { calls: 0, cost: 0 }
      acc[usage.apiName].calls++
      acc[usage.apiName].cost += usage.cost || 0
      return acc
    }, {} as Record<string, { calls: number; cost: number }>)

    return stats
  }

  // Check if API is configured
  static isConfigured(apiName: string): boolean {
    const keys = this.getApiKeys()

    switch (apiName) {
      case 'openai':
        return !!keys.openai
      case 'supabase':
        return !!keys.supabase.url && !!keys.supabase.key
      case 'weather':
        return !!keys.weather
      case 'google':
        return !!keys.google.apiKey && !!keys.google.searchEngineId
      case 'ebird':
        return !!keys.ebird
      default:
        return false
    }
  }

  // Get API configuration status
  static getConfigurationStatus() {
    return {
      openai: {
        configured: this.isConfigured('openai'),
        required: true,
        description: 'AI hunting advice and analysis'
      },
      supabase: {
        configured: this.isConfigured('supabase'),
        required: true,
        description: 'Database for learning and user data'
      },
      weather: {
        configured: this.isConfigured('weather'),
        required: true,
        description: 'Weather and pressure data'
      },
      google: {
        configured: this.isConfigured('google'),
        required: true,
        description: 'Social media hunting intelligence'
      },
      ebird: {
        configured: this.isConfigured('ebird'),
        required: false,
        description: 'Bird observation data'
      }
    }
  }

  // Log hunter interactions for learning
  static logHunterInteraction(interaction: HunterInteraction) {
    this.interactions.push(interaction)

    if (process.env.NODE_ENV === 'production') {
      this.saveInteractionToDatabase(interaction)
    }
  }

  // Get learning insights from hunter data
  static getLearningInsights(zipCode: string, gameType: string) {
    const zipInteractions = this.interactions.filter(i =>
      i.zipCode === zipCode && i.gameType === gameType
    )

    if (zipInteractions.length < 5) return null

    const successfulHunts = zipInteractions.filter(i =>
      i.huntingOutcome?.success
    )

    const insights = {
      totalInteractions: zipInteractions.length,
      successRate: (successfulHunts.length / zipInteractions.length) * 100,
      bestConditions: this.analyzeSuccessPatterns(successfulHunts),
      commonQuestions: this.getMostCommonQuestions(zipInteractions),
      lastUpdated: new Date()
    }

    return insights
  }

  private static analyzeSuccessPatterns(successfulHunts: HunterInteraction[]) {
    if (successfulHunts.length === 0) return null

    const avgTemp = successfulHunts.reduce((sum, h) =>
      sum + h.weatherConditions.temperature, 0
    ) / successfulHunts.length

    const avgPressure = successfulHunts.reduce((sum, h) =>
      sum + h.weatherConditions.pressure, 0
    ) / successfulHunts.length

    return {
      optimalTemperature: Math.round(avgTemp),
      optimalPressure: Math.round(avgPressure * 100) / 100,
      bestTimes: successfulHunts.map(h => h.huntingOutcome?.timeOfDay).filter(Boolean)
    }
  }

  private static getMostCommonQuestions(interactions: HunterInteraction[]) {
    const questions = interactions.map(i => i.userInput.toLowerCase())
    const questionMap: { [key: string]: number } = {}

    questions.forEach(q => {
      if (q.includes('when') || q.includes('where') || q.includes('best time')) {
        questionMap[q] = (questionMap[q] || 0) + 1
      }
    })

    return Object.entries(questionMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([question]) => question)
  }

  private static async saveUsageToDatabase(usage: ApiUsage) {
    try {
      // This would save to Supabase for production monitoring
      console.log('API Usage:', usage)
    } catch (error) {
      console.error('Failed to save API usage:', error)
    }
  }

  private static async saveInteractionToDatabase(interaction: HunterInteraction) {
    try {
      // This would save to Supabase for learning
      console.log('Hunter Interaction:', interaction)
    } catch (error) {
      console.error('Failed to save hunter interaction:', error)
    }
  }
}

// Wrapper functions for API calls with automatic logging

export async function callOpenAI(messages: any[], options: any = {}, context?: { zipCode?: string, gameType?: string }) {
  const startTime = Date.now()

  // Add learned insights to system message if available
  if (context?.zipCode && context?.gameType) {
    const insights = ApiManager.getLearningInsights(context.zipCode, context.gameType)

    if (insights) {
      const learningPrompt = `LEARNED ZIP-SPECIFIC INTELLIGENCE for ${context.zipCode}:
- Success rate: ${insights.successRate.toFixed(1)}% (${insights.totalInteractions} hunters)
- Optimal temp: ${insights.bestConditions?.optimalTemperature}°F
- Optimal pressure: ${insights.bestConditions?.optimalPressure}" Hg
- Best times: ${insights.bestConditions?.bestTimes.join(', ')}
- Common questions: ${insights.commonQuestions.join('; ')}
Use this LOCAL INTELLIGENCE to enhance your advice.`

      messages = [
        { role: 'system', content: learningPrompt },
        ...messages
      ]
    }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${ApiManager.getApiKeys().openai}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        ...options
      })
    })

    const data = await response.json()

    ApiManager.logUsage({
      apiName: 'openai',
      endpoint: 'chat/completions',
      timestamp: new Date(),
      success: response.ok,
      cost: estimateOpenAICost(data.usage),
      responseTime: Date.now() - startTime
    })

    return data

  } catch (error) {
    ApiManager.logUsage({
      apiName: 'openai',
      endpoint: 'chat/completions',
      timestamp: new Date(),
      success: false,
      responseTime: Date.now() - startTime
    })
    throw error
  }
}

export async function callGoogleSearch(query: string, dateRestrict?: string) {
  const startTime = Date.now()
  const keys = ApiManager.getApiKeys().google

  try {
    const url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${keys.apiKey}&` +
      `cx=${keys.searchEngineId}&` +
      `q=${encodeURIComponent(query)}` +
      (dateRestrict ? `&dateRestrict=${dateRestrict}` : '') +
      `&num=10&sort=date:d:r`

    const response = await fetch(url)
    const data = await response.json()

    ApiManager.logUsage({
      apiName: 'google',
      endpoint: 'customsearch',
      timestamp: new Date(),
      success: response.ok,
      cost: 0.005, // $5 per 1000 queries
      responseTime: Date.now() - startTime
    })

    return data

  } catch (error) {
    ApiManager.logUsage({
      apiName: 'google',
      endpoint: 'customsearch',
      timestamp: new Date(),
      success: false,
      responseTime: Date.now() - startTime
    })
    throw error
  }
}

// Cost estimation helpers
function estimateOpenAICost(usage: any) {
  if (!usage) return 0
  // GPT-4o-mini pricing: $0.15 per 1M input tokens, $0.60 per 1M output tokens
  const inputCost = (usage.prompt_tokens / 1000000) * 0.15
  const outputCost = (usage.completion_tokens / 1000000) * 0.60
  return inputCost + outputCost
}