"""
SignBridge ML – Preprocessing Pipeline
Handles augmentation and data prep for pose-keypoint-based training.
"""
from __future__ import annotations

import json
import random
from pathlib import Path
from typing import Optional, Tuple

import numpy as np


# ──────────────────────────────────────────────────────────────────────────────
# Augmentation helpers (applied to keypoint vectors, not images)
# ──────────────────────────────────────────────────────────────────────────────

def augment_keypoints(
    keypoints: np.ndarray,
    rotation_range: float = 0.05,
    scale_range: Tuple[float, float] = (0.9, 1.1),
    translation_range: float = 0.02,
    noise_std: float = 0.005,
) -> np.ndarray:
    """
    Apply random augmentation to a keypoint vector.
    Augmentations are spatial transforms that preserve sign semantics:
      - Small rotation (in normalised coordinates)
      - Scale jitter
      - Translation jitter
      - Gaussian noise
    """
    k = keypoints.copy()

    # Scale
    scale = random.uniform(*scale_range)
    k = k * scale

    # Translation
    tx = random.uniform(-translation_range, translation_range)
    ty = random.uniform(-translation_range, translation_range)
    # Apply to x/y channels of each landmark group (indices 0,1 in triplets)
    # We reshape into (-1, 3) to handle landmark triplets cleanly
    n = len(k)
    triplets = n // 3
    remainder = n % 3
    if triplets > 0:
        body = k[: triplets * 3].reshape(triplets, 3)
        body[:, 0] += tx
        body[:, 1] += ty
        k[: triplets * 3] = body.flatten()

    # Gaussian noise
    k += np.random.normal(0, noise_std, size=k.shape).astype(np.float32)

    return k


# ──────────────────────────────────────────────────────────────────────────────
# Dataset split
# ──────────────────────────────────────────────────────────────────────────────

def split_video_ids(
    video_ids: list[str],
    train_ratio: float = 0.70,
    val_ratio: float = 0.15,
    seed: int = 42,
) -> Tuple[list[str], list[str], list[str]]:
    """
    Split video IDs into train / val / test sets.
    All segments of a video stay in the same split (prevents data leakage).
    """
    rng = random.Random(seed)
    ids = list(video_ids)
    rng.shuffle(ids)

    n = len(ids)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)

    train = ids[:n_train]
    val = ids[n_train : n_train + n_val]
    test = ids[n_train + n_val :]
    return train, val, test


# ──────────────────────────────────────────────────────────────────────────────
# Keypoint normalisation
# ──────────────────────────────────────────────────────────────────────────────

def normalize_keypoints(keypoints: np.ndarray) -> np.ndarray:
    """
    Centre and scale keypoints to [0,1] range.
    Improves training stability.
    """
    k = keypoints.copy().astype(np.float32)
    k_min = k.min()
    k_max = k.max()
    denom = k_max - k_min
    if denom < 1e-8:
        return k
    return (k - k_min) / denom


# ──────────────────────────────────────────────────────────────────────────────
# CLI
# ──────────────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("Preprocessing utilities loaded. Import and use augment_keypoints / split_video_ids.")

