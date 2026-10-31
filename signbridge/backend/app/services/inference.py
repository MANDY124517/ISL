"""
SignBridge – ISL Inference Service
Handles frame preprocessing, MediaPipe pose extraction,
OpenCV vision-based keypoint extraction fallback,
model inference, temporal smoothing, and confidence gating.
"""
from __future__ import annotations

import base64
import io
import json
import time
from collections import deque
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from loguru import logger
from PIL import Image

# ── Optional MediaPipe import ────────────────────────────────────────────────
_MP_AVAILABLE = False
_mp_holistic = None

try:
    import mediapipe as mp  # type: ignore

    if hasattr(mp, "solutions") and hasattr(mp.solutions, "holistic"):
        _mp_holistic = mp.solutions.holistic
        _MP_AVAILABLE = True
        logger.info("MediaPipe legacy solutions API available.")
    else:
        logger.warning(
            "MediaPipe installed but holistic solution unavailable in this version "
            f"({getattr(mp, '__version__', 'unknown')}). "
            "Using OpenCV adaptive skin & gesture feature extraction fallback."
        )
except ImportError:
    logger.warning("MediaPipe not installed – using OpenCV vision feature extraction.")

# ── Optional PyTorch import ──────────────────────────────────────────────────
try:
    import torch
    import torch.nn as nn

    _TORCH_AVAILABLE = True
except ImportError:  # pragma: no cover
    _TORCH_AVAILABLE = False
    logger.warning("PyTorch not installed – running in demo mode.")


# ──────────────────────────────────────────────────────────────────────────────
# Lightweight pose-keypoint classifier
# ──────────────────────────────────────────────────────────────────────────────

class PoseClassifier(nn.Module if _TORCH_AVAILABLE else object):  # type: ignore[misc]
    """
    A deep fully-connected network that classifies ISL signs from
    MediaPipe / Vision keypoints (hands + pose).

    Input shape:  (batch, FEATURE_DIM) = (batch, 258)
    Output shape: (batch, num_classes)
    """

    FEATURE_DIM = 21 * 3 * 2 + 33 * 4  # left+right hand (21 kp × xyz) + pose (33 kp × xyzv) = 258

    def __init__(self, num_classes: int) -> None:
        if _TORCH_AVAILABLE:
            super().__init__()
        self.num_classes = num_classes
        if _TORCH_AVAILABLE:
            self.net = nn.Sequential(
                nn.Linear(self.FEATURE_DIM, 512),
                nn.BatchNorm1d(512),
                nn.ReLU(),
                nn.Dropout(0.3),
                nn.Linear(512, 256),
                nn.BatchNorm1d(256),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(256, 128),
                nn.ReLU(),
                nn.Linear(128, num_classes),
            )

    def forward(self, x: "torch.Tensor") -> "torch.Tensor":
        return self.net(x)


# ──────────────────────────────────────────────────────────────────────────────
# Inference service (singleton)
# ──────────────────────────────────────────────────────────────────────────────

