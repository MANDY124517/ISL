"""
SignBridge ML – Dataset Analyzer
Inspects the ISLTranslate dataset and generates a comprehensive report
adhering to Section 6 of the SignBridge PRD.
"""
from __future__ import annotations

import csv
import json
from collections import Counter, defaultdict
from pathlib import Path


# Locate ISLTranslate dataset robustly
CANDIDATE_DIRS = [
    Path("c:/ISL/ISLTranslate/data"),
    Path(__file__).resolve().parents[3] / "ISLTranslate" / "data",
    Path(__file__).resolve().parents[2] / "ISLTranslate" / "data",
]

DATA_DIR = next((p for p in CANDIDATE_DIRS if p.exists()), CANDIDATE_DIRS[0])
MAIN_CSV = DATA_DIR / "ISLTranslate.csv"
OUTPUT_DIR = Path(__file__).resolve().parent / "reports"


def analyze_dataset(csv_path: Path = MAIN_CSV) -> dict:
    """Analyze the ISLTranslate CSV and return a statistics dict."""
    if not csv_path.exists():
        raise FileNotFoundError(f"Dataset not found at {csv_path}")

    video_sentences: dict[str, list[str]] = defaultdict(list)
    corrupt_or_empty = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            uid: str = row.get("uid", "").strip()
            text: str = row.get("text", "").strip()
            if not uid or not text:
                corrupt_or_empty += 1
                continue
            video_id = uid.rsplit("-", 1)[0]
            video_sentences[video_id].append(text)

    total_segments = sum(len(v) for v in video_sentences.values())
    segment_counts = [len(v) for v in video_sentences.values()]

    # Word / sign frequency analysis
    all_words: list[str] = []
    all_sentences: list[str] = []
    sign_counts: Counter = Counter()

    for segs in video_sentences.values():
        for seg in segs:
            all_sentences.append(seg)
            words = seg.split()
            for w in words:
                clean = w.strip(".,?!\"'").upper()
                if len(clean) >= 2 and clean.isalpha():
                    all_words.append(clean)
                    sign_counts[clean] += 1

    top_signs = sign_counts.most_common(100)
    largest_class = top_signs[0] if top_signs else ("N/A", 0)
    smallest_class = top_signs[-1] if top_signs else ("N/A", 0)

    # Imbalance calculation: ratio of largest to smallest frequency in top classes
    imbalance_ratio = round(largest_class[1] / max(smallest_class[1], 1), 2)
    has_imbalance = imbalance_ratio > 3.0

    stats = {
        "dataset_name": "ISLTranslate / iSign Benchmark",
        "total_videos": len(video_sentences),
        "total_segments": total_segments,
        "corrupt_or_empty_rows": corrupt_or_empty,
        "avg_segments_per_video": round(total_segments / max(len(video_sentences), 1), 2),
        "max_segments_per_video": max(segment_counts) if segment_counts else 0,
        "min_segments_per_video": min(segment_counts) if segment_counts else 0,
        "total_supported_classes": len(top_signs),
        "total_unique_words": len(sign_counts),
        "total_word_tokens": len(all_words),
        "largest_class": {
            "label": largest_class[0],
            "count": largest_class[1],
        },
        "smallest_class": {
            "label": smallest_class[0],
            "count": smallest_class[1],
        },
        "imbalance_ratio": imbalance_ratio,
        "potential_imbalance": "YES" if has_imbalance else "NO",
        "top_30_classes": top_signs[:30],
        "sample_sentences": all_sentences[:10],
    }
    return stats


def generate_class_mapping(csv_path: Path = MAIN_CSV, top_n: int = 100) -> dict:
    """
    Build a class mapping from the top N most frequent ISL signs.
    Returns a dict suitable for data/class_mapping.json.
    """
    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        texts = [row["text"].strip() for row in reader if row.get("text")]

    phrase_counter: Counter = Counter()
    for text in texts:
        for w in text.split():
            clean = w.strip(".,?!\"'").upper()
            if len(clean) >= 2 and clean.isalpha():
                phrase_counter[clean] += 1

    top_signs = phrase_counter.most_common(top_n)

    mapping = {}
    for idx, (label, count) in enumerate(top_signs):
        key = f"class_{idx:03d}"
        mapping[key] = {
            "isl_label": label,
            "english": label.capitalize(),
            "frequency": count,
        }
    return mapping


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    print("=" * 60)
    print("SignBridge - Dataset Structure & Imbalance Report")
    print("=" * 60)

    stats = analyze_dataset()

    print(f"\nDataset:                  {stats['dataset_name']}")
    print(f"Total Videos:             {stats['total_videos']}")
    print(f"Total Segments / Rows:    {stats['total_segments']}")
    print(f"Avg Segments / Video:     {stats['avg_segments_per_video']}")
    print(f"Supported Classes:        {stats['total_supported_classes']}")
    print(f"Largest Class:            {stats['largest_class']['label']} ({stats['largest_class']['count']} occurrences)")
    print(f"Smallest Class:           {stats['smallest_class']['label']} ({stats['smallest_class']['count']} occurrences)")
    print(f"Imbalance Ratio:          {stats['imbalance_ratio']}x")
    print(f"Potential Imbalance:      {stats['potential_imbalance']}")

    print("\nTop 15 ISL Classes:")
    for label, count in stats["top_30_classes"][:15]:
        print(f"  * {label:<15} : {count} samples")

    # Save dataset report
    report_path = OUTPUT_DIR / "dataset_report.json"
    with open(report_path, "w", encoding="utf-8") as f:
        json.dump(stats, f, indent=2, ensure_ascii=False)
    print(f"\nReport successfully saved -> {report_path}")

    # Generate and update class mapping
    mapping = generate_class_mapping()
    mapping_path = Path(__file__).resolve().parents[2] / "data" / "class_mapping.json"
    mapping_path.parent.mkdir(parents=True, exist_ok=True)
    with open(mapping_path, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    print(f"Class mapping successfully saved -> {mapping_path}")


if __name__ == "__main__":
    main()
