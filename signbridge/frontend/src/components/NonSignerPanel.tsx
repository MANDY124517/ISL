/**
 * NonSignerPanel – text / voice input for the non-signer.
 */
import { Mic, MicOff, Send } from 'lucide-react'
import { useState } from 'react'
import type { STTStatus } from '../hooks/useSpeech'

interface NonSignerPanelProps {
  sttStatus: STTStatus
  sttSupported: boolean
  sttError: string | null
  onSend: (text: string) => void
  onStartListening: () => void
  onStopListening: () => void
}

export function NonSignerPanel({
  sttStatus,
  sttSupported,
  sttError,
  onSend,
  onStartListening,
  onStopListening,
}: NonSignerPanelProps) {
  const [inputText, setInputText] = useState('')

  const handleSend = () => {
    if (!inputText.trim()) return
    onSend(inputText.trim())
    setInputText('')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const isListening = sttStatus === 'listening'

  return (
    <div className="card flex flex-col gap-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-gray-100">Non-Signer Response</h2>
        <p className="text-xs text-gray-500 mt-0.5">Type or speak your reply</p>
      </div>

      {/* Text input */}
      <div className="px-4 py-3 flex gap-2 items-end">
        <textarea
          className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-3 py-2.5
                     text-gray-100 text-sm placeholder-gray-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-brand-500
                     focus:border-transparent transition-colors"
          rows={2}
          placeholder="Type a message… (Enter to send)"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Type a message"
        />
        <button
          className="btn-primary self-end"
          onClick={handleSend}
          disabled={!inputText.trim()}
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>

      {/* Voice input */}
      <div className="px-4 pb-4">
        {sttSupported ? (
          <button
            className={
              isListening
                ? 'btn bg-red-700 hover:bg-red-600 text-white w-full justify-center animate-pulse-slow'
                : 'btn-secondary w-full justify-center'
            }
            onClick={isListening ? onStopListening : onStartListening}
            aria-label={isListening ? 'Stop listening' : 'Start voice input'}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4" />
                Listening… (click to stop)
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Speak
              </>
            )}
          </button>
        ) : (
          <p className="text-xs text-gray-500 text-center">
            Voice input not available in this browser.
          </p>
        )}

        {sttError && (
          <p className="text-xs text-red-400 mt-2 text-center">{sttError}</p>
        )}
      </div>
    </div>
  )
}

