/**
 * App: Main layout coordinating two-way communication, camera stream, inference, and modals.
 * Compliant with user design specifications (zero emojis, zero Lucide, zero harsh gradients).
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { CameraPanel } from './components/CameraPanel'
import { SentenceBuilder } from './components/SentenceBuilder'
import { NonSignerPanel } from './components/NonSignerPanel'
import { ConversationHistory } from './components/ConversationHistory'
import { StatusBar } from './components/StatusBar'
import { TermsModal, PrivacyModal } from './components/LegalModals'
import { useCamera } from './hooks/useCamera'
import { usePrediction } from './hooks/usePrediction'
import { useTTS, useSTT } from './hooks/useSpeech'
import { api } from './services/api'
import { playRecognitionChime } from './utils/audio'
import type { AppMode, ModelInfoResponse } from './types'

const CONFIDENCE_THRESHOLD = 0.80

export default function App() {
  const [mode, setMode] = useState<AppMode>('live')
  const [fps, setFps] = useState<number>(8)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null)
  const [termsOpen, setTermsOpen] = useState<boolean>(false)
  const [privacyOpen, setPrivacyOpen] = useState<boolean>(false)

  const lastChimedWordRef = useRef<string | null>(null)

  // ── Prediction & Conversation State ─────────────────────────────────────────
  const {
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
    sentenceText,
  } = usePrediction({ mode, inferenceFps: fps })

  // ── Camera Feed Management ─────────────────────────────────────────────────
  const { videoRef, status: camStatus, error: camError, startCamera, stopCamera } = useCamera({
    inferenceFps: fps,
    onFrame: handleFrame,
  })

  // ── Accessible Audio Tone on High-Confidence Recognition ────────────────────
  useEffect(() => {
    if (
      soundEnabled &&
      currentPrediction &&
      currentConfidence >= CONFIDENCE_THRESHOLD &&
      currentPrediction !== lastChimedWordRef.current
    ) {
      playRecognitionChime()
      lastChimedWordRef.current = currentPrediction
    }
  }, [currentPrediction, currentConfidence, soundEnabled])

  // ── Text-to-Speech (Web Speech API) ─────────────────────────────────────────
  const { speak, stop: stopSpeak, speaking } = useTTS()

  // ── Speech-to-Text (Web Speech API) ─────────────────────────────────────────
  const handleSttResult = useCallback(
    (text: string) => {
      addNonSignerMessage(text)
    },
    [addNonSignerMessage],
  )
  const {
    startListening,
    stopListening,
    status: sttStatus,
    error: sttError,
    supported: sttSupported,
  } = useSTT(handleSttResult)

  // ── Model Telemetry ─────────────────────────────────────────────────────────
  useEffect(() => {
    api.modelInfo().then(setModelInfo).catch(() => null)
  }, [])

  // ── Action Handlers ────────────────────────────────────────────────────────
  const handleConfirm = useCallback(() => {
    const text = confirmSentence()
    if (text) speak(text)
  }, [confirmSentence, speak])

  const handleNonSignerSend = useCallback(
    (text: string) => {
      addNonSignerMessage(text)
    },
    [addNonSignerMessage],
  )

  return (
    <div className="min-h-screen flex flex-col bg-[#111418] text-gray-100 font-sans">
      <Header
        mode={mode}
        onModeChange={setMode}
        backendAvailable={backendAvailable ?? false}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-5">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Direction A: ISL User Side (Webcam input + Sentence builder) */}
          <div className="flex flex-col gap-5">
            <CameraPanel
              videoRef={videoRef}
              status={camStatus}
              error={camError}
              prediction={currentPrediction}
              confidence={currentConfidence}
              onStart={startCamera}
              onStop={stopCamera}
              isDemo={mode === 'demo'}
              fps={fps}
              onFpsChange={setFps}
              soundEnabled={soundEnabled}
              onToggleSound={() => setSoundEnabled((prev) => !prev)}
            />

            <SentenceBuilder
              sentence={sentence}
              currentPrediction={currentPrediction}
              currentConfidence={currentConfidence}
              confidenceThreshold={CONFIDENCE_THRESHOLD}
              speaking={speaking}
              onAddWord={addWord}
              onRemoveLastWord={removeLastWord}
              onClearSentence={clearSentence}
              onConfirm={handleConfirm}
              onSpeak={() => speak(sentenceText)}
              onStopSpeak={stopSpeak}
            />
          </div>

          {/* Direction B: Non-Signer Side (Transcript + Voice/Text input) */}
          <div className="flex flex-col gap-5">
            <ConversationHistory messages={messages} />

            <NonSignerPanel
              sttStatus={sttStatus}
              sttSupported={sttSupported}
              sttError={sttError}
              onSend={handleNonSignerSend}
              onStartListening={startListening}
              onStopListening={stopListening}
            />
          </div>
        </div>
      </main>

      <StatusBar
        modelName={modelInfo?.model}
        numClasses={modelInfo?.classes}
        confidenceThreshold={modelInfo?.confidence_threshold ?? CONFIDENCE_THRESHOLD}
        onOpenTerms={() => setTermsOpen(true)}
        onOpenPrivacy={() => setPrivacyOpen(true)}
      />

      {/* Policy Modals */}
      <TermsModal isOpen={termsOpen} onClose={() => setTermsOpen(false)} />
      <PrivacyModal isOpen={privacyOpen} onClose={() => setPrivacyOpen(false)} />
    </div>
  )
}
