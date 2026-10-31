"""
SignBridge ML – Keypoint Dataset Generator
Generates realistic initial MediaPipe Holistic keypoint samples (258 dimensions:
63 left hand + 63 right hand + 132 body pose) for supported classes from
data/class_mapping.json, following the 70% Train / 15% Val / 15% Test split (PRD Section 8).
"""
from __future__ import annotations

import json
from pathlib import Path
import numpy as np

CLASS_MAPPING_PATH = Path(__file__).resolve().parents[2] / "data" / "class_mapping.json"
DATA_DIR = Path(__file__).resolve().parents[1] / "data" / "keypoints"


def generate_dataset(
    class_mapping_path: Path = CLASS_MAPPING_PATH,
    output_dir: Path = DATA_DIR,
    samples_per_class: int = 50,
    seed: int = 42,
) -> None:
    np.random.seed(seed)
    with open(class_mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)

    class_names = [v["isl_label"] for v in mapping.values()]
    num_classes = len(class_names)
    print(f"Generating keypoint samples for {num_classes} classes...")

    train_dir = output_dir / "train"
    val_dir = output_dir / "val"
    test_dir = output_dir / "test"

    for d in (train_dir, val_dir, test_dir):
        d.mkdir(parents=True, exist_ok=True)

    n_train = int(samples_per_class * 0.70)
    n_val = int(samples_per_class * 0.15)
    n_test = samples_per_class - n_train - n_val

    # Feature dimension: 21*3 + 21*3 + 33*4 = 258
    dim = 258

    for c_idx, name in enumerate(class_names):
        # Base anchor vector unique to this sign class
        # Hand anchors: mean x, y in [0.2, 0.8] range
        # Pose anchors: head and shoulders normalized
        base_anchor = np.zeros(dim, dtype=np.float32)

        # Right hand landmarks (index 63 to 126)
        rh_center_x = 0.5 + 0.3 * np.sin(c_idx * 1.7)
        rh_center_y = 0.5 + 0.3 * np.cos(c_idx * 1.3)
        for i in range(21):
            base_anchor[63 + i * 3] = rh_center_x + 0.05 * np.cos(i * 0.3)
            base_anchor[63 + i * 3 + 1] = rh_center_y + 0.05 * np.sin(i * 0.3)
            base_anchor[63 + i * 3 + 2] = -0.05 * np.sin(i * 0.5)

        # Left hand landmarks (index 0 to 63)
        lh_active = (c_idx % 3 != 0)  # Two-handed signs
        if lh_active:
            lh_center_x = 0.5 - 0.25 * np.sin(c_idx * 1.1)
            lh_center_y = rh_center_y + 0.1 * np.cos(c_idx * 0.9)
            for i in range(21):
                base_anchor[i * 3] = lh_center_x + 0.04 * np.cos(i * 0.4)
                base_anchor[i * 3 + 1] = lh_center_y + 0.04 * np.sin(i * 0.4)
                base_anchor[i * 3 + 2] = -0.03 * np.cos(i * 0.2)

        # Pose landmarks (index 126 to 258)
        # Shoulders (index 11, 12 in pose), wrists (15, 16)
        base_anchor[126 + 11 * 4] = 0.4  # left shoulder x
        base_anchor[126 + 11 * 4 + 1] = 0.4  # left shoulder y
        base_anchor[126 + 12 * 4] = 0.6  # right shoulder x
        base_anchor[126 + 12 * 4 + 1] = 0.4  # right shoulder y
        base_anchor[126 + 15 * 4] = base_anchor[0]  # left wrist matches hand
        base_anchor[126 + 15 * 4 + 1] = base_anchor[1]
        base_anchor[126 + 16 * 4] = base_anchor[63]  # right wrist matches hand
        base_anchor[126 + 16 * 4 + 1] = base_anchor[64]

        # Populate for train / val / test
        for split_name, count, target_dir in [
            ("train", n_train, train_dir),
            ("val", n_val, val_dir),
            ("test", n_test, test_dir),
        ]:
            c_dir = target_dir / name
            c_dir.mkdir(parents=True, exist_ok=True)
            for s in range(count):
                # Add natural intra-class variation & signer noise
                noise = np.random.normal(0, 0.018, size=dim).astype(np.float32)
                # Small signer offset
                offset_x = np.random.uniform(-0.02, 0.02)
                offset_y = np.random.uniform(-0.02, 0.02)
                sample = base_anchor + noise
                sample[0::3] += offset_x
                sample[1::3] += offset_y
                np.save(c_dir / f"sample_{s:04d}.npy", sample)

    print(f"Dataset generated:")
    print(f"  Train: {n_train * num_classes} samples (70%)")
    print(f"  Val:   {n_val * num_classes} samples (15%)")
    print(f"  Test:  {n_test * num_classes} samples (15%)")
    print(f"  Location: {output_dir}")


if __name__ == "__main__":
    generate_dataset()

