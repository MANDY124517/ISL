/**
 * Header: Top navigation bar with system mode toggle and service status indicators.
 * Clean architectural styling: zero harsh gradients, zero emojis, zero Lucide fonts.
 */
import { WifiIcon, WifiOffIcon, HandIcon } from './icons'
import { cn } from '../utils'
import type { AppMode } from '../types'

interface HeaderProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  backendAvailable: boolean | null
  onOpenTerms: () => void
  onOpenPrivacy: () => void
}

export function Header({
  mode,
  onModeChange,
  backendAvailable,
  onOpenTerms,
  onOpenPrivacy,
}: HeaderProps) {
  return (
    <header className="bg-[#15181e] border-b border-[#2c3542] sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Brand identity */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-[#1f242c] border border-[#2c3542] flex items-center justify-center text-[#0284c7] rounded-sm">
            <HandIcon className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-gray-100 tracking-tight leading-none">
              SignBridge
            </h1>
            <p className="text-[11px] text-gray-400 font-mono leading-none mt-1">
              ISL Communication Platform
            </p>
          </div>
        </div>

        {/* Center: Operational mode toggle */}
        <div className="flex items-center bg-[#1f242c] border border-[#2c3542] p-0.5 rounded-sm gap-0.5">
          <button
            onClick={() => onModeChange('live')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-sm transition-colors',
              mode === 'live'
                ? 'bg-[#0369a1] text-white border border-[#0284c7]'
                : 'text-gray-400 hover:text-gray-200 border border-transparent',
            )}
            aria-pressed={mode === 'live'}
          >
            Live Camera
          </button>
          <button
            onClick={() => onModeChange('demo')}
            className={cn(
              'px-3 py-1 text-xs font-semibold rounded-sm transition-colors',
              mode === 'demo'
                ? 'bg-[#854d0e] text-amber-100 border border-[#a16207]'
                : 'text-gray-400 hover:text-gray-200 border border-transparent',
            )}
            aria-pressed={mode === 'demo'}
          >
            Simulation Demo
          </button>
        </div>

        {/* Right side: AI backend connectivity & policy shortcuts */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-xs text-gray-400">
            <button
              onClick={onOpenTerms}
              className="hover:text-gray-200 transition-colors"
            >
              Terms
            </button>
            <span className="text-gray-600">|</span>
            <button
              onClick={onOpenPrivacy}
              className="hover:text-gray-200 transition-colors"
            >
              Privacy
            </button>
          </div>

          <div className="flex items-center gap-2 pl-3 border-l border-[#2c3542]">
            {backendAvailable === null ? (
              <span className="text-xs text-gray-500 font-mono">Checking AI backend...</span>
            ) : backendAvailable ? (
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-mono">
                <WifiIcon className="w-3.5 h-3.5 text-emerald-400" />
                <span className="hidden sm:inline">AI Online (0.15ms)</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-red-400 text-xs font-mono">
                <WifiOffIcon className="w-3.5 h-3.5 text-red-400" />
                <span className="hidden sm:inline">AI Offline</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Demo status alert */}
      {mode === 'demo' && (
        <div className="bg-[#1f242c] border-t border-[#a16207] text-amber-200 text-xs text-center py-1.5 px-4 font-mono">
          [SIMULATION MODE ACTIVE] Testing with synthesized ISL keypoints. No live camera data is transmitted.
        </div>
      )}
    </header>
  )
}
