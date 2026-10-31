"""
SignBridge – REST API endpoints.
"""
from __future__ import annotations

import base64
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, Request, UploadFile, status
from loguru import logger

from app.config import settings
from app.schemas import (
    ConversationRequest,
    ConversationResponse,
    HealthResponse,
    ModelInfoResponse,
    PredictionResponse,
)

router = APIRouter(prefix="/api")


def get_inference(request: Request):
    return request.app.state.inference


# ── Health ───────────────────────────────────────────────────────────────────

@router.get("/health", response_model=HealthResponse, tags=["system"])
async def health(request: Request) -> HealthResponse:
    svc = get_inference(request)
    return HealthResponse(status="ok", model_loaded=svc.model_loaded)


# ── Model info ───────────────────────────────────────────────────────────────

@router.get("/model", response_model=ModelInfoResponse, tags=["model"])
async def model_info(request: Request) -> ModelInfoResponse:
    svc = get_inference(request)
    return ModelInfoResponse(
        model=svc.model_name,
        classes=svc.num_classes,
        confidence_threshold=settings.confidence_threshold,
        inference_fps=settings.inference_fps,
        image_size=settings.image_size,
    )


# ── Prediction (multipart upload) ────────────────────────────────────────────

@router.post("/predict", response_model=PredictionResponse, tags=["inference"])
async def predict(
    request: Request,
    frame: UploadFile = File(..., description="JPEG/PNG camera frame"),
) -> PredictionResponse:
    svc = get_inference(request)

    # Validate content type
    if frame.content_type not in ("image/jpeg", "image/png", "image/webp"):
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Frame must be JPEG, PNG, or WebP.",
        )

    # Read with size guard (2 MB)
    MAX_SIZE = 2 * 1024 * 1024
    image_bytes = await frame.read(MAX_SIZE + 1)
    if len(image_bytes) > MAX_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="Frame exceeds 2 MB limit.",
        )

    label, confidence = svc.predict_from_bytes(image_bytes)
    smoothed = svc.smooth_prediction(label)
    accepted = (
        smoothed is not None and confidence >= settings.confidence_threshold
    )

    return PredictionResponse(
        prediction=smoothed if accepted else None,
        confidence=round(confidence, 4),
        accepted=accepted,
        message=None if accepted else "Low confidence – please sign more clearly.",
    )


# ── Prediction (base64 JSON) ─────────────────────────────────────────────────

from pydantic import BaseModel


class Base64PredictRequest(BaseModel):
    image: str  # base64-encoded frame


@router.post("/predict/base64", response_model=PredictionResponse, tags=["inference"])
async def predict_base64(request: Request, body: Base64PredictRequest) -> PredictionResponse:
    svc = get_inference(request)
    try:
        label, confidence = svc.predict_from_base64(body.image)
    except Exception as exc:
        logger.warning(f"Prediction error: {exc}")
        raise HTTPException(status_code=422, detail="Invalid image data.")

    smoothed = svc.smooth_prediction(label)
    accepted = smoothed is not None and confidence >= settings.confidence_threshold

    return PredictionResponse(
        prediction=smoothed if accepted else None,
        confidence=round(confidence, 4),
        accepted=accepted,
        message=None if accepted else "Low confidence – please sign more clearly.",
    )


# ── Conversation ─────────────────────────────────────────────────────────────

@router.post("/conversation", response_model=ConversationResponse, tags=["conversation"])
async def conversation(body: ConversationRequest) -> ConversationResponse:
    # Echo the message (the frontend handles conversation state)
    return ConversationResponse(message=body.message)

