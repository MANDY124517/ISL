/**
 * SentenceBuilder – ISL user's sentence composition panel.
 */
import { RotateCcw, Trash2, Volume2, VolumeX, PlusCircle, ArrowRight } from 'lucide-react'
import { cn } from '../utils'

interface SentenceBuilderProps {
  sentence: string[]
  currentPrediction: string | null
  currentConfidence: number
  confidenceThreshold?: number
  speaking: boolean
  onAddWord: () => void
  onRemoveLastWord: () => void
  onClearSentence: () => void
  onConfirm: () => void
  onSpeak: () => void
  onStopSpeak: () => void
}

export function SentenceBuilder({
  sentence,
  currentPrediction,
  currentConfidence,
  confidenceThreshold = 0.8,
  speaking,
  onAddWord,
  onRemoveLastWord,
  onClearSentence,
  onConfirm,
  onSpeak,
  onStopSpeak,
}: SentenceBuilderProps) {
  const sentenceText = sentence.join(' ')
  const canAdd = Boolean(currentPrediction && currentConfidence >= confidenceThreshold)

  return (
    <div className="card flex flex-col gap-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-800">
        <h2 className="font-semibold text-gray-100">Recognized Message</h2>
        <p className="text-xs text-gray-500 mt-0.5">ISL → English</p>
      </div>

      {/* Sentence display */}
      <div className="px-4 py-4 min-h-[80px] flex items-center">
        {sentenceText ? (
          <p className="text-xl font-semibold text-white leading-relaxed">
            "{sentenceText}"
          </p>
        ) : (
          <p className="text-gray-600 italic text-sm">
            Start signing to build a message…
          </p>
        )}
      </div>

      {/* Word chips */}
      {sentence.length > 0 && (
        <div className="px-4 pb-3 flex flex-wrap gap-2">
          {sentence.map((word, i) => (
            <span
              key={i}
              className="bg-brand-900/50 border border-brand-700 text-brand-200 text-sm px-2.5 py-0.5 rounded-full"
            >
              {word}
            </span>
          ))}
        </div>
      )}

      {/* Add prediction button */}
      {currentPrediction && (
        <div className="px-4 pb-3">
          <button
            className={cn(
              'btn w-full justify-center gap-2',
              canAdd
                ? 'bg-brand-700 hover:bg-brand-600 text-white'
                : 'bg-gray-800 text-gray-500 cursor-not-allowed',
            )}
            onClick={onAddWord}
            disabled={!canAdd}
            title={canAdd ? 'Add this word to sentence' : 'Confidence too low'}
          >
            <PlusCircle className="w-4 h-4" />
            Add "{currentPrediction}"
            {!canAdd && <span className="text-xs opacity-70">(low confidence)</span>}
          </button>
        </div>
      )}

      {/* Controls */}
      <div className="px-4 pb-4 flex flex-wrap gap-2 border-t border-gray-800 pt-3">
        <button
          className="btn-secondary"
          onClick={onRemoveLastWord}
          disabled={sentence.length === 0}
          aria-label="Undo last word"
          title="Remove last word"
        >
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>

        <button
          className="btn-danger"
          onClick={onClearSentence}
          disabled={sentence.length === 0}
          aria-label="Clear sentence"
          title="Clear all words"
        >
          <Trash2 className="w-4 h-4" />
          Clear
        </button>

        <button
          className={cn(
            'btn',
            speaking
              ? 'bg-amber-700 hover:bg-amber-600 text-white'
              : 'bg-emerald-700 hover:bg-emerald-600 text-white',
          )}
          onClick={speaking ? onStopSpeak : onSpeak}
          disabled={!sentenceText}
          aria-label={speaking ? 'Stop speech' : 'Speak sentence'}
          title={speaking ? 'Stop speaking' : 'Speak the message aloud'}
        >
          {speaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          {speaking ? 'Stop' : 'Speak'}
        </button>

        <button
          className="btn-primary ml-auto"
          onClick={onConfirm}
          disabled={sentence.length === 0}
          aria-label="Send message to conversation"
          title="Send to conversation"
        >
          Send
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

