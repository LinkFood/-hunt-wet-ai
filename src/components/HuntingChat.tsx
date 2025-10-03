'use client'

import { useState } from 'react'
import { Send, Target, Crosshair } from 'lucide-react'
import OutcomeTracker from './OutcomeTracker'

interface Message {
  id: string
  type: 'user' | 'ai'
  content: string
  timestamp: Date
  sessionId?: string  // Track which database session this advice came from
}

interface HuntingChatProps {
  hasZipCode?: boolean
  zipCode?: string
  gameType?: string | null
  onZipCodeSubmission?: (zip: string, gameType?: string) => void
  onGameTypeChange?: (gameType: string) => void
}

export default function HuntingChat({
  hasZipCode = false,
  zipCode = '',
  gameType = null,
  onZipCodeSubmission,
  onGameTypeChange
}: HuntingChatProps = {}) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'ai',
      content: hasZipCode
        ? `🎯 **YOUR ${zipCode} HUNTING INTELLIGENCE IS ACTIVE**\n\nI'm your hyper-local hunting guide for ${zipCode}. I learn from every hunter in your area to give you the best predictions.\n\n**Current ${zipCode} Analysis:**\n✅ **Local Weather** - Tracking patterns specific to your hunting area\n✅ **Pressure Systems** - Monitoring how they affect game movement in ${zipCode}\n✅ **Success Patterns** - Learning from local hunter reports\n✅ **Regulations** - Up-to-date for your specific hunting zone\n✅ **Community Intel** - Real feedback from ${zipCode} hunters\n\n**Ask me about:**\n• "Best hunting times for ${zipCode} this week?"\n• "Where are other hunters having success locally?"\n• "How's this weather pattern affecting game movement here?"\n\n*I get smarter about ${zipCode} hunting patterns with every conversation and success report!*`
        : "I can help you plan your next hunting trip. Just tell me your ZIP code and what you're hunting (like '10001 deer' or '90210 ducks') and I'll provide personalized hunting intelligence for your area.",
      timestamp: new Date()
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showQuickActions, setShowQuickActions] = useState(true)

  const handleOutcomeLogged = () => {
    // Could refresh data or show success message here
    console.log('Outcome logged successfully!')
  }

  const handleQuickAction = (question: string) => {
    setInput(question)
    setShowQuickActions(false)
    sendMessage(question)
  }

  const sendMessage = async (messageText?: string) => {
    const messageToSend = messageText || input
    if (!messageToSend.trim() || isLoading) return

    // Check if message contains ZIP code and game type (if not already set)
    if (!hasZipCode && onZipCodeSubmission) {
      const zipMatch = messageToSend.match(/\b\d{5}\b/)
      if (zipMatch) {
        const detectedZip = zipMatch[0]
        let detectedGameType = null

        // Only auto-detect game type if explicitly mentioned
        if (messageToSend.toLowerCase().includes('big game') ||
            messageToSend.toLowerCase().includes('deer') ||
            messageToSend.toLowerCase().includes('elk') ||
            messageToSend.toLowerCase().includes('bear') ||
            messageToSend.toLowerCase().includes('moose')) {
          detectedGameType = 'big-game'
        } else if (messageToSend.toLowerCase().includes('upland') ||
                   messageToSend.toLowerCase().includes('duck') ||
                   messageToSend.toLowerCase().includes('bird') ||
                   messageToSend.toLowerCase().includes('waterfowl') ||
                   messageToSend.toLowerCase().includes('pheasant') ||
                   messageToSend.toLowerCase().includes('grouse')) {
          detectedGameType = 'upland'
        }
        // If no game type detected, pass null to trigger game selection step

        onZipCodeSubmission(detectedZip, detectedGameType)
        return // Let parent component handle the state change
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: messageToSend,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    setShowQuickActions(false)

    try {
      const response = await fetch('/api/hunting-advice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userMessage: messageToSend,
          // Add context data here later
        }),
      })

      const data = await response.json()

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: data.advice || "I'm having trouble right now. Try again in a moment.",
        timestamp: new Date(),
        sessionId: data.sessionId
      }

      setMessages(prev => [...prev, aiMessage])
    } catch (error) {
      console.error('Error getting AI advice:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: "Something went wrong. Please try again.",
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-6">
        {messages.map((message) => (
          <div key={message.id}>
            <div className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xl px-4 py-3 rounded-2xl ${
                  message.type === 'user'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-800 text-gray-100'
                }`}
              >
                <div className="text-sm whitespace-pre-line leading-relaxed">
                  {message.content}
                </div>
              </div>
            </div>

            {/* Add OutcomeTracker after AI messages that have sessionId */}
            {message.type === 'ai' && message.sessionId && (
              <div className="max-w-xl">
                <OutcomeTracker
                  sessionId={message.sessionId}
                  onOutcomeLogged={handleOutcomeLogged}
                />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-800 text-gray-100 max-w-xl px-4 py-3 rounded-2xl">
              <div className="flex items-center space-x-2">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <span className="text-sm text-gray-300">Analyzing...</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Game Type Toggles - Only show if ZIP is set */}
      {hasZipCode && onGameTypeChange && (
        <div className="mb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => onGameTypeChange('big-game')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                gameType === 'big-game'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Target className="w-3 h-3 inline mr-1" />
              Big Game
            </button>
            <button
              onClick={() => onGameTypeChange('upland')}
              className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                gameType === 'upland'
                  ? 'bg-orange-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Crosshair className="w-3 h-3 inline mr-1" />
              Upland
            </button>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="relative">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={hasZipCode ? "Ask about hunting conditions, timing, or strategies..." : "Enter your ZIP code and what you're hunting (e.g., '10001 deer')"}
          className="w-full px-4 py-3 bg-gray-800 border border-gray-700 text-gray-100 placeholder-gray-400 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
          rows={1}
          disabled={isLoading}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim() || isLoading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 bg-orange-600 text-white rounded-full hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}