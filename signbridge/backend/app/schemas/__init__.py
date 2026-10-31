"""
SignBridge Backend – Pydantic schemas for request / response models.
"""
from __future__ import annotations

from typing import Optional
from pydantic import BaseModel, Field


# ── Prediction ──────────────────────────────────────────────────────────────

class PredictionResponse(BaseModel):
    prediction: Optional[str] = Field(None, description="Predicted ISL sign label")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model confidence [0,1]")
    accepted: bool = Field(..., description="Whether confidence ≥ threshold")
    message: Optional[str] = Field(None, description="Human-readable status message")


# ── Model info ──────────────────────────────────────────────────────────────

class ModelInfoResponse(BaseModel):
    model: str
    classes: int
    confidence_threshold: float
    inference_fps: int
    image_size: int


# ── Health ──────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status: str
    model_loaded: bool


# ── Conversation ────────────────────────────────────────────────────────────

class ConversationRequest(BaseModel):
    message: str = Field(..., min_length=1, max_length=2000)


class ConversationResponse(BaseModel):
    message: str


# ── WebSocket frames ────────────────────────────────────────────────────────

class WSPredictionMessage(BaseModel):
    type: str = "prediction"
    prediction: Optional[str] = None
    confidence: float = 0.0
    accepted: bool = False
    message: Optional[str] = None


class WSErrorMessage(BaseModel):
    type: str = "error"
    message: str

