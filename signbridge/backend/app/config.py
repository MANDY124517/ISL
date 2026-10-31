"""
SignBridge Backend – Configuration
All settings are loaded from environment variables / .env file.
Paths are robustly resolved regardless of invocation directory.
"""
from __future__ import annotations

from pathlib import Path
from typing import Any, List, Union

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Project root: c:\ISL\signbridge
PROJECT_ROOT = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent / ".env"),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # ── Model ──────────────────────────────────────────────────
    model_path: str = "ml/models/signbridge_model.pt"
    class_mapping_path: str = "data/class_mapping.json"
    confidence_threshold: float = 0.80
    inference_fps: int = 8
    image_size: int = 224
    window_size: int = 5
    min_occurrences: int = 3

    # ── Server ─────────────────────────────────────────────────
    host: str = "0.0.0.0"
    port: int = 8000
    reload: bool = True
    log_level: str = "info"

    # ── CORS ───────────────────────────────────────────────────
    cors_origins: Any = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
    ]

    @field_validator("cors_origins", mode="before")
    @classmethod
    def parse_cors_origins(cls, v: Any) -> List[str]:
        if isinstance(v, str):
            if v.startswith("[") and v.endswith("]"):
                import json
                try:
                    return json.loads(v)
                except Exception:
                    pass
            return [x.strip() for x in v.split(",") if x.strip()]
        if isinstance(v, (list, tuple)):
            return [str(x) for x in v]
        return ["http://localhost:5173", "http://127.0.0.1:5173"]

    # ── Rate limiting ──────────────────────────────────────────
    rate_limit_per_minute: int = 120

    # ── Derived paths ──────────────────────────────────────────
    @property
    def model_path_resolved(self) -> Path:
        p = Path(self.model_path)
        if p.is_absolute() and p.exists():
            return p
        # Check relative to cwd
        if p.exists():
            return p.resolve()
        # Clean relative traversal and check from project root
        clean_rel = str(self.model_path).replace("../", "").replace("..\\", "")
        candidate = (PROJECT_ROOT / clean_rel).resolve()
        if candidate.exists():
            return candidate
        # Fallback to default in ml/models
        return PROJECT_ROOT / "ml" / "models" / "signbridge_model.pt"

    @property
    def class_mapping_path_resolved(self) -> Path:
        p = Path(self.class_mapping_path)
        if p.is_absolute() and p.exists():
            return p
        if p.exists():
            return p.resolve()
        clean_rel = str(self.class_mapping_path).replace("../", "").replace("..\\", "")
        candidate = (PROJECT_ROOT / clean_rel).resolve()
        if candidate.exists():
            return candidate
        return PROJECT_ROOT / "data" / "class_mapping.json"


settings = Settings()
