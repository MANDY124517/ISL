import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: (string | undefined | null | false)[]): string {
  return twMerge(clsx(inputs))
}

export function formatConfidence(c: number): string {
  return `${Math.round(c * 100)}%`
}

export function confidenceColor(c: number): string {
  if (c >= 0.85) return 'bg-emerald-500'
  if (c >= 0.70) return 'bg-yellow-500'
  return 'bg-red-500'
}

export function confidenceTextColor(c: number): string {
  if (c >= 0.85) return 'text-emerald-400'
  if (c >= 0.70) return 'text-yellow-400'
  return 'text-red-400'
}

