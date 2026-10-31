"""
SignBridge ML - Hugging Face iSign Dataset Loader
Provides seamless integration with the official Indian Sign Language benchmark:
    Exploration-Lab/iSign (arXiv:2407.05404)

Supports all 3 benchmark dataset configurations:
    1. 'iSign_v1.1'                     -> Core ISL-to-English / English-to-ISL video translations
    2. 'word-description-dataset_v1.1' -> Sign semantics & word-description pairs (Task-5)
    3. 'word-presence-dataset_v1.1'    -> Word presence prediction (Task-4)
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any, Generator

PROJECT_ROOT = Path(__file__).resolve().parents[2]
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

SUPPORTED_CONFIGS = [
    "iSign_v1.1",
    "word-description-dataset_v1.1",
    "word-presence-dataset_v1.1",
]


def check_datasets_library() -> None:
    """Verify that Hugging Face `datasets` is installed."""
    try:
        import datasets  # noqa: F401
    except ImportError:
        raise ImportError(
            "The Hugging Face 'datasets' library is required to load iSign.\n"
            "Please install it in your environment using:\n"
            "    pip install datasets"
        )


def load_isign_dataset(
    config: str = "iSign_v1.1",
    split: str = "train",
    streaming: bool = True,
    trust_remote_code: bool = True,
):
    """
    Load a specific configuration of Exploration-Lab/iSign.

    Args:
        config: One of 'iSign_v1.1', 'word-description-dataset_v1.1', 'word-presence-dataset_v1.1'.
        split: Dataset split ('train', 'validation', 'test').
        streaming: If True, streams the dataset to avoid downloading massive video archives.
        trust_remote_code: Hugging Face security flag.

    Returns:
        Hugging Face Dataset or IterableDataset.
    """
    check_datasets_library()
    from datasets import load_dataset

    if config not in SUPPORTED_CONFIGS:
        raise ValueError(
            f"Unknown config '{config}'. Must be one of: {SUPPORTED_CONFIGS}"
        )

    print(f"[*] Loading Exploration-Lab/iSign [{config}] (split='{split}', streaming={streaming})...")
    ds = load_dataset(
        "Exploration-Lab/iSign",
        config,
        split=split,
        streaming=streaming,
        trust_remote_code=trust_remote_code,
    )
    return ds


def inspect_isign(
    config: str = "iSign_v1.1",
    max_samples: int = 5,
    streaming: bool = True,
) -> list[dict[str, Any]]:
    """
    Inspect the top records and schema of the requested iSign dataset.
    """
    ds = load_isign_dataset(config=config, streaming=streaming)
    samples: list[dict[str, Any]] = []

    print(f"\n=== Inspection Report for Exploration-Lab/iSign [{config}] ===")
    for idx, item in enumerate(ds):
        if idx >= max_samples:
            break
        # Filter out heavy raw video bytes for readable display
        clean_item = {
            k: (f"<bytes {len(v)}>" if isinstance(v, bytes) else v)
            for k, v in item.items()
        }
        samples.append(clean_item)
        print(f"Sample #{idx + 1}: {json.dumps(clean_item, indent=2, default=str)}")

    print(f"Total samples inspected: {len(samples)}\n")
    return samples


def extract_vocabulary_from_word_description(
    max_words: int = 100,
    output_path: Path | None = None,
) -> dict[str, dict[str, str]]:
    """
    Extract vocabulary mappings from word-description-dataset_v1.1.
    Returns a dictionary formatted for SignBridge's data/class_mapping.json.
    """
    ds = load_isign_dataset(config="word-description-dataset_v1.1", streaming=True)
    mapping: dict[str, dict[str, str]] = {}

    count = 0
    for item in ds:
        word = item.get("word") or item.get("gloss") or item.get("sign") or item.get("text")
        description = item.get("description") or item.get("meaning") or ""

        if not word:
            continue

        clean_word = str(word).strip().upper()
        class_id = f"isign_{count + 1:04d}"

        mapping[class_id] = {
            "isl_label": clean_word,
            "english": str(word).strip().capitalize(),
            "description": str(description).strip(),
            "source": "Exploration-Lab/iSign",
        }
        count += 1
        if count >= max_words:
            break

    print(f"[OK] Extracted {len(mapping)} vocabulary terms from iSign.")

    if output_path:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            json.dump(mapping, f, indent=2)
        print(f"[OK] Saved vocabulary mapping to {output_path}")

    return mapping


def main():
    parser = argparse.ArgumentParser(
        description="Exploration-Lab/iSign Dataset Loader for SignBridge"
    )
    parser.add_argument(
        "--config",
        choices=SUPPORTED_CONFIGS,
        default="word-description-dataset_v1.1",
        help="iSign configuration to load",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=5,
        help="Number of samples to inspect",
    )
    parser.add_argument(
        "--extract-vocab",
        action="store_true",
        help="Extract vocabulary from word-description-dataset and export to class_mapping",
    )
    parser.add_argument(
        "--out",
        type=str,
        default=str(PROJECT_ROOT / "data" / "isign_vocabulary.json"),
        help="Output path for extracted vocabulary",
    )
    args = parser.parse_args()

    if args.extract_vocab:
        extract_vocabulary_from_word_description(
            max_words=args.samples,
            output_path=Path(args.out),
        )
    else:
        inspect_isign(config=args.config, max_samples=args.samples, streaming=True)


if __name__ == "__main__":
    main()
