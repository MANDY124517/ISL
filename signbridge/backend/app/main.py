"""
SignBridge – FastAPI application entry point.
"""
from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.api import router, ws_router
from app.config import settings
from app.services.inference import InferenceService

# ── Logging ──────────────────────────────────────────────────────────────────
logger.remove()
logger.add(
    sys.stderr,
    level=settings.log_level.upper(),
    format="<green>{time:HH:mm:ss}</green> | <level>{level: <8}</level> | {message}",
)

# ── Rate limiter ─────────────────────────────────────────────────────────────
limiter = Limiter(key_func=get_remote_address)


# ── Lifespan ─────────────────────────────────────────────────────────────────
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("SignBridge backend starting…")
    app.state.inference = InferenceService(
        model_path=settings.model_path_resolved,
        class_mapping_path=settings.class_mapping_path_resolved,
        confidence_threshold=settings.confidence_threshold,
        window_size=settings.window_size,
        min_occurrences=settings.min_occurrences,
    )
    logger.info("Inference service ready.")
    yield
    logger.info("SignBridge backend shutting down.")


# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="SignBridge API",
    description="Real-Time ISL Communication Platform",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate limiting
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Routers
app.include_router(router)
app.include_router(ws_router)


# ── Dev entry point ───────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
        log_level=settings.log_level,
    )