class InferenceService:
    def __init__(
        self,
        model_path: Path,
        class_mapping_path: Path,
        confidence_threshold: float = 0.80,
        window_size: int = 5,
        min_occurrences: int = 3,
    ) -> None:
        self.confidence_threshold = confidence_threshold
        self.window_size = window_size
        self.min_occurrences = min_occurrences

        self._model: Optional["torch.nn.Module"] = None
        self._class_names: List[str] = []
        self._class_mapping: Dict[str, Dict] = {}
        self._model_loaded = False
        self._model_name = "PoseClassifier"

        # Temporal smoothing buffer
        self._prediction_window: deque = deque(maxlen=window_size)

        # MediaPipe holistic
        self._holistic = None

        self._load_class_mapping(class_mapping_path)
        self._load_model(model_path)
        self._init_mediapipe()

    # ── Setup ────────────────────────────────────────────────────────────────

    def _load_class_mapping(self, path: Path) -> None:
        if not path.exists():
            logger.warning(f"Class mapping not found at {path}. Using empty mapping.")
            return
        with open(path, "r", encoding="utf-8") as f:
            self._class_mapping = json.load(f)
        self._class_names = [v.get("isl_label", k) for k, v in self._class_mapping.items()]
        logger.info(f"Loaded {len(self._class_names)} classes from {path}")

    def _load_model(self, path: Path) -> None:
        if not _TORCH_AVAILABLE:
            logger.warning("PyTorch unavailable – running in demo mode.")
            return
        if not path.exists():
            logger.warning(f"Model file not found at {path}. Running in demo mode.")
            return
        try:
            checkpoint = torch.load(str(path), map_location="cpu", weights_only=False)
            num_classes = checkpoint.get("num_classes", len(self._class_names))
            self._model = PoseClassifier(num_classes=num_classes)
            self._model.load_state_dict(checkpoint["model_state_dict"])
            self._model.eval()
            self._model_loaded = True
            self._model_name = checkpoint.get("model_name", "PoseClassifier")
            logger.info(f"Model loaded: {self._model_name} ({num_classes} classes)")
        except Exception as exc:
            logger.error(f"Failed to load model: {exc}")

    def _init_mediapipe(self) -> None:
        if not _MP_AVAILABLE or _mp_holistic is None:
            logger.info("Using OpenCV adaptive vision feature pipeline.")
            return
        try:
            self._holistic = _mp_holistic.Holistic(
                static_image_mode=False,
                model_complexity=1,
                min_detection_confidence=0.5,
                min_tracking_confidence=0.5,
            )
            logger.info("MediaPipe Holistic initialized.")
        except Exception as exc:
            logger.warning(f"MediaPipe Holistic init failed: {exc}. Using OpenCV fallback.")

    # ── Public API ───────────────────────────────────────────────────────────

    @property
    def model_loaded(self) -> bool:
        return self._model_loaded

    @property
    def model_name(self) -> str:
        return self._model_name

    @property
    def num_classes(self) -> int:
        return len(self._class_names)

    def predict_from_base64(self, image_b64: str) -> Tuple[Optional[str], float]:
        """
        Decode a base64-encoded JPEG/PNG frame, extract pose keypoints,
        run classifier, return (label, confidence).
        """
        t0 = time.perf_counter()
        try:
            # Strip data url prefix if present
            if "," in image_b64:
                image_b64 = image_b64.split(",", 1)[1]
            image_bytes = base64.b64decode(image_b64)
            frame = self._decode_image(image_bytes)
        except Exception as exc:
            logger.debug(f"Image decode error: {exc}")
            return None, 0.0

        label, confidence = self._infer(frame)
        elapsed_ms = (time.perf_counter() - t0) * 1000
        logger.debug(f"Inference: {label} ({confidence:.2f}) in {elapsed_ms:.1f} ms")
        return label, confidence

    def predict_from_bytes(self, image_bytes: bytes) -> Tuple[Optional[str], float]:
        try:
            frame = self._decode_image(image_bytes)
        except Exception as exc:
            logger.debug(f"Image decode error: {exc}")
            return None, 0.0
        return self._infer(frame)

    def smooth_prediction(self, label: Optional[str]) -> Optional[str]:
        """Apply temporal smoothing over the rolling window."""
        self._prediction_window.append(label)
        if len(self._prediction_window) < self.window_size:
            return None
        counts: Dict[str, int] = {}
        for p in self._prediction_window:
            if p is not None:
                counts[p] = counts.get(p, 0) + 1
        if not counts:
            return None
        best_label, best_count = max(counts.items(), key=lambda x: x[1])
        return best_label if best_count >= self.min_occurrences else None

    def reset_window(self) -> None:
        self._prediction_window.clear()

    # ── Internal ─────────────────────────────────────────────────────────────

    def _decode_image(self, data: bytes) -> np.ndarray:
        pil_img = Image.open(io.BytesIO(data)).convert("RGB")
        return np.array(pil_img)

    def _extract_keypoints(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """Extract MediaPipe Holistic keypoints, falling back to OpenCV hand detector."""
        if _MP_AVAILABLE and self._holistic is not None:
            try:
                rgb = cv2.cvtColor(frame, cv2.COLOR_RGB2BGR)
                rgb = cv2.cvtColor(rgb, cv2.COLOR_BGR2RGB)
                results = self._holistic.process(rgb)

                # Left hand: 21 landmarks × 3 (x, y, z)
                if results.left_hand_landmarks:
                    lh = np.array([[lm.x, lm.y, lm.z] for lm in results.left_hand_landmarks.landmark]).flatten()
                else:
                    lh = np.zeros(21 * 3)

                # Right hand: 21 landmarks × 3
                if results.right_hand_landmarks:
                    rh = np.array([[lm.x, lm.y, lm.z] for lm in results.right_hand_landmarks.landmark]).flatten()
                else:
                    rh = np.zeros(21 * 3)

                # Pose: 33 landmarks × 4 (x, y, z, visibility)
                if results.pose_landmarks:
                    pose = np.array(
                        [[lm.x, lm.y, lm.z, lm.visibility] for lm in results.pose_landmarks.landmark]
                    ).flatten()
                else:
                    pose = np.zeros(33 * 4)

                return np.concatenate([lh, rh, pose]).astype(np.float32)
            except Exception as e:
                logger.debug(f"MediaPipe process exception: {e}")

        # ── OpenCV Adaptive Skin & Hand Contour Feature Extractor ────────────────
        return self._extract_opencv_keypoints(frame)

    def _extract_opencv_keypoints(self, frame: np.ndarray) -> Optional[np.ndarray]:
        """
        OpenCV hand & pose geometry extractor when MediaPipe Holistic is unavailable.
        Detects hand contours, moments, and centroids mapped to 258 dimensions.
        """
        try:
            h, w = frame.shape[:2]
            ycrcb = cv2.cvtColor(frame, cv2.COLOR_RGB2YCrCb)
            # Skin color range in YCrCb
            lower_skin = np.array([0, 133, 77], dtype=np.uint8)
            upper_skin = np.array([255, 173, 127], dtype=np.uint8)
            mask = cv2.inRange(ycrcb, lower_skin, upper_skin)

            # Morphological cleaning
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5))
            mask = cv2.dilate(mask, kernel, iterations=2)
            mask = cv2.erode(mask, kernel, iterations=1)

            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if not contours:
                return None

            # Filter significant contours (hands/face)
            valid_contours = [c for c in contours if cv2.contourArea(c) > (w * h * 0.005)]
            if not valid_contours:
                return None

            # Sort by area descending
            valid_contours.sort(key=cv2.contourArea, reverse=True)

            features = np.zeros(PoseClassifier.FEATURE_DIM, dtype=np.float32)

            # Use primary contour (dominant hand)
            dominant = valid_contours[0]
            M = cv2.moments(dominant)
            if M["m00"] > 0:
                cx = float(M["m10"] / M["m00"]) / w
                cy = float(M["m01"] / M["m00"]) / h
            else:
                cx, cy = 0.5, 0.5

            # Populate right hand landmarks (63 to 126)
            for i in range(21):
                angle = (i / 21.0) * 2 * np.pi
                features[63 + i * 3] = float(np.clip(cx + 0.06 * np.cos(angle), 0.0, 1.0))
                features[63 + i * 3 + 1] = float(np.clip(cy + 0.06 * np.sin(angle), 0.0, 1.0))
                features[63 + i * 3 + 2] = 0.0

            # If secondary hand contour detected, populate left hand (0 to 63)
            if len(valid_contours) > 1:
                sec = valid_contours[1]
                M2 = cv2.moments(sec)
                if M2["m00"] > 0:
                    cx2 = float(M2["m10"] / M2["m00"]) / w
                    cy2 = float(M2["m01"] / M2["m00"]) / h
                else:
                    cx2, cy2 = 0.3, 0.5
                for i in range(21):
                    angle = (i / 21.0) * 2 * np.pi
                    features[i * 3] = float(np.clip(cx2 + 0.05 * np.cos(angle), 0.0, 1.0))
                    features[i * 3 + 1] = float(np.clip(cy2 + 0.05 * np.sin(angle), 0.0, 1.0))
                    features[i * 3 + 2] = 0.0

            # Standardized pose landmarks (126 to 258)
            features[126 + 11 * 4] = 0.4
            features[126 + 11 * 4 + 1] = 0.35
            features[126 + 12 * 4] = 0.6
            features[126 + 12 * 4 + 1] = 0.35
            features[126 + 15 * 4] = features[0]
            features[126 + 15 * 4 + 1] = features[1]
            features[126 + 16 * 4] = features[63]
            features[126 + 16 * 4 + 1] = features[64]

            return features
        except Exception as e:
            logger.debug(f"OpenCV extraction error: {e}")
            return None

    def _infer(self, frame: np.ndarray) -> Tuple[Optional[str], float]:
        """Run model inference on a single frame."""
        if not self._model_loaded or not _TORCH_AVAILABLE:
            return self._demo_infer()

        keypoints = self._extract_keypoints(frame)
        if keypoints is None:
            return None, 0.0

        # Normalize keypoints to match training space
        k_min = float(keypoints.min())
        k_max = float(keypoints.max())
        denom = k_max - k_min
        if denom > 1e-8:
            keypoints = (keypoints - k_min) / denom

        with torch.no_grad():
            x = torch.tensor(keypoints).unsqueeze(0)
            logits = self._model(x)
            probs = torch.softmax(logits, dim=-1)
            confidence, idx = probs.max(dim=-1)
            confidence = float(confidence.item())
            idx = int(idx.item())

        if idx >= len(self._class_names):
            return None, 0.0

        label = self._class_names[idx]
        return label, confidence

    def _demo_infer(self) -> Tuple[Optional[str], float]:
        """Return a demo prediction when in demo mode."""
        import random

        demo_signs = ["HELLO", "THANK YOU", "YES", "NO", "HELP", "PLEASE", "SORRY", "GOOD"]
        label = random.choice(demo_signs)
        confidence = random.uniform(0.75, 0.98)
        return label, confidence
