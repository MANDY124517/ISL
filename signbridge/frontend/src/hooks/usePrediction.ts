/**
 * usePrediction: Manages the inference loop, sentence buffer,
 * and conversation history.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../services/api'
import type { AppMode, ConversationMessage, PredictionResponse } from '../types'

let _msgId = 0
const nextId = () => String(++_msgId)

interface UsePredictionOptions {
  mode: AppMode
  inferenceFps?: number
}

export function usePrediction({ mode, inferenceFps = 8 }: UsePredictionOptions) {
  const [currentPrediction, setCurrentPrediction] = useState<string | null>(null)
  const [currentConfidence, setCurrentConfidence] = useState<number>(0)
  const [sentence, setSentence] = useState<string[]>([])
  const [messages, setMessages] = useState<ConversationMessage[]>([])
  const [backendAvailable, setBackendAvailable] = useState<boolean | null>(null)

  // Track demo-mode cycling
  const demoWords = useRef<string[]>(['HELLO', 'HOW', 'ARE', 'YOU'])
  const demoIdx = useRef(0)

  // ── Backend health check ──────────────────────────────────────────────────
  useEffect(() => {
    api
      .health()
      .then(() => setBackendAvailable(true))
      .catch(() => setBackendAvailable(false))
  }, [])

  // ── Process a raw frame (base64 JPEG) ──────────────────────────────────────
  const handleFrame = useCallback(
    async (base64: string) => {
      if (mode === 'demo') {
        // Demo mode: cycle through preset words
        const word = demoWords.current[demoIdx.current % demoWords.current.length]
        setCurrentPrediction(word)
        setCurrentConfidence(0.92)
        return
      }

      if (backendAvailable === false) return

      try {
        const result: PredictionResponse = await api.predictBase64(base64)
        setCurrentPrediction(result.prediction)
        setCurrentConfidence(result.confidence)
        if (result.accepted && result.prediction) {
          // Auto-add confident predictions
          // (user can also manually confirm via button)
        }
      } catch {
        // Silently ignore transient inference errors
      }
    },
    [mode, backendAvailable],
  )

  // ── Sentence buffer controls ──────────────────────────────────────────────
  const addWord = useCallback((word?: string) => {
    const w = word ?? currentPrediction
    if (w) setSentence((prev) => [...prev, w])
  }, [currentPrediction])

  const removeLastWord = useCallback(() => {
    setSentence((prev) => prev.slice(0, -1))
  }, [])

  const clearSentence = useCallback(() => {
    setSentence([])
  }, [])

  const confirmSentence = useCallback(() => {
    const text = sentence.join(' ')
    if (!text.trim()) return
    const msg: ConversationMessage = {
      id: nextId(),
      role: 'isl-user',
      text,
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
    setSentence([])
    setCurrentPrediction(null)
    return text
  }, [sentence])

  // ── Non-signer response ───────────────────────────────────────────────────
  const addNonSignerMessage = useCallback((text: string) => {
    if (!text.trim()) return
    const msg: ConversationMessage = {
      id: nextId(),
      role: 'non-signer',
      text: text.trim(),
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, msg])
  }, [])

  // ── Demo mode auto-advance ────────────────────────────────────────────────
  useEffect(() => {
    if (mode !== 'demo') return
    const timer = setInterval(() => {
      demoIdx.current = (demoIdx.current + 1) % demoWords.current.length
    }, 2000)
    return () => clearInterval(timer)
  }, [mode])

  return {
    currentPrediction,
    currentConfidence,
    sentence,
    messages,
    backendAvailable,
    handleFrame,
    addWord,
    removeLastWord,
    clearSentence,
    confirmSentence,
    addNonSignerMessage,
    sentenceText: sentence.join(' '),
  }
}

