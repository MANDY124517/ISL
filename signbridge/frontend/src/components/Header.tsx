/**
 * Header – top navigation bar with mode toggle and status indicators.
 */
import { Activity, FlaskConical, Wifi, WifiOff } from 'lucide-react'
import { cn } from '../utils'
import type { AppMode } from '../types'

interface HeaderProps {
  mode: AppMode
  onModeChange: (mode: AppMode) => void
  backendAvailable: boolean | null
}

export function Header({ mode, onModeChange, backendAvailable }: HeaderProps) {
  return (
    <header className="bg-gray-900/95 border-b border-gray-800 sticky top-0 z-50 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl" role="img" aria-label="SignBridge">🤟</span>
          <div>
            <h1 className="text-lg font-bold text-white leading-none">SignBridge</h1>
            <p className="text-xs text-gray-500 leading-none mt-0.5">ISL Communication Platform</p>
          </div>
        </div>

        {/* Centre: mode toggle */}
        <div className="flex items-center bg-gray-800 rounded-full p-1 gap-1">
          <button
            onClick={() => onModeChange('live')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              mode === 'live'
                ? 'bg-brand-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200',
            )}
            aria-pressed={mode === 'live'}
          >
            <Activity className="w-3.5 h-3.5" />
            Live
          </button>
          <button
            onClick={() => onModeChange('demo')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all',
              mode === 'demo'
                ? 'bg-yellow-600 text-white shadow'
                : 'text-gray-400 hover:text-gray-200',
            )}
            aria-pressed={mode === 'demo'}
          >
            <FlaskConical className="w-3.5 h-3.5" />
            Demo
          </button>
        </div>

        {/* Backend status */}
        <div className="flex items-center gap-1.5">
          {backendAvailable === null ? (
            <span className="text-xs text-gray-500">Checking backend…</span>
          ) : backendAvailable ? (
            <>
              <Wifi className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-emerald-400 hidden sm:inline">AI Online</span>
            </>
          ) : (
            <>
              <WifiOff className="w-4 h-4 text-red-400" />
              <span className="text-xs text-red-400 hidden sm:inline">AI Offline</span>
            </>
          )}
        </div>
      </div>

      {/* Demo mode banner */}
      {mode === 'demo' && (
        <div className="bg-yellow-700/30 border-t border-yellow-700/50 text-yellow-300 text-xs text-center py-1.5 px-4">
          ⚠️ <strong>Demo Mode</strong> — Pre-recorded input simulation. Not using live camera data.
        </div>
      )}
    </header>
  )
}

