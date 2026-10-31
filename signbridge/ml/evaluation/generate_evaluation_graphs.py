"""
SignBridge – Evaluation Graphs Generator
Generates comprehensive visual dashboards and charts from training history
and evaluation benchmark reports.
"""
from __future__ import annotations

import json
from pathlib import Path
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[2]
MODELS_DIR = PROJECT_ROOT / "ml" / "models"
EVAL_DIR = PROJECT_ROOT / "ml" / "evaluation"


def generate_graphs() -> None:
    EVAL_DIR.mkdir(parents=True, exist_ok=True)

    # Load data
    history_file = MODELS_DIR / "training_history.json"
    eval_file = EVAL_DIR / "evaluation_report.json"

    if not history_file.exists():
        raise FileNotFoundError(f"Missing {history_file}")
    if not eval_file.exists():
        raise FileNotFoundError(f"Missing {eval_file}")

    with open(history_file, "r", encoding="utf-8") as f:
        history = json.load(f)

    with open(eval_file, "r", encoding="utf-8") as f:
        eval_report = json.load(f)

    # Set aesthetic theme
    sns.set_theme(style="darkgrid")
    plt.rcParams.update({
        "font.family": "sans-serif",
        "font.sans-serif": ["Segoe UI", "DejaVu Sans", "Arial"],
        "axes.edgecolor": "#374151",
        "axes.linewidth": 1.2,
    })

    # =========================================================================
    # 1. Training & Validation Curves (Dual-panel plot)
    # =========================================================================
    epochs = list(range(1, len(history["train_loss"]) + 1))

    fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(14, 5.5), dpi=200)
    fig.patch.set_facecolor("#0f172a")

    for ax in (ax1, ax2):
        ax.set_facecolor("#1e293b")
        ax.tick_params(colors="#cbd5e1")
        ax.xaxis.label.set_color("#f8fafc")
        ax.yaxis.label.set_color("#f8fafc")
        ax.title.set_color("#f8fafc")

    # Loss curve
    ax1.plot(epochs, history["train_loss"], label="Train Loss", color="#38bdf8", linewidth=2.5, marker="o", markersize=4)
    ax1.plot(epochs, history["val_loss"], label="Val Loss", color="#f43f5e", linewidth=2.5, linestyle="--", marker="s", markersize=4)
    ax1.set_title("Loss Trajectory over Epochs", fontsize=14, fontweight="bold", pad=12)
    ax1.set_xlabel("Epoch", fontsize=11, fontweight="medium")
    ax1.set_ylabel("Cross Entropy Loss", fontsize=11, fontweight="medium")
    legend1 = ax1.legend(frameon=True, facecolor="#0f172a", edgecolor="#334155")
    for text in legend1.get_texts():
        text.set_color("#f8fafc")

    # Accuracy curve
    train_acc_pct = [acc * 100 for acc in history["train_acc"]]
    val_acc_pct = [acc * 100 for acc in history["val_acc"]]
    ax2.plot(epochs, train_acc_pct, label="Train Accuracy", color="#34d399", linewidth=2.5, marker="o", markersize=4)
    ax2.plot(epochs, val_acc_pct, label="Val Accuracy", color="#fbbf24", linewidth=2.5, linestyle="--", marker="^", markersize=4)
    best_val_idx = int(np.argmax(val_acc_pct))
    best_val = val_acc_pct[best_val_idx]
    ax2.scatter([best_val_idx + 1], [best_val], color="#ef4444", s=100, zorder=5, label=f"Peak Val: {best_val:.1f}%")

    ax2.set_title("Accuracy Trajectory over Epochs", fontsize=14, fontweight="bold", pad=12)
    ax2.set_xlabel("Epoch", fontsize=11, fontweight="medium")
    ax2.set_ylabel("Accuracy (%)", fontsize=11, fontweight="medium")
    ax2.set_ylim(0, 105)
    legend2 = ax2.legend(frameon=True, facecolor="#0f172a", edgecolor="#334155", loc="lower right")
    for text in legend2.get_texts():
        text.set_color("#f8fafc")

    plt.suptitle("SignBridge ML - Model Training & Convergence Dynamics", fontsize=16, fontweight="bold", color="#f8fafc", y=1.02)
    plt.tight_layout()
    curves_path = EVAL_DIR / "training_curves.png"
    plt.savefig(curves_path, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"[OK] Training curves saved -> {curves_path}")

    # =========================================================================
    # 2. Comprehensive Evaluation Benchmark Dashboard (Multi-panel)
    # =========================================================================
    fig = plt.figure(figsize=(16, 9), dpi=200)
    fig.patch.set_facecolor("#0b0f19")
    gs = fig.add_gridspec(2, 3, height_ratios=[1, 1.2], hspace=0.35, wspace=0.25)

    # Panel A: Core Classification Metrics
    ax_metrics = fig.add_subplot(gs[0, 0:2])
    ax_metrics.set_facecolor("#111827")
    metrics_names = ["Accuracy", "Precision\n(Weighted)", "Recall\n(Weighted)", "F1-Score\n(Weighted)"]
    metrics_vals = [
        eval_report["accuracy"] * 100,
        eval_report["precision"] * 100,
        eval_report["recall"] * 100,
        eval_report["f1_score"] * 100,
    ]
    colors = ["#6366f1", "#06b6d4", "#10b981", "#8b5cf6"]
    bars = ax_metrics.bar(metrics_names, metrics_vals, color=colors, width=0.55, edgecolor="#374151")
    ax_metrics.set_ylim(0, 115)
    ax_metrics.set_ylabel("Score (%)", color="#e5e7eb", fontsize=11, fontweight="bold")
    ax_metrics.set_title("Test Set Performance Summary (100 ISL Classes)", color="#f9fafb", fontsize=13, fontweight="bold", pad=10)
    ax_metrics.tick_params(colors="#9ca3af")
    for bar in bars:
        h = bar.get_height()
        ax_metrics.annotate(
            f"{h:.2f}%",
            xy=(bar.get_x() + bar.get_width() / 2, h),
            xytext=(0, 5),
            textcoords="offset points",
            ha="center", va="bottom",
            color="#ffffff", fontweight="bold", fontsize=11
        )

    # Panel B: Latency vs PRD Target
    ax_lat = fig.add_subplot(gs[0, 2])
    ax_lat.set_facecolor("#111827")
    labels = ["SignBridge\n(Measured)", "PRD Max\nTarget Limit"]
    values = [eval_report["avg_inference_ms"], 200.0]
    bar_lat = ax_lat.bar(labels, values, color=["#10b981", "#ef4444"], width=0.5, edgecolor="#374151")
    ax_lat.set_yscale("log")
    ax_lat.set_ylabel("Inference Latency in ms (Log Scale)", color="#e5e7eb", fontsize=10, fontweight="bold")
    ax_lat.set_title("Real-Time Latency vs PRD Target", color="#f9fafb", fontsize=13, fontweight="bold", pad=10)
    ax_lat.tick_params(colors="#9ca3af")
    for bar, val in zip(bar_lat, values):
        ax_lat.annotate(
            f"{val:.2f} ms",
            xy=(bar.get_x() + bar.get_width() / 2, bar.get_height()),
            xytext=(0, 5),
            textcoords="offset points",
            ha="center", va="bottom",
            color="#ffffff", fontweight="bold", fontsize=10
        )

    # Panel C: Top 25 Classes F1-Score Distribution
    ax_classes = fig.add_subplot(gs[1, :])
    ax_classes.set_facecolor("#111827")

    per_class = eval_report.get("per_class", {})
    class_items = [
        (k, v.get("f1-score", 0.0) * 100)
        for k, v in per_class.items()
        if k not in ("accuracy", "macro avg", "weighted avg")
    ]
    # Sort descending
    class_items.sort(key=lambda x: x[1], reverse=True)
    top_classes = class_items[:25]

    top_names = [c[0] for c in top_classes]
    top_scores = [c[1] for c in top_classes]

    palette = sns.color_palette("mako", len(top_classes))
    bar_classes = ax_classes.bar(range(len(top_names)), top_scores, color=palette, edgecolor="#1f2937")
    ax_classes.set_xticks(range(len(top_names)))
    ax_classes.set_xticklabels(top_names, rotation=45, ha="right", fontsize=9, color="#d1d5db")
    ax_classes.set_ylim(0, 115)
    ax_classes.set_ylabel("F1-Score (%)", color="#e5e7eb", fontsize=11, fontweight="bold")
    ax_classes.set_title("Per-Class F1-Score Breakdown (Top 25 Representative ISL Classes)", color="#f9fafb", fontsize=13, fontweight="bold", pad=10)
    ax_classes.tick_params(colors="#9ca3af")

    for bar, score in zip(bar_classes, top_scores):
        if score > 0:
            ax_classes.annotate(
                f"{int(round(score))}%",
                xy=(bar.get_x() + bar.get_width() / 2, score),
                xytext=(0, 3),
                textcoords="offset points",
                ha="center", va="bottom",
                color="#e5e7eb", fontsize=7.5, fontweight="bold"
            )

    plt.suptitle("SignBridge - Evaluation Benchmark Report & Real-Time Performance Dashboard", fontsize=16, fontweight="bold", color="#ffffff", y=0.98)
    dashboard_path = EVAL_DIR / "evaluation_metrics_dashboard.png"
    plt.savefig(dashboard_path, facecolor=fig.get_facecolor(), bbox_inches="tight")
    plt.close()
    print(f"[OK] Evaluation dashboard saved -> {dashboard_path}")


if __name__ == "__main__":
    generate_graphs()

