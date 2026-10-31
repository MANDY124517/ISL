"""
ML pipeline tests.
"""
import json
import numpy as np
from pathlib import Path
import pytest

# Ensure backend is importable
import sys
sys.path.insert(0, str(Path(__file__).parents[2] / "backend"))


def test_class_mapping_exists():
    """class_mapping.json should exist and have at least 10 classes."""
    p = Path(__file__).parents[2] / "data" / "class_mapping.json"
    assert p.exists(), f"Missing {p}"
    with open(p) as f:
        mapping = json.load(f)
    assert len(mapping) >= 10


def test_class_mapping_schema():
    """Each class should have isl_label and english keys."""
    p = Path(__file__).parents[2] / "data" / "class_mapping.json"
    with open(p) as f:
        mapping = json.load(f)
    for key, val in mapping.items():
        assert "isl_label" in val, f"Missing isl_label in {key}"
        assert "english" in val, f"Missing english in {key}"


def test_keypoint_feature_dim():
    """Feature dimension must match PoseClassifier.FEATURE_DIM."""
    from app.services.inference import PoseClassifier
    # left hand: 21*3=63, right hand: 21*3=63, pose: 33*4=132  → total=258
    expected = 21 * 3 * 2 + 33 * 4
    assert PoseClassifier.FEATURE_DIM == expected


def test_inference_service_demo_mode(tmp_path):
    """InferenceService should function in demo mode without a model file."""
    from app.services.inference import InferenceService

    # Point to non-existent model → should gracefully fall back to demo mode
    svc = InferenceService(
        model_path=tmp_path / "nonexistent.pt",
        class_mapping_path=Path(__file__).parents[2] / "data" / "class_mapping.json",
        confidence_threshold=0.80,
    )
    assert not svc.model_loaded

    # Demo inference should still return something
    label, conf = svc._demo_infer()
    assert isinstance(label, str)
    assert 0.0 <= conf <= 1.0


def test_temporal_smoothing():
    """Temporal smoothing should require min_occurrences to confirm a prediction."""
    from app.services.inference import InferenceService
    from pathlib import Path

    svc = InferenceService(
        model_path=Path("nonexistent"),
        class_mapping_path=Path(__file__).parents[2] / "data" / "class_mapping.json",
        window_size=5,
        min_occurrences=3,
    )

    # Feed 2 of the same – shouldn't commit
    svc.smooth_prediction("HELLO")
    result = svc.smooth_prediction("HELLO")
    assert result is None  # only 2/5 filled

    # Feed 3 more – should commit
    svc.smooth_prediction("HELLO")
    svc.smooth_prediction("HELLO")
    result = svc.smooth_prediction("HELLO")
    assert result == "HELLO"

    svc.reset_window()
    assert len(svc._prediction_window) == 0

