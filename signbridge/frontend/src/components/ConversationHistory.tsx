/**
 * ConversationHistory – chat-style display of the conversation.
 */
import { Bot, User } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { ConversationMessage } from '../types'
import { cn } from '../utils'
import { ISLVisualCard } from './ISLVisualCard'

interface ConversationHistoryProps {
  messages: ConversationMessage[]
}

export function ConversationHistory({ messages }: ConversationHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  if (messages.length === 0) {
    return (
      <div className="card flex items-center justify-center py-12 px-4 text-center">
        <div className="space-y-2">
          <p className="text-3xl">🤟</p>
          <p className="text-gray-500 text-sm">
            The conversation will appear here.
            <br />
            Start signing to get started!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-gray-100">Conversation</h2>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 max-h-80">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex gap-3 animate-slide-up',
              msg.role === 'non-signer' ? 'flex-row-reverse' : 'flex-row',
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
                msg.role === 'isl-user'
                  ? 'bg-brand-800 text-brand-200'
                  : msg.role === 'non-signer'
                  ? 'bg-emerald-900 text-emerald-200'
                  : 'bg-gray-800 text-gray-400',
              )}
            >
              {msg.role === 'isl-user' ? (
                <span className="text-sm">🤟</span>
              ) : msg.role === 'non-signer' ? (
                <User className="w-4 h-4" />
              ) : (
                <Bot className="w-4 h-4" />
              )}
            </div>

            {/* Bubble */}
            <div
              className={cn(
                'max-w-[75%] rounded-2xl px-4 py-2.5',
                msg.role === 'isl-user'
                  ? 'bg-brand-800/50 border border-brand-700 text-brand-100'
                  : msg.role === 'non-signer'
                  ? 'bg-emerald-900/50 border border-emerald-800 text-emerald-100'
                  : 'bg-gray-800 text-gray-300',
              )}
            >
              <p className="text-sm font-medium leading-relaxed">{msg.text}</p>
              {msg.role === 'non-signer' && <ISLVisualCard text={msg.text} />}
              <p className="text-xs opacity-50 mt-1">
                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}

