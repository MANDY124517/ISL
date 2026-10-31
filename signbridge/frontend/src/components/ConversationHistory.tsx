/**
 * ConversationHistory: Transcript panel presenting exchanged messages in chronological order.
 * Accessible, high-contrast, zero emojis, zero soft bubble radii.
 */
import { useEffect, useRef } from 'react'
import type { ConversationMessage } from '../types'
import { cn } from '../utils'
import { ISLVisualCard } from './ISLVisualCard'
import { HandIcon, UserIcon } from './icons'

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
      <div className="card flex flex-col items-center justify-center py-10 px-6 text-center bg-[#181c22]">
        <div className="w-10 h-10 bg-[#1f242c] border border-[#2c3542] flex items-center justify-center text-gray-500 rounded-sm mb-3">
          <HandIcon className="w-5 h-5 text-gray-400" />
        </div>
        <h3 className="text-sm font-semibold text-gray-200">Session Transcript Empty</h3>
        <p className="text-xs text-gray-400 font-mono mt-1 max-w-sm">
          Confirmed signs from the ISL signer or verbal responses from the non-signer will appear here in chronological order.
        </p>
      </div>
    )
  }

  return (
    <div className="card overflow-hidden flex flex-col">
      <div className="px-4 py-3 border-b border-[#2c3542] bg-[#14171c] flex items-center justify-between">
        <h2 className="font-semibold text-sm text-gray-200">Two-Way Conversation Transcript</h2>
        <span className="text-[11px] font-mono text-gray-400">
          {messages.length} {messages.length === 1 ? 'entry' : 'entries'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-3 max-h-80 bg-[#111418]">
        {messages.map((msg) => {
          const isISLUser = msg.role === 'isl-user'
          const isNonSigner = msg.role === 'non-signer'

          return (
            <div
              key={msg.id}
              className={cn(
                'flex gap-2.5',
                isNonSigner ? 'flex-row-reverse' : 'flex-row',
              )}
            >
              {/* Role Indicator Badge */}
              <div
                className={cn(
                  'w-7 h-7 flex items-center justify-center flex-shrink-0 rounded-sm border',
                  isISLUser
                    ? 'bg-[#181c22] border-[#0284c7] text-[#0284c7]'
                    : isNonSigner
                    ? 'bg-[#181c22] border-[#22c55e] text-[#22c55e]'
                    : 'bg-[#181c22] border-[#2c3542] text-gray-400',
                )}
                title={isISLUser ? 'ISL Signer' : 'Non-Signer'}
              >
                {isISLUser ? (
                  <HandIcon className="w-4 h-4" />
                ) : (
                  <UserIcon className="w-4 h-4" />
                )}
              </div>

              {/* Message Payload Tile */}
              <div
                className={cn(
                  'max-w-[80%] rounded-sm p-3 border',
                  isISLUser
                    ? 'bg-[#181c22] border-[#2c3542] text-gray-100'
                    : isNonSigner
                    ? 'bg-[#181c22] border-[#2c3542] text-gray-100'
                    : 'bg-[#14171c] border-[#2c3542] text-gray-300',
                )}
              >
                <div className="flex items-center justify-between gap-4 mb-1 text-[10px] font-mono">
                  <span className={cn('font-bold', isISLUser ? 'text-[#0284c7]' : 'text-emerald-400')}>
                    {isISLUser ? 'ISL SIGNER' : 'NON-SIGNER'}
                  </span>
                  <span className="text-gray-500">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </div>

                <p className="text-sm font-medium leading-relaxed font-sans">{msg.text}</p>

                {/* Reverse Communication: Display ISL Visual Notation for messages from the non-signer */}
                {isNonSigner && <ISLVisualCard text={msg.text} />}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>
    </div>
  )
}
