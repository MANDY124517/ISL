// ── API types ──────────────────────────────────────────────────────────────

export interface PredictionResponse {
  prediction: string | null
  confidence: number
  accepted: boolean
  message: string | null
}

export interface ModelInfoResponse {
  model: string
  classes: number
  confidence_threshold: number
  inference_fps: number
  image_size: number
}

export interface HealthResponse {
  status: string
  model_loaded: boolean
}

// ── Conversation ────────────────────────────────────────────────────────────

export type MessageRole = 'isl-user' | 'non-signer' | 'system'

export interface ConversationMessage {
  id: string
  role: MessageRole
  text: string
  timestamp: Date
}

// ── Camera state ─────────────────────────────────────────────────────────────

export type CameraStatus = 'idle' | 'requesting' | 'active' | 'error'

// ── App mode ─────────────────────────────────────────────────────────────────

export type AppMode = 'live' | 'demo'

// ── WebSocket message types ───────────────────────────────────────────────────

export interface WSPredictionMessage {
  type: 'prediction'
  prediction: string | null
  confidence: number
  accepted: boolean
  message: string | null
}

export interface WSErrorMessage {
  type: 'error'
  message: string
}

export interface WSResetMessage {
  type: 'reset'
  ok: boolean
}

export type WSMessage = WSPredictionMessage | WSErrorMessage | WSResetMessage

