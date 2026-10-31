/**
 * CameraPanel – webcam preview with prediction overlay, FPS control, and accessibility features.
 */
import { Camera, CameraOff, Video, Sliders, Volume2, VolumeX, FlipHorizontal } from 'lucide-react'
import { useState } from 'react'
import type { RefObject } from 'react'
import { cn, confidenceColor, confidenceTextColor, formatConfidence } from '../utils'
import type { CameraStatus } from '../types'

interface CameraPanelProps {
  videoRef: RefObject<HTMLVideoElement>
  status: CameraStatus
  error: string | null
  prediction: string | null
  confidence: number
  onStart: () => void
  onStop: () => void
  isDemo: boolean
  fps: number
  onFpsChange: (fps: number) => void
  soundEnabled: boolean
  onToggleSound: () => void
}

export function CameraPanel({
  videoRef,
  status,
  error,
  prediction,
  confidence,
  onStart,
  onStop,
  isDemo,
  fps,
  onFpsChange,
  soundEnabled,
  onToggleSound,
}: CameraPanelProps) {
  const [mirrored, setMirrored] = useState(true)
  const isActive = status === 'active'

  return (
    <div className="card overflow-hidden flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-brand-400" />
          <span className="font-semibold text-gray-100">Camera</span>
          {isDemo && (
            <span className="text-xs bg-yellow-500/20 text-yellow-300 border border-yellow-500/30 px-2 py-0.5 rounded-full font-medium">
              DEMO
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Audio Chime Toggle */}
          <button
            onClick={onToggleSound}
            className={cn(
              'p-1.5 rounded-lg border transition-colors',
              soundEnabled
                ? 'bg-brand-900/40 border-brand-700 text-brand-300'
                : 'bg-gray-800 border-gray-700 text-gray-500',
            )}
            title={soundEnabled ? 'Recognition chime ON' : 'Recognition chime MUTED'}
            aria-label="Toggle chime"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
          </button>

          {/* Mirror Toggle */}
          <button
            onClick={() => setMirrored(!mirrored)}
            className={cn(
              'p-1.5 rounded-lg border transition-colors',
              mirrored
                ? 'bg-brand-900/40 border-brand-700 text-brand-300'
                : 'bg-gray-800 border-gray-700 text-gray-500',
            )}
            title={mirrored ? 'Mirror View ON' : 'Mirror View OFF'}
            aria-label="Toggle mirror"
          >
            <FlipHorizontal className="w-3.5 h-3.5" />
          </button>

          {/* Status indicator */}
          <div className="flex items-center gap-1.5 pl-1 border-l border-gray-800">
            <span
              className={cn(
                'w-2.5 h-2.5 rounded-full',
                isActive ? 'bg-emerald-500 animate-pulse' : 'bg-gray-600',
              )}
            />
            <span className="text-xs text-gray-400">{isActive ? 'Live' : 'Off'}</span>
          </div>
        </div>
      </div>

      {/* Video area */}
      <div className="relative bg-gray-950 aspect-video flex items-center justify-center overflow-hidden">
        {/* Video element */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover transition-opacity duration-300',
            mirrored && 'scale-x-[-1]',
            isActive ? 'opacity-100' : 'opacity-0 absolute inset-0',
          )}
          aria-label="Camera preview"
        />

        {/* Placeholder when not active */}
        {!isActive && (
          <div className="flex flex-col items-center gap-3 text-gray-500">
            <CameraOff className="w-16 h-16 opacity-60" />
            <p className="text-sm text-center px-4 text-gray-400">
              {error ?? 'Click Start Camera to begin signing'}
            </p>
          </div>
        )}

        {/* Prediction overlay */}
        {isActive && prediction && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-gray-950/85 backdrop-blur-md rounded-xl px-4 py-3 border border-gray-700 shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400">
                    Recognized Sign
                  </p>
                  <p className="text-2xl font-bold text-white tracking-wide">{prediction}</p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-gray-400 mb-0.5">
                    Confidence
                  </p>
                  <p className={cn('text-lg font-bold', confidenceTextColor(confidence))}>
                    {formatConfidence(confidence)}
                  </p>
                  <div className="confidence-bar w-24 mt-1">
                    <div
                      className={cn('confidence-fill', confidenceColor(confidence))}
                      style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* No detection state */}
        {isActive && !prediction && (
          <div className="absolute bottom-4 left-4 right-4 pointer-events-none">
            <div className="bg-gray-950/70 backdrop-blur-sm rounded-xl px-4 py-2 text-center border border-gray-800">
              <p className="text-xs text-gray-400">Sign in view of the camera to recognize gestures…</p>
            </div>
          </div>
        )}
      </div>

      {/* Controls & FPS configuration */}
      <div className="px-4 py-3 border-t border-gray-800 space-y-3">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <Sliders className="w-3.5 h-3.5 text-brand-400" />
            Inference Sampling
          </span>
          <div className="flex items-center gap-1 bg-gray-800/80 p-0.5 rounded-lg border border-gray-700/60">
            {[4, 8, 12, 16].map((rate) => (
              <button
                key={rate}
                onClick={() => onFpsChange(rate)}
                className={cn(
                  'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                  fps === rate
                    ? 'bg-brand-600 text-white font-semibold'
                    : 'text-gray-400 hover:text-gray-200',
                )}
                title={`Sample frames at ${rate} FPS`}
              >
                {rate} FPS
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-3">
          {!isActive ? (
            <button
              className="btn-primary flex-1 justify-center py-2.5 text-sm"
              onClick={onStart}
              disabled={status === 'requesting'}
              aria-label="Start camera"
            >
              <Camera className="w-4 h-4" />
              {status === 'requesting' ? 'Requesting Permission…' : 'Start Camera'}
            </button>
          ) : (
            <button
              className="btn-danger flex-1 justify-center py-2.5 text-sm"
              onClick={onStop}
              aria-label="Stop camera"
            >
              <CameraOff className="w-4 h-4" />
              Stop Camera
            </button>
          )}
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="px-4 pb-3">
          <p className="text-sm text-red-400 bg-red-950/40 border border-red-800/80 rounded-lg px-3 py-2">
            {error}
          </p>
        </div>
      )}
    </div>
  )
}
