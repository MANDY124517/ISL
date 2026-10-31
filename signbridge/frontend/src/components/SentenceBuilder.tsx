/**
 * SentenceBuilder: Conversational buffer assembling recognized ISL signs into sentences.
 * Precision architectural design: zero emojis, crisp 2px corners, high-contrast typography.
 */
import {
  PlusIcon,
  UndoIcon,
  TrashIcon,
  VolumeIcon,
  VolumeMuteIcon,
  SendIcon,
} from './icons'
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
    <div className="card flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#2c3542] bg-[#14171c] flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-sm text-gray-200">Sentence Construction Buffer</h2>
          <p className="text-[11px] text-gray-400 font-mono mt-0.5">ISL to English Text Translation</p>
        </div>
        <span className="text-[11px] font-mono text-gray-400 bg-[#1f242c] border border-[#2c3542] px-2 py-0.5 rounded-sm">
          {sentence.length} {sentence.length === 1 ? 'word' : 'words'}
        </span>
      </div>

      {/* Main sentence text display */}
      <div className="px-4 py-4 min-h-[72px] flex items-center bg-[#111418] border-b border-[#2c3542]">
        {sentenceText ? (
          <p className="text-xl font-bold text-gray-100 font-mono leading-relaxed">
            "{sentenceText}"
          </p>
        ) : (
          <p className="text-gray-500 font-mono text-xs">
            Signs recognized from the camera will queue here for confirmation.
          </p>
        )}
      </div>

      {/* Token chips */}
      {sentence.length > 0 && (
        <div className="px-4 py-2.5 flex flex-wrap gap-1.5 bg-[#14171c] border-b border-[#2c3542]">
          {sentence.map((word, i) => (
            <span
              key={i}
              className="bg-[#1f242c] border border-[#2c3542] text-gray-200 text-xs font-mono px-2 py-0.5 rounded-sm flex items-center gap-1"
            >
              <span className="text-gray-500 text-[10px]">{i + 1}.</span>
              {word}
            </span>
          ))}
        </div>
      )}

      {/* Append candidate prediction button */}
      {currentPrediction && (
        <div className="px-4 py-2.5 border-b border-[#2c3542] bg-[#181c22]">
          <button
            className={cn(
              'btn w-full justify-center gap-2',
              canAdd
                ? 'btn-primary'
                : 'bg-[#1f242c] text-gray-500 border border-[#2c3542] cursor-not-allowed',
            )}
            onClick={onAddWord}
            disabled={!canAdd}
            title={canAdd ? 'Append detected sign to sentence' : 'Confidence below threshold'}
          >
            <PlusIcon className="w-4 h-4" />
            Append "{currentPrediction}"
            {!canAdd && (
              <span className="text-xs font-mono text-gray-400">
                (Score: {Math.round(currentConfidence * 100)}% &lt; {Math.round(confidenceThreshold * 100)}%)
              </span>
            )}
          </button>
        </div>
      )}

      {/* Action toolstrip */}
      <div className="px-4 py-3 flex flex-wrap items-center gap-2 bg-[#181c22]">
        <button
          className="btn btn-secondary"
          onClick={onRemoveLastWord}
          disabled={sentence.length === 0}
          aria-label="Remove the last appended word"
          title="Undo last word"
        >
          <UndoIcon className="w-4 h-4" />
          Undo Word
        </button>

        <button
          className="btn btn-danger"
          onClick={onClearSentence}
          disabled={sentence.length === 0}
          aria-label="Clear all words from buffer"
          title="Clear sentence"
        >
          <TrashIcon className="w-4 h-4" />
          Clear All
        </button>

        <button
          className={cn(
            'btn',
            speaking
              ? 'btn-danger'
              : 'btn-secondary',
          )}
          onClick={speaking ? onStopSpeak : onSpeak}
          disabled={!sentenceText}
          aria-label={speaking ? 'Stop speech audio' : 'Speak composed sentence'}
          title={speaking ? 'Halt speech output' : 'Vocalize sentence via Text-to-Speech'}
        >
          {speaking ? <VolumeMuteIcon className="w-4 h-4" /> : <VolumeIcon className="w-4 h-4" />}
          {speaking ? 'Stop Audio' : 'Vocalize'}
        </button>

        <button
          className="btn btn-primary ml-auto"
          onClick={onConfirm}
          disabled={sentence.length === 0}
          aria-label="Dispatch message to non-signer interface"
          title="Send to conversation"
        >
          <SendIcon className="w-4 h-4" />
          Dispatch Message
        </button>
      </div>
    </div>
  )
}
