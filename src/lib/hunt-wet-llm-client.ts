// Hunt Wet AI - Custom LLM Integration
// Replace OpenAI with YOUR hunting-specific LLM

export class HuntWetLLMClient {
  private llmEndpoint: string

  constructor() {
    // YOUR LLM server (deployed on RunPod or your server)
    this.llmEndpoint = process.env.HUNT_WET_LLM_ENDPOINT || 'https://your-hunt-llm.runpod.net'
  }

  async getHuntingAdvice(
    question: string,
    zipCode: string,
    gameType: string,
    weather?: any
  ): Promise<string> {

    // Build context from your app's data
    const context = `
      Location: ZIP ${zipCode}
      Game: ${gameType}
      Weather: ${weather ? JSON.stringify(weather) : 'Not available'}
      Current conditions: ${new Date().toISOString()}
    `

    try {
      const response = await fetch(`${this.llmEndpoint}/hunt-advice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.HUNT_WET_LLM_API_KEY}` // Your own API key
        },
        body: JSON.stringify({
          question,
          context,
          zipCode,
          gameType
        })
      })

      const data = await response.json()
      return data.advice

    } catch (error) {
      console.error('Hunt Wet LLM error:', error)
      // Fallback to OpenAI if your LLM is down
      return this.fallbackToOpenAI(question, context)
    }
  }

  private async fallbackToOpenAI(question: string, context: string): Promise<string> {
    // Backup system using OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: `${question}\n\nContext: ${context}`
          }
        ]
      })
    })

    const data = await response.json()
    return data.choices[0].message.content
  }

  // Method to train your LLM with user interactions
  async logInteractionForTraining(
    question: string,
    response: string,
    userFeedback: 'helpful' | 'not_helpful',
    zipCode: string,
    huntingOutcome?: any
  ): Promise<void> {

    // Send interaction data back to improve YOUR LLM
    await fetch(`${this.llmEndpoint}/log-interaction`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUNT_WET_LLM_API_KEY}`
      },
      body: JSON.stringify({
        question,
        response,
        userFeedback,
        zipCode,
        huntingOutcome,
        timestamp: new Date().toISOString()
      })
    })
  }
}