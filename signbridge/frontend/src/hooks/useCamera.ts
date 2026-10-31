/**
 * useCamera: Manages webcam lifecycle, frame capture, and permission state.
 */
import { useCallback, useEffect, useRef, useState } from 'react'
import type { CameraStatus } from '../types'

interface UseCameraOptions {
  /** Target frames-per-second for inference (not display) */
  inferenceFps?: number
  onFrame?: (base64: string) => void
}

export function useCamera({ inferenceFps = 8, onFrame }: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'))
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [status, setStatus] = useState<CameraStatus>('idle')
  const [error, setError] = useState<string | null>(null)

  const startCamera = useCallback(async () => {
    setStatus('requesting')
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      })
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        await videoRef.current.play()
      }
      setStatus('active')
    } catch (err) {
      const msg =
        err instanceof DOMException && err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Camera unavailable. Please check your device.'
      setError(msg)
      setStatus('error')
    }
  }, [])

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    setStatus('idle')
  }, [])

  // Start/stop inference frame capture loop
  useEffect(() => {
    if (status !== 'active' || !onFrame) return

    const interval = Math.round(1000 / inferenceFps)

    intervalRef.current = setInterval(() => {
      const video = videoRef.current
      const canvas = canvasRef.current
      if (!video || video.readyState < 2) return

      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      // Draw un-mirrored frame (CSS mirrors the video, but we send the real image)
      ctx.save()
      ctx.scale(-1, 1)
      ctx.drawImage(video, -canvas.width, 0, canvas.width, canvas.height)
      ctx.restore()

      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1]
      onFrame(base64)
    }, interval)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [status, inferenceFps, onFrame])

  // Cleanup on unmount
  useEffect(() => {
    return () => stopCamera()
  }, [stopCamera])

  return { videoRef, status, error, startCamera, stopCamera }
}

