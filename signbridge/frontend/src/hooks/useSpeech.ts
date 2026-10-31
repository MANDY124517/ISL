/**
 * useSpeech: Text-to-Speech and Speech-to-Text via Web Speech API.
 */
import { useCallback, useRef, useState } from 'react'

// ── TTS ────────────────────────────────────────────────────────────────────────

export function useTTS() {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const speak = useCallback(
    (text: string, rate = 1.0) => {
      if (!supported || !text.trim()) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.rate = rate
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    },
    [supported],
  )

  const stop = useCallback(() => {
    window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [])

  return { speak, stop, speaking, supported }
}

// ── STT ────────────────────────────────────────────────────────────────────────

export type STTStatus = 'idle' | 'listening' | 'error'

interface IWindowWithSpeech extends Window {
  SpeechRecognition?: any
  webkitSpeechRecognition?: any
}

export function useSTT(onResult: (text: string) => void) {
  const recognizerRef = useRef<any>(null)
  const [status, setStatus] = useState<STTStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const win = typeof window !== 'undefined' ? (window as unknown as IWindowWithSpeech) : null
  const SpeechRecognitionCtor = win?.SpeechRecognition ?? win?.webkitSpeechRecognition ?? null
  const supported = Boolean(SpeechRecognitionCtor)

  const startListening = useCallback(() => {
    if (!SpeechRecognitionCtor) {
      setError('Speech recognition is not supported in this browser.')
      setStatus('error')
      return
    }
    const recognition = new SpeechRecognitionCtor()
    recognition.lang = 'en-IN'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.continuous = false

    recognition.onstart = () => {
      setStatus('listening')
      setError(null)
    }

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript ?? ''
      if (transcript.trim()) onResult(transcript.trim())
    }

    recognition.onerror = (event: any) => {
      setError(`Speech error: ${event.error ?? 'unknown'}`)
      setStatus('error')
    }

    recognition.onend = () => setStatus('idle')

    recognizerRef.current = recognition
    recognition.start()
  }, [SpeechRecognitionCtor, onResult])

  const stopListening = useCallback(() => {
    recognizerRef.current?.stop()
    setStatus('idle')
  }, [])

  return { startListening, stopListening, status, error, supported }
}
