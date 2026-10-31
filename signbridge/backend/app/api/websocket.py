"""
SignBridge – WebSocket endpoint for real-time inference.
"""
from __future__ import annotations

import json
from typing import Optional

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from loguru import logger

from app.config import settings
from app.schemas import WSErrorMessage, WSPredictionMessage

ws_router = APIRouter()


@ws_router.websocket("/ws/predict")
async def websocket_predict(websocket: WebSocket) -> None:
    """
    Real-time inference via WebSocket.

    Client sends:  { "type": "frame", "image": "<base64>" }
    Server sends:  { "type": "prediction", "prediction": "HELLO", "confidence": 0.94, "accepted": true }
                or { "type": "error", "message": "..." }
                or { "type": "reset" }
    """
    await websocket.accept()
    svc = websocket.app.state.inference
    logger.info("WebSocket connection established.")

    try:
        while True:
            raw = await websocket.receive_text()
            try:
                msg = json.loads(raw)
            except json.JSONDecodeError:
                await websocket.send_text(
                    WSErrorMessage(message="Invalid JSON.").model_dump_json()
                )
                continue

            msg_type = msg.get("type", "frame")

            if msg_type == "reset":
                svc.reset_window()
                await websocket.send_text(json.dumps({"type": "reset", "ok": True}))
                continue

            if msg_type == "frame":
                image_b64: Optional[str] = msg.get("image")
                if not image_b64:
                    await websocket.send_text(
                        WSErrorMessage(message="Missing 'image' field.").model_dump_json()
                    )
                    continue

                label, confidence = svc.predict_from_base64(image_b64)
                smoothed = svc.smooth_prediction(label)
                accepted = smoothed is not None and confidence >= settings.confidence_threshold

                response = WSPredictionMessage(
                    prediction=smoothed if accepted else None,
                    confidence=round(confidence, 4),
                    accepted=accepted,
                    message=None if accepted else "Low confidence.",
                )
                await websocket.send_text(response.model_dump_json())

    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected.")
    except Exception as exc:
        logger.error(f"WebSocket error: {exc}")
        try:
            await websocket.send_text(WSErrorMessage(message=str(exc)).model_dump_json())
        except Exception:
            pass

