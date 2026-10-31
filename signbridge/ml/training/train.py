"""
SignBridge ML – Training Pipeline
Trains a PoseClassifier on MediaPipe / OpenCV keypoint data.

Usage:
    python ml/training/train.py
    python -m ml.training.train --epochs 25
"""
from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import List

import numpy as np

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, Dataset

    _TORCH = True
except ImportError:
    _TORCH = False
    print("PyTorch not installed. Install it before running training.")
    exit(1)

import sys
PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))
if str(PROJECT_ROOT / "backend") not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT / "backend"))

from app.services.inference import PoseClassifier
from ml.preprocessing.pipeline import augment_keypoints, normalize_keypoints


# ── Dataset ──────────────────────────────────────────────────────────────────

class KeypointDataset(Dataset):
    """
    Loads pre-extracted MediaPipe / OpenCV keypoint .npy files.
    Directory structure:
        data_dir/
            HELLO/
                sample_0001.npy
                sample_0002.npy
            THANK_YOU/
                ...
    """

    def __init__(self, data_dir: Path, class_names: List[str], augment: bool = False) -> None:
        self.samples: List[tuple[np.ndarray, int]] = []
        self.augment = augment

        for idx, name in enumerate(class_names):
            class_dir = data_dir / name
            if not class_dir.exists():
                continue
            for npy_file in class_dir.glob("*.npy"):
                try:
                    kp = np.load(str(npy_file)).astype(np.float32)
                    if kp.size == PoseClassifier.FEATURE_DIM:
                        self.samples.append((kp.flatten(), idx))
                except Exception:
                    continue

    def __len__(self) -> int:
        return len(self.samples)

    def __getitem__(self, idx: int):
        kp, label = self.samples[idx]
        if self.augment:
            kp = augment_keypoints(kp)
        kp = normalize_keypoints(kp)
        return torch.tensor(kp, dtype=torch.float32), torch.tensor(label, dtype=torch.long)


# ── Training ─────────────────────────────────────────────────────────────────

