/**
 * NonSignerPanel: Text and microphone speech-to-text input interface for the non-signer.
 * Direction B (Non-Signer -> ISL User). Zero emojis, clean architectural borders.
 */
import { useState } from 'react'
import { MicIcon, MicOffIcon, SendIcon } from './icons'
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
    <div className="card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2c3542] bg-[#14171c]">
        <h2 className="font-semibold text-sm text-gray-200">Non-Signer Input Interface</h2>
        <p className="text-[11px] text-gray-400 font-mono mt-0.5">
          Direction B: Speech or Text translated to ISL visual cues
        </p>
      </div>

      {/* Input area */}
      <div className="p-4 space-y-3 bg-[#181c22]">
        <div className="space-y-1.5">
          <label htmlFor="non-signer-input" className="text-xs text-gray-400 font-mono">
            Type response (Press Enter to transmit):
          </label>
          <div className="flex gap-2">
            <textarea
              id="non-signer-input"
              className="flex-1 bg-[#111418] border border-[#2c3542] rounded-sm px-3 py-2
                         text-gray-100 text-sm font-sans placeholder-gray-500 resize-none
                         focus:outline-none focus:border-[#0284c7] transition-colors"
              rows={2}
              placeholder="Enter message for the ISL user..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Enter message for the ISL user"
            />
            <button
              className="btn btn-primary self-end h-[42px] px-4"
              onClick={handleSend}
              disabled={!inputText.trim()}
              aria-label="Send response to ISL user"
            >
              <SendIcon className="w-4 h-4" />
              Transmit
            </button>
          </div>
        </div>

        {/* Speech-to-Text Controller */}
        <div className="pt-2 border-t border-[#2c3542]">
          {sttSupported ? (
            <button
              className={
                isListening
                  ? 'btn btn-danger w-full justify-center'
                  : 'btn btn-secondary w-full justify-center'
              }
              onClick={isListening ? onStopListening : onStartListening}
              aria-label={isListening ? 'Halt speech transcription' : 'Start voice transcription'}
            >
              {isListening ? (
                <>
                  <MicOffIcon className="w-4 h-4" />
                  <span className="font-mono">Listening... Click to conclude audio</span>
                </>
              ) : (
                <>
                  <MicIcon className="w-4 h-4" />
                  <span>Voice Dictation (Microphone Speech-to-Text)</span>
                </>
              )}
            </button>
          ) : (
            <div className="bg-[#1f242c] border border-[#2c3542] px-3 py-2 rounded-sm text-center">
              <p className="text-xs text-gray-400 font-mono">
                Speech recognition API is unavailable in this browser environment.
              </p>
            </div>
          )}

          {sttError && (
            <p className="text-xs text-red-400 mt-2 font-mono text-center">
              Audio Error: {sttError}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
