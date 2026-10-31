import { useCallback, useEffect, useRef, useState } from 'react'
import { Header } from './components/Header'
import { CameraPanel } from './components/CameraPanel'
import { SentenceBuilder } from './components/SentenceBuilder'
import { NonSignerPanel } from './components/NonSignerPanel'
import { ConversationHistory } from './components/ConversationHistory'
import { StatusBar } from './components/StatusBar'
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

  const lastChimedWordRef = useRef<string | null>(null)

  // ── Prediction / conversation state ───────────────────────────────────────
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

  // ── Camera ────────────────────────────────────────────────────────────────
  const { videoRef, status: camStatus, error: camError, startCamera, stopCamera } = useCamera({
    inferenceFps: fps,
    onFrame: handleFrame,
  })

  // ── Audio chime on accepted prediction ────────────────────────────────────
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

  // ── TTS ───────────────────────────────────────────────────────────────────
  const { speak, stop: stopSpeak, speaking } = useTTS()

  // ── STT ───────────────────────────────────────────────────────────────────
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

  // ── Load model info ───────────────────────────────────────────────────────
  useEffect(() => {
    api.modelInfo().then(setModelInfo).catch(() => null)
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────
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
    <div className="min-h-screen flex flex-col">
      <Header mode={mode} onModeChange={setMode} backendAvailable={backendAvailable ?? false} />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ── Left column: ISL User side ── */}
          <div className="flex flex-col gap-6">
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

          {/* ── Right column: Non-Signer side ── */}
          <div className="flex flex-col gap-6">
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
      />
    </div>
  )
}