def train(
    data_dir: Path,
    class_mapping_path: Path,
    output_dir: Path,
    epochs: int = 25,
    batch_size: int = 32,
    lr: float = 1e-3,
    device: str = "cpu",
) -> None:
    # Robustly resolve paths relative to project root if needed
    if not class_mapping_path.is_absolute() and not class_mapping_path.exists():
        class_mapping_path = (PROJECT_ROOT / class_mapping_path).resolve()
    if not data_dir.is_absolute() and not data_dir.exists():
        data_dir = (PROJECT_ROOT / data_dir).resolve()
    if not output_dir.is_absolute() and not output_dir.exists():
        output_dir = (PROJECT_ROOT / output_dir).resolve()

    output_dir.mkdir(parents=True, exist_ok=True)

    if not class_mapping_path.exists():
        raise FileNotFoundError(f"Class mapping file not found at: {class_mapping_path}")

    # Load class mapping
    with open(class_mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    class_names = [v["isl_label"] for v in mapping.values()]
    num_classes = len(class_names)

    print(f"Classes: {num_classes}")
    print(f"Device:  {device}")
    print(f"Dataset: {data_dir}")

    # Datasets
    train_ds = KeypointDataset(data_dir / "train", class_names, augment=True)
    val_ds = KeypointDataset(data_dir / "val", class_names, augment=False)

    if len(train_ds) == 0:
        print(f"[!] No training data found at: {data_dir / 'train'}")
        print("    Run 'python ml/dataset/generate_dataset.py' to generate keypoint splits.")
        return

    train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_ds, batch_size=batch_size, shuffle=False, num_workers=0)

    # Model
    model = PoseClassifier(num_classes=num_classes).to(device)
    optimizer = torch.optim.Adam(model.parameters(), lr=lr, weight_decay=1e-4)
    scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs)
    criterion = nn.CrossEntropyLoss()

    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    best_val_acc = 0.0

    for epoch in range(1, epochs + 1):
        # ── Train ────────────────────────────────────────────────────────────
        model.train()
        total_loss, correct, total = 0.0, 0, 0
        t0 = time.perf_counter()

        for x, y in train_loader:
            x, y = x.to(device), y.to(device)
            optimizer.zero_grad()
            logits = model(x)
            loss = criterion(logits, y)
            loss.backward()
            optimizer.step()

            total_loss += loss.item() * len(y)
            preds = logits.argmax(dim=-1)
            correct += (preds == y).sum().item()
            total += len(y)

        train_loss = total_loss / max(total, 1)
        train_acc = correct / max(total, 1)
        scheduler.step()

        # ── Validate ─────────────────────────────────────────────────────────
        model.eval()
        v_loss, v_correct, v_total = 0.0, 0, 0
        with torch.no_grad():
            for x, y in val_loader:
                x, y = x.to(device), y.to(device)
                logits = model(x)
                loss = criterion(logits, y)
                v_loss += loss.item() * len(y)
                preds = logits.argmax(dim=-1)
                v_correct += (preds == y).sum().item()
                v_total += len(y)

        val_loss = v_loss / max(v_total, 1)
        val_acc = v_correct / max(v_total, 1)
        elapsed = time.perf_counter() - t0

        history["train_loss"].append(round(train_loss, 4))
        history["train_acc"].append(round(train_acc, 4))
        history["val_loss"].append(round(val_loss, 4))
        history["val_acc"].append(round(val_acc, 4))

        print(
            f"Epoch {epoch:>3}/{epochs} | "
            f"train_loss={train_loss:.4f} acc={train_acc:.3f} | "
            f"val_loss={val_loss:.4f} acc={val_acc:.3f} | "
            f"{elapsed:.1f}s"
        )

        if val_acc > best_val_acc or epoch == 1:
            best_val_acc = val_acc
            checkpoint = {
                "epoch": epoch,
                "model_state_dict": model.state_dict(),
                "num_classes": num_classes,
                "model_name": "PoseClassifier",
                "class_names": class_names,
                "val_acc": val_acc,
            }
            torch.save(checkpoint, output_dir / "signbridge_model.pt")
            print(f"  * Best model saved (val_acc={val_acc:.3f})")

    # Save class names list (PRD Section 10)
    with open(output_dir / "class_names.json", "w", encoding="utf-8") as f:
        json.dump(class_names, f, indent=2)

    # Save training history
    with open(output_dir / "training_history.json", "w", encoding="utf-8") as f:
        json.dump(history, f, indent=2)

    print(f"\nTraining complete. Best val_acc = {best_val_acc:.3f}")
    print(f"Model saved to: {output_dir / 'signbridge_model.pt'}")
    print(f"Class names saved to: {output_dir / 'class_names.json'}")
    print(f"Training history saved to: {output_dir / 'training_history.json'}")


# ── CLI ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    auto_device = "cuda" if _TORCH and torch.cuda.is_available() else "cpu"

    parser = argparse.ArgumentParser(description="SignBridge - Train PoseClassifier")
    parser.add_argument("--data_dir", type=Path, default=PROJECT_ROOT / "ml" / "data" / "keypoints")
    parser.add_argument("--class_mapping", type=Path, default=PROJECT_ROOT / "data" / "class_mapping.json")
    parser.add_argument("--output_dir", type=Path, default=PROJECT_ROOT / "ml" / "models")
    parser.add_argument("--epochs", type=int, default=25)
    parser.add_argument("--batch_size", type=int, default=32)
    parser.add_argument("--lr", type=float, default=1e-3)
    parser.add_argument("--device", type=str, default=auto_device)
    args = parser.parse_args()

    train(
        data_dir=args.data_dir,
        class_mapping_path=args.class_mapping,
        output_dir=args.output_dir,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        device=args.device,
    )
