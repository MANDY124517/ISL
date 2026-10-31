/**
 * StatusBar – bottom bar showing model info and system status.
 */
import { Brain, Layers } from 'lucide-react'

interface StatusBarProps {
  modelName?: string
  numClasses?: number
  confidenceThreshold?: number
}

export function StatusBar({ modelName, numClasses, confidenceThreshold }: StatusBarProps) {
  return (
    <footer className="bg-gray-900/80 border-t border-gray-800 px-4 py-2">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 text-xs text-gray-500">
        {modelName && (
          <span className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5 text-brand-400" />
            {modelName}
          </span>
        )}
        {numClasses !== undefined && (
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-brand-400" />
            {numClasses} classes
          </span>
        )}
        {confidenceThreshold !== undefined && (
          <span>Threshold: {Math.round(confidenceThreshold * 100)}%</span>
        )}
        <span className="ml-auto text-gray-600">
          ISLTranslate dataset · CC-BY-NC-4.0
        </span>
      </div>
    </footer>
  )
}

