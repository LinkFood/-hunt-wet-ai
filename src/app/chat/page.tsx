'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Send, MessageSquare } from 'lucide-react'
import { trackChatMessage } from '@/lib/supabase-setup'

interface HuntLocation {
  lat: number
  lon: number
  displayName: string
  displayZip: string
}

interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export default function ChatPage() {
  const [location, setLocation] = useState<HuntLocation | null>(null)
  const [gameType, setGameType] = useState<string>('big-game')
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    const savedLocation = localStorage.getItem('huntWet_location')
    const savedGame = localStorage.getItem('huntWet_gameType')

    if (!savedLocation) {
      router.push('/')
      return
    }

    try {
      const parsedLocation = JSON.parse(savedLocation) as HuntLocation
      setLocation(parsedLocation)
      setGameType(savedGame || 'big-game')

      // Welcome message
      setMessages([
        {
          role: 'assistant',
          content: `Hey! I'm Hunt Wet AI, your personal hunting intelligence system. I've analyzed the weather, terrain, and hunting patterns for ${parsedLocation.displayName}. Ask me anything about hunting conditions, tactics, timing, or specific game behavior in your area.`,
          timestamp: new Date()
        }
      ])
    } catch (error) {
      console.error('Error loading location:', error)
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!input.trim() || loading || !location) return

    const userMessage = input.trim()
    setInput('')
    setLoading(true)

    // Add user message
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    }
    setMessages((prev) => [...prev, newUserMessage])

    try {
      // DATA COLLECTION: Track chat message
      try {
        await trackChatMessage({
          location_name: location.displayName,
          latitude: location.lat,
          longitude: location.lon,
          game_type: gameType,
          user_message: userMessage
        })
      } catch (error) {
        console.error('Failed to track chat message:', error)
      }

      // Call AI chat API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location,
          gameType,
          messages: [...messages, newUserMessage].map((m) => ({
            role: m.role,
            content: m.content
          })),
          userMessage
        })
      })

      const data = await response.json()

      if (data.success) {
        const assistantMessage: Message = {
          role: 'assistant',
          content: data.response,
          timestamp: new Date()
        }
        setMessages((prev) => [...prev, assistantMessage])

        // Show premium tease occasionally
        if (Math.random() > 0.7) {
          setTimeout(() => {
            const premiumTease: Message = {
              role: 'assistant',
              content: '💎 Want even deeper insights? Hunt Wet Pro gives you outcome tracking, success pattern analysis, and personalized hunting calendars. Upgrade anytime.',
              timestamp: new Date()
            }
            setMessages((prev) => [...prev, premiumTease])
          }, 2000)
        }
      } else {
        throw new Error(data.error || 'Failed to get response')
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        role: 'assistant',
        content: "Sorry, I'm having trouble responding right now. Please try again.",
        timestamp: new Date()
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  if (!location) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-700 text-white px-6 py-4 shadow-lg">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => router.push('/hub')}
              className="hover:bg-orange-800 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">Hunt Wet AI</h1>
              <p className="text-sm text-orange-100">{location.displayName}</p>
            </div>
          </div>
          <MessageSquare className="w-6 h-6" />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8 bg-gray-50">
        <div className="max-w-4xl mx-auto space-y-6">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                  message.role === 'user'
                    ? 'bg-orange-600 text-white'
                    : message.content.includes('💎')
                    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white border-2 border-purple-400'
                    : 'bg-white text-gray-900 border-2 border-gray-200'
                }`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-2 ${
                    message.role === 'user' ? 'text-orange-100' : 'text-gray-400'
                  }`}
                >
                  {message.timestamp.toLocaleTimeString('en-US', {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  })}
                </p>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-white border-2 border-gray-200 rounded-2xl px-6 py-4">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                  <div className="w-3 h-3 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t-2 border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex space-x-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask about hunting conditions, tactics, timing..."
              className="flex-1 px-6 py-4 bg-gray-50 border-2 border-gray-300 text-gray-900 text-lg rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-200 focus:border-orange-500 placeholder-gray-400"
              disabled={loading}
            />
            <button
              onClick={handleSendMessage}
              disabled={loading || !input.trim()}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold px-8 py-4 rounded-2xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <Send className="w-5 h-5" />
              <span>Send</span>
            </button>
          </div>
          <p className="text-xs text-gray-500 text-center mt-3">
            Powered by real-time weather, terrain analysis, and hunting intelligence
          </p>
        </div>
      </div>
    </div>
  )
}
