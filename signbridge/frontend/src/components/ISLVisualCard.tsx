/**
 * ISLVisualCard – renders ISL visual representation for reverse communication
 * (Non-Signer -> ISL User), adhering to PRD Sections 17 & 20.
 */
import { useState } from 'react'
import { Sparkles, Eye, ChevronRight } from 'lucide-react'

// Common ISL gesture visualizations
const KNOWN_GESTURES: Record<string, { label: string; gesture: string; emoji: string; desc: string }> = {
  HELLO: { label: 'HELLO', gesture: 'Open palm waving near temple', emoji: '👋', desc: 'Touch right temple with open palm and wave outward' },
  HI: { label: 'HI', gesture: 'Open palm waving near temple', emoji: '👋', desc: 'Touch right temple with open palm and wave outward' },
  THANK: { label: 'THANK YOU', gesture: 'Fingers to chin moving outward', emoji: '🙏', desc: 'Flat hand touches chin, extends outward toward recipient' },
  THANKS: { label: 'THANKS', gesture: 'Fingers to chin moving outward', emoji: '🙏', desc: 'Flat hand touches chin, extends outward toward recipient' },
  YES: { label: 'YES', gesture: 'Fist nodding up and down', emoji: '✊', desc: 'S-fist nodding up and down like a head nod' },
  NO: { label: 'NO', gesture: 'Index and middle fingers snapping to thumb', emoji: '🤏', desc: 'Index and middle finger snap down onto thumb' },
  HELP: { label: 'HELP', gesture: 'Closed fist on open palm lifting up', emoji: '🤲', desc: 'Thumbs-up fist placed on open palm, lifted together' },
  PLEASE: { label: 'PLEASE', gesture: 'Flat hand rubbing chest clockwise', emoji: '✋', desc: 'Open hand rubbing circular motion over heart' },
  GOOD: { label: 'GOOD', gesture: 'Flat hand from mouth to palm', emoji: '👍', desc: 'Right fingertips touch lips, then drop onto left open palm' },
  FINE: { label: 'FINE', gesture: 'Open 5-hand thumb tapping chest', emoji: '👌', desc: 'Open hand with thumb repeatedly tapping chest' },
  HOW: { label: 'HOW', gesture: 'Curved hands rolling outward', emoji: '🔄', desc: 'Backs of curved hands together, rolling up and out' },
  YOU: { label: 'YOU', gesture: 'Index finger pointing forward', emoji: '👉', desc: 'Index finger pointed directly at the conversation partner' },
  WELCOME: { label: 'WELCOME', gesture: 'Open hand sweeping inward', emoji: '🤝', desc: 'Open palm sweeping toward the chest from the side' },
  SORRY: { label: 'SORRY', gesture: 'A-fist circling over heart', emoji: '🙇', desc: 'Closed fist in circular motion on chest' },
}

interface ISLVisualCardProps {
  text: string
}

export function ISLVisualCard({ text }: ISLVisualCardProps) {
  const [expanded, setExpanded] = useState(false)

  // Normalize words
  const words = text
    .toUpperCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean)

  const matchedGestures = words
    .map((w) => ({ word: w, gesture: KNOWN_GESTURES[w] }))
    .filter((item) => item.gesture !== undefined)

  return (
    <div className="mt-2.5 pt-2 border-t border-emerald-800/40 text-left">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-[11px] font-semibold tracking-wide uppercase text-emerald-300 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-amber-300" />
          ISL Visual Representation
        </span>
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-0.5"
          aria-label="Toggle details"
        >
          <Eye className="w-3 h-3" />
          {expanded ? 'Hide' : 'Inspect'}
        </button>
      </div>

      {/* Visual Gesture Badges */}
      {matchedGestures.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {matchedGestures.map(({ word, gesture }) => (
            <div
              key={word}
              className="inline-flex items-center gap-1.5 bg-emerald-950/80 border border-emerald-700/60 rounded-lg px-2 py-1 text-xs text-emerald-200"
            >
              <span className="text-sm">{gesture.emoji}</span>
              <span className="font-semibold text-white">{gesture.label}</span>
            </div>
          ))}
        </div>
      ) : (
        /* Fingerspelling representation for words outside predefined gesture cache */
        <div className="flex flex-wrap gap-1">
          {words.slice(0, 4).map((w, idx) => (
            <span
              key={idx}
              className="bg-emerald-950/60 border border-emerald-800/60 rounded px-1.5 py-0.5 text-[11px] text-emerald-300 font-mono"
            >
              🤟 {w}
            </span>
          ))}
        </div>
      )}

      {/* Expanded Sign Detail & Gesture Instructions */}
      {expanded && (
        <div className="mt-2 space-y-1.5 bg-gray-900/90 rounded-lg p-2.5 border border-emerald-800/60 text-xs text-gray-300 animate-fade-in">
          {matchedGestures.length > 0 ? (
            matchedGestures.map(({ word, gesture }) => (
              <div key={word} className="flex items-start gap-1.5">
                <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-bold text-emerald-200">{gesture.label}: </span>
                  <span className="text-gray-300">{gesture.desc}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 italic text-[11px]">
              Fingerspelling letter-by-letter representation displayed for the ISL user.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

