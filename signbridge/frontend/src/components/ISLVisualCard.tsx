/**
 * ISLVisualCard: Visual gesture breakdown and sign instructions for reverse communication.
 * Direction B (Non-Signer -> ISL User). Completely emoji-free, accessible, technical.
 */
import { useState } from 'react'
import { EyeIcon, HandIcon } from './icons'

interface GestureDetail {
  label: string
  poseNotation: string
  execution: string
}

const KNOWN_GESTURES: Record<string, GestureDetail> = {
  HELLO: {
    label: 'HELLO',
    poseNotation: '[TEMPLE-WAVE]',
    execution: 'Open right palm positioned at temple level, executing outward greeting wave.',
  },
  HI: {
    label: 'HI',
    poseNotation: '[TEMPLE-WAVE]',
    execution: 'Open right palm positioned at temple level, executing outward greeting wave.',
  },
  THANK: {
    label: 'THANK YOU',
    poseNotation: '[CHIN-FORWARD]',
    execution: 'Flat right hand fingertips contact chin, extending directly outward toward partner.',
  },
  THANKS: {
    label: 'THANKS',
    poseNotation: '[CHIN-FORWARD]',
    execution: 'Flat right hand fingertips contact chin, extending directly outward toward partner.',
  },
  YES: {
    label: 'YES',
    poseNotation: '[FIST-NOD]',
    execution: 'Closed S-fist executing vertical nodding motion simulating affirmative head gesture.',
  },
  NO: {
    label: 'NO',
    poseNotation: '[FINGERS-SNAP]',
    execution: 'Extended index and middle finger snap briskly onto extended thumb.',
  },
  HELP: {
    label: 'HELP',
    poseNotation: '[PALM-ELEVATE]',
    execution: 'Thumbs-up right fist seated onto open left palm, both hands lifting upward in unison.',
  },
  PLEASE: {
    label: 'PLEASE',
    poseNotation: '[CHEST-CIRCLE]',
    execution: 'Flat open palm rubbing clockwise circular trajectory across chest center.',
  },
  GOOD: {
    label: 'GOOD',
    poseNotation: '[LIP-TO-PALM]',
    execution: 'Right fingertips contact lips, descending firmly into stationary open left palm.',
  },
  FINE: {
    label: 'FINE',
    poseNotation: '[CHEST-TAP]',
    execution: 'Open 5-hand thumb tapping sternum repeatedly with fingers spread.',
  },
  HOW: {
    label: 'HOW',
    poseNotation: '[ROLL-OUTWARD]',
    execution: 'Curved hands with backs touching, rolling forward and upward until palms face up.',
  },
  YOU: {
    label: 'YOU',
    poseNotation: '[DEICTIC-FORWARD]',
    execution: 'Dominant index finger pointing straight at the conversational counterpart.',
  },
  WELCOME: {
    label: 'WELCOME',
    poseNotation: '[PALM-SWEEP]',
    execution: 'Open hand sweeping inward from the side toward the body center line.',
  },
  SORRY: {
    label: 'SORRY',
    poseNotation: '[HEART-CIRCLE]',
    execution: 'Closed A-fist rotating in small circular motion over the cardiac region.',
  },
  WATER: {
    label: 'WATER',
    poseNotation: '[W-HAND-CHIN]',
    execution: 'W-handshape index, middle, and ring fingers tapping lower lip twice.',
  },
}

interface ISLVisualCardProps {
  text: string
}

export function ISLVisualCard({ text }: ISLVisualCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Tokenize and clean text into uppercase terms
  const words = text
    .toUpperCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const matchedGestures = words
    .map((w) => ({ word: w, gesture: KNOWN_GESTURES[w] }))
    .filter((item): item is { word: string; gesture: GestureDetail } => item.gesture !== undefined)

  return (
    <div className="mt-3 pt-2.5 border-t border-[#2c3542] text-left">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
          <HandIcon className="w-3.5 h-3.5 text-[#0284c7]" />
          ISL Visual Representation
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] font-mono text-[#0284c7] hover:text-[#38bdf8] flex items-center gap-1 transition-colors"
          aria-label="Toggle sign execution description"
        >
          <EyeIcon className="w-3 h-3" />
          {expanded ? 'Collapse Details' : 'Inspect Notation'}
        </button>
      </div>

      {/* Visual Gesture Badges */}
      {matchedGestures.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {matchedGestures.map(({ word, gesture }) => (
            <div
              key={word}
              className="inline-flex items-center gap-1.5 bg-[#14171c] border border-[#2c3542] px-2 py-1 text-xs rounded-sm"
            >
              <span className="font-mono text-[10px] text-[#0284c7] font-bold">
                {gesture.poseNotation}
              </span>
              <span className="font-mono font-semibold text-gray-200">{gesture.label}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Orthographic fingerspelling tiles for terms outside recognized database */
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1">
            {words.slice(0, 5).map((w, idx) => (
              <span
                key={idx}
                className="bg-[#14171c] border border-[#2c3542] px-1.5 py-0.5 text-[11px] font-mono text-gray-300 rounded-sm"
              >
                [FS] {w}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-gray-500 font-mono">
            Direct manual fingerspelling (letter-by-letter) representation.
          </p>
        </div>
      )}

      {/* Expanded Pose Execution Details */}
      {expanded && (
        <div className="mt-2.5 space-y-2 bg-[#111418] p-3 border border-[#2c3542] text-xs text-gray-300 rounded-sm">
          {matchedGestures.length > 0 ? (
            matchedGestures.map(({ word, gesture }) => (
              <div key={word} className="space-y-0.5 border-b border-[#1f242c] pb-2 last:border-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-gray-100">{gesture.label}</span>
                  <span className="text-[10px] font-mono text-[#0284c7]">{gesture.poseNotation}</span>
                </div>
                <p className="text-xs text-gray-400 font-sans leading-normal">
                  {gesture.execution}
                </p>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-xs font-mono">
              Displaying standardized Indian Sign Language manual fingerspelling glyphs.
            </p>
          )}
        </div>
      )}
    </div>
  )
}
