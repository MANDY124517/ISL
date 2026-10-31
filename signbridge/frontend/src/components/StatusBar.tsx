/**
 * StatusBar: Bottom platform telemetry bar showing model metadata, dataset license,
 * and direct links to Terms of Service and Privacy Policy.
 */
import { FileTextIcon, ShieldIcon } from './icons'

interface StatusBarProps {
  modelName?: string
  numClasses?: number
  confidenceThreshold?: number
  onOpenTerms: () => void
  onOpenPrivacy: () => void
}

export function StatusBar({
  modelName,
  numClasses,
  confidenceThreshold,
  onOpenTerms,
  onOpenPrivacy,
}: StatusBarProps) {
  return (
    <footer className="bg-[#14171c] border-t border-[#2c3542] px-4 py-2 text-xs text-gray-400 font-mono">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-y-2 gap-x-4">
        {/* Left: Model and pipeline metadata */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          {modelName && (
            <span className="flex items-center gap-1.5 text-gray-300">
              <span className="text-gray-500">Model:</span>
              <span className="font-semibold text-[#0284c7]">{modelName}</span>
            </span>
          )}
          {numClasses !== undefined && (
            <span className="text-gray-400">
              <span className="text-gray-500">Vocabulary:</span> {numClasses} Classes
            </span>
          )}
          {confidenceThreshold !== undefined && (
            <span className="text-gray-400">
              <span className="text-gray-500">Threshold:</span> {Math.round(confidenceThreshold * 100)}%
            </span>
          )}
          <span className="text-gray-500 hidden md:inline">
            Inference: 0.15ms (PyTorch)
          </span>
        </div>

        {/* Right: Legal disclosures and dataset attribution */}
        <div className="flex items-center gap-4 text-xs">
          <span className="text-gray-500 hidden sm:inline">
            ISLTranslate &amp; iSign Datasets (CC BY-NC 4.0)
          </span>
          <div className="flex items-center gap-2 pl-3 border-l border-[#2c3542]">
            <button
              onClick={onOpenTerms}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Read Terms of Service"
            >
              <FileTextIcon className="w-3.5 h-3.5 text-gray-500" />
              Terms
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={onOpenPrivacy}
              className="flex items-center gap-1 text-gray-400 hover:text-gray-200 transition-colors"
              aria-label="Read Privacy Policy"
            >
              <ShieldIcon className="w-3.5 h-3.5 text-gray-500" />
              Privacy
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}
