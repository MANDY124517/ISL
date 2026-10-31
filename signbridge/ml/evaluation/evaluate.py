"""
SignBridge ML – Model Evaluation
Generates accuracy, precision, recall, F1, confusion matrix.
"""
from __future__ import annotations

import json
from pathlib import Path
from typing import List

import numpy as np

try:
    import torch
    from sklearn.metrics import (
        accuracy_score,
        classification_report,
        confusion_matrix,
        f1_score,
        precision_score,
        recall_score,
    )
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import seaborn as sns
    _DEPS = True
except ImportError:
    _DEPS = False
    print("Install torch, scikit-learn, matplotlib, seaborn before evaluating.")
    exit(1)

import sys
PROJECT_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(PROJECT_ROOT))
sys.path.insert(0, str(PROJECT_ROOT / "backend"))
from app.services.inference import PoseClassifier


def evaluate(
    model_path: Path,
    test_data_dir: Path,
    class_mapping_path: Path,
    output_dir: Path,
) -> None:
    if not model_path.is_absolute() and not model_path.exists():
        model_path = (PROJECT_ROOT / model_path).resolve()
    if not test_data_dir.is_absolute() and not test_data_dir.exists():
        test_data_dir = (PROJECT_ROOT / test_data_dir).resolve()
    if not class_mapping_path.is_absolute() and not class_mapping_path.exists():
        class_mapping_path = (PROJECT_ROOT / class_mapping_path).resolve()
    if not output_dir.is_absolute() and not output_dir.exists():
        output_dir = (PROJECT_ROOT / output_dir).resolve()

    output_dir.mkdir(parents=True, exist_ok=True)

    with open(class_mapping_path, "r", encoding="utf-8") as f:
        mapping = json.load(f)
    class_names: List[str] = [v["isl_label"] for v in mapping.values()]
    num_classes = len(class_names)

    # Load model
    checkpoint = torch.load(str(model_path), map_location="cpu", weights_only=False)
    model = PoseClassifier(num_classes=checkpoint.get("num_classes", num_classes))
    model.load_state_dict(checkpoint["model_state_dict"])
    model.eval()

    # Collect test samples
    all_preds, all_labels = [], []
    latencies = []

    for idx, name in enumerate(class_names):
        class_dir = test_data_dir / name
        if not class_dir.exists():
            continue
        for npy_file in class_dir.glob("*.npy"):
            kp = np.load(str(npy_file)).astype(np.float32)
            from ml.preprocessing.pipeline import normalize_keypoints
            kp = normalize_keypoints(kp)
            x = torch.tensor(kp).unsqueeze(0)
            import time
            t0 = time.perf_counter()
            with torch.no_grad():
                logits = model(x)
                pred = logits.argmax(dim=-1).item()
            latencies.append((time.perf_counter() - t0) * 1000)
            all_preds.append(pred)
            all_labels.append(idx)

    if not all_preds:
        print("No test data found.")
        return

    # Metrics
    acc = accuracy_score(all_labels, all_preds)
    precision = precision_score(all_labels, all_preds, average="weighted", zero_division=0)
    recall = recall_score(all_labels, all_preds, average="weighted", zero_division=0)
    f1 = f1_score(all_labels, all_preds, average="weighted", zero_division=0)
    avg_latency = float(np.mean(latencies))
    fps = 1000.0 / max(avg_latency, 1e-3)

    report = {
        "accuracy": round(acc, 4),
        "precision": round(precision, 4),
        "recall": round(recall, 4),
        "f1_score": round(f1, 4),
        "avg_inference_ms": round(avg_latency, 2),
        "approx_fps": round(fps, 1),
        "test_samples": len(all_labels),
        "per_class": json.loads(
            json.dumps(
                classification_report(
                    all_labels,
                    all_preds,
                    target_names=class_names[: max(all_labels, default=0) + 1],
                    output_dict=True,
                    zero_division=0,
                )
            )
        ),
    }

    with open(output_dir / "evaluation_report.json", "w") as f:
        json.dump(report, f, indent=2)

    print("\n" + "=" * 50)
    print("Model Evaluation")
    print("=" * 50)
    print(f"Accuracy:             {acc * 100:.2f}%")
    print(f"Precision (weighted): {precision * 100:.2f}%")
    print(f"Recall (weighted):    {recall * 100:.2f}%")
    print(f"F1 (weighted):        {f1 * 100:.2f}%")
    print(f"Avg Inference Time:   {avg_latency:.1f} ms")
    print(f"Approx FPS:           {fps:.1f}")

    # Confusion matrix
    labels_present = sorted(set(all_labels + all_preds))
    names_present = [class_names[i] for i in labels_present if i < len(class_names)]
    cm = confusion_matrix(all_labels, all_preds, labels=labels_present)

    fig, ax = plt.subplots(figsize=(max(8, num_classes // 2), max(6, num_classes // 2)))
    sns.heatmap(
        cm,
        annot=num_classes <= 30,
        fmt="d",
        xticklabels=names_present,
        yticklabels=names_present,
        cmap="Blues",
        ax=ax,
    )
    ax.set_xlabel("Predicted")
    ax.set_ylabel("True")
    ax.set_title("Confusion Matrix - SignBridge")
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=150)
    plt.close()

    print(f"\nReport  -> {output_dir / 'evaluation_report.json'}")
    print(f"CM Plot -> {output_dir / 'confusion_matrix.png'}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="SignBridge - Evaluate PoseClassifier")
    parser.add_argument("--model_path", type=Path, default=PROJECT_ROOT / "ml" / "models" / "signbridge_model.pt")
    parser.add_argument("--test_data_dir", type=Path, default=PROJECT_ROOT / "ml" / "data" / "keypoints" / "test")
    parser.add_argument("--class_mapping", type=Path, default=PROJECT_ROOT / "data" / "class_mapping.json")
    parser.add_argument("--output_dir", type=Path, default=PROJECT_ROOT / "ml" / "evaluation")
    args = parser.parse_args()
    evaluate(args.model_path, args.test_data_dir, args.class_mapping, args.output_dir)

