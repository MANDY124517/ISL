/**
 * SignBridge API Service:
 * Handles all HTTP calls to the FastAPI backend.
 */

import type { HealthResponse, ModelInfoResponse, PredictionResponse } from '../types'

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

async function post<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`)
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)
  return res.json() as Promise<T>
}

// ── Public API ────────────────────────────────────────────────────────────────

export const api = {
  health: () => get<HealthResponse>('/api/health'),

  modelInfo: () => get<ModelInfoResponse>('/api/model'),

  /** Send a base64-encoded frame for prediction */
  predictBase64: (imageBase64: string) =>
    post<PredictionResponse>('/api/predict/base64', { image: imageBase64 }),

  /** Send a conversation message (echo) */
  sendMessage: (message: string) =>
    post<{ message: string }>('/api/conversation', { message }),
}

// ── WebSocket factory ─────────────────────────────────────────────────────────

export function createPredictionSocket(
  onMessage: (data: unknown) => void,
  onError?: (err: Event) => void,
): WebSocket {
  const wsBase = (import.meta.env.VITE_WS_URL ?? '').replace(/^http/, 'ws')
  const url = `${wsBase}/ws/predict`
  const ws = new WebSocket(url)

  ws.onmessage = (e) => {
    try {
      onMessage(JSON.parse(e.data as string))
    } catch {
      // ignore parse errors
    }
  }

  ws.onerror = onError ?? null
  return ws
}

