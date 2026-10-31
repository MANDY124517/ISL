/**
 * CameraPanel: Webcam interface with live posture classification overlay and FPS selection.
 * Meets accessibility standards without harsh gradients, emojis, or liquid glass effects.
 */
import { useState } from 'react'
import type { RefObject } from 'react'
import {
  VideoIcon,
  VideoOffIcon,
  SlidersIcon,
  VolumeIcon,
  VolumeMuteIcon,
  FlipIcon,
} from './icons'
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
  const isRequesting = status === 'requesting'

  return (
    <div className="card flex flex-col">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#2c3542] bg-[#14171c]">
        <div className="flex items-center gap-2">
          <VideoIcon className="w-4 h-4 text-[#0284c7]" />
          <span className="font-semibold text-sm text-gray-200">Camera Interface</span>
          {isDemo && (
            <span className="text-[10px] bg-[#1f242c] text-amber-300 border border-[#a16207] px-1.5 py-0.2 rounded-sm font-mono font-medium">
              SIMULATION
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={onToggleSound}
            className={cn(
              'p-1.5 rounded-sm border transition-colors',
              soundEnabled
                ? 'bg-[#1f242c] border-[#0284c7] text-[#0284c7]'
                : 'bg-[#181c22] border-[#2c3542] text-gray-500',
            )}
            title={soundEnabled ? 'Recognition chime active' : 'Recognition chime muted'}
            aria-label="Toggle recognition audio tone"
          >
            {soundEnabled ? <VolumeIcon className="w-3.5 h-3.5" /> : <VolumeMuteIcon className="w-3.5 h-3.5" />}
          </button>

          {/* Mirror Toggle */}
          <button
            onClick={() => setMirrored(!mirrored)}
            className={cn(
              'p-1.5 rounded-sm border transition-colors',
              mirrored
                ? 'bg-[#1f242c] border-[#0284c7] text-[#0284c7]'
                : 'bg-[#181c22] border-[#2c3542] text-gray-500',
            )}
            title={mirrored ? 'Mirror view active' : 'Mirror view off'}
            aria-label="Toggle camera horizontal mirror"
          >
            <FlipIcon className="w-3.5 h-3.5" />
          </button>

          {/* Connection status dot */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-[#2c3542]">
            <span
              className={cn(
                'w-2 h-2 rounded-none',
                isActive ? 'bg-emerald-500' : isRequesting ? 'bg-amber-500' : 'bg-gray-600',
              )}
            />
            <span className="text-xs font-mono text-gray-400">
              {isActive ? 'ACTIVE' : isRequesting ? 'INIT' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* Video Viewport */}
      <div className="relative bg-[#0d1014] aspect-video flex items-center justify-center overflow-hidden border-b border-[#2c3542]">
        {/* Mirror-capable video feed */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={cn(
            'w-full h-full object-cover',
            mirrored && 'scale-x-[-1]',
            isActive ? 'block' : 'hidden',
          )}
          aria-label="ISL camera video stream"
        />

        {/* Loading skeleton when requesting permissions */}
        {isRequesting && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 bg-[#111418]">
            <div className="w-12 h-12 border-2 border-[#2c3542] border-t-[#0284c7] animate-spin rounded-none" />
            <p className="text-xs text-gray-300 font-mono">Initializing camera device...</p>
          </div>
        )}

        {/* Inactive camera placeholder */}
        {!isActive && !isRequesting && (
          <div className="flex flex-col items-center gap-3 text-gray-400 p-6 text-center">
            <VideoOffIcon className="w-10 h-10 text-gray-600" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-gray-300">
                {error ? `Camera Error: ${error}` : 'Camera stream is currently paused'}
              </p>
              <p className="text-xs text-gray-500 font-mono">
                Click "Start Camera" below to initiate real-time ISL posture recognition.
              </p>
            </div>
          </div>
        )}

        {/* Live prediction overlay box (flat, solid, high-contrast, zero glassmorphism) */}
        {isActive && prediction && (
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <div className="bg-[#14171c] border border-[#2c3542] px-4 py-3 rounded-sm flex items-center justify-between">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400">
                  Detected Sign Class
                </p>
                <p className="text-2xl font-bold text-gray-100 font-mono tracking-wide">
                  {prediction}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-mono uppercase tracking-wider text-gray-400 mb-0.5">
                  Classifier Confidence
                </p>
                <p className={cn('text-base font-bold font-mono', confidenceTextColor(confidence))}>
                  {formatConfidence(confidence)}
                </p>
                <div className="confidence-bar w-28 mt-1">
                  <div
                    className={cn('confidence-fill', confidenceColor(confidence))}
                    style={{ width: `${Math.min(100, Math.max(0, confidence * 100))}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* In-view instructions when streaming without active sign */}
        {isActive && !prediction && (
          <div className="absolute bottom-3 left-3 right-3 pointer-events-none">
            <div className="bg-[#14171c] border border-[#2c3542] px-3 py-1.5 text-center rounded-sm">
              <p className="text-xs text-gray-400 font-mono">
                Position your hands and upper body within frame to recognize signs.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Controls & Configuration footer */}
      <div className="px-4 py-3 space-y-3 bg-[#181c22]">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span className="flex items-center gap-1.5 font-medium">
            <SlidersIcon className="w-3.5 h-3.5 text-[#0284c7]" />
            Inference Frame Rate:
          </span>
          <div className="flex items-center gap-1 bg-[#14171c] p-0.5 border border-[#2c3542] rounded-sm">
            {[4, 8, 12, 16].map((rate) => (
              <button
                key={rate}
                onClick={() => onFpsChange(rate)}
                className={cn(
                  'px-2 py-0.5 text-xs font-mono rounded-sm transition-colors',
                  fps === rate
                    ? 'bg-[#0369a1] text-white font-bold'
                    : 'text-gray-400 hover:text-gray-200',
                )}
                aria-label={`Set inference rate to ${rate} frames per second`}
              >
                {rate} FPS
              </button>
            ))}
          </div>
        </div>

        {/* Camera Start / Stop action */}
        <div>
          {isActive ? (
            <button
              onClick={onStop}
              className="btn btn-danger w-full justify-center"
              aria-label="Stop camera stream"
            >
              <VideoOffIcon className="w-4 h-4" />
              Stop Camera
            </button>
          ) : (
            <button
              onClick={onStart}
              className="btn btn-primary w-full justify-center"
              aria-label="Start camera stream"
            >
              <VideoIcon className="w-4 h-4" />
              Start Camera
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
