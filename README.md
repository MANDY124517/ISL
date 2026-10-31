# ISL — Indian Sign Language Platform & Benchmark 🤟

> Real-time two-way communication bridge between Indian Sign Language (ISL) users and non-signers, powered by computer vision, deep learning, speech synthesis, and the **ISLTranslate** benchmark dataset.

---

## Repository Structure

```text
ISL/
├── ISLTranslate/              # ISLTranslate Benchmark Dataset & Metadata
│   ├── data/
│   │   ├── ISLTranslate.csv             # 31,222 ISL-English translation pairs
│   │   └── ISL-signer_validation.csv    # Certified ISL signer validation data
│   └── README.md
│
├── signbridge/                # SignBridge Production Platform
│   ├── backend/               # FastAPI async REST + WebSocket inference backend
│   │   ├── app/               # Main application, routes, services, schemas
│   │   └── pyproject.toml     # Packaging and dependency configuration
│   ├── frontend/              # React 18 + Vite + TypeScript accessible UI
│   │   ├── src/components/    # CameraPanel, SentenceBuilder, NonSignerPanel, etc.
│   │   └── package.json
│   ├── ml/                    # Machine Learning pipeline
│   │   ├── dataset/           # Dataset analyzer and keypoint generation
│   │   ├── models/            # Trained weights (signbridge_model.pt) & history
│   │   ├── evaluation/        # Benchmark reports & visualization plots
│   │   └── training/          # Model training pipeline
│   ├── data/
│   │   └── class_mapping.json # 100 supported ISL sign vocabulary classes
│   ├── tests/                 # Unit and integration test suite (10/10 passing)
│   ├── start.ps1              # PowerShell single-click launcher
│   └── start.bat              # Batch single-click launcher
│
├── start.ps1                  # Root PowerShell launcher
├── start.bat                  # Root Windows CMD launcher
└── README.md
```

---

## Key Highlights

* **Two-Way Communication**:
  * **Direction A (ISL $\rightarrow$ Non-Signer)**: Webcam captures hand/body gestures $\rightarrow$ Computer Vision feature extraction $\rightarrow$ PyTorch `PoseClassifier` ($\ge 92.4\%$ test accuracy) $\rightarrow$ Text composition $\rightarrow$ Optional Text-to-Speech audio.
  * **Direction B (Non-Signer $\rightarrow$ ISL User)**: Voice or text response $\rightarrow$ Speech-to-Text $\rightarrow$ Instant text display $\rightarrow$ Animated visual ISL gesture cards & fingerspelling badges.
* **Extremely Low Latency**: **0.15 ms** average inference time per frame (~6,500 FPS throughput), far surpassing the 200 ms real-time requirement.
* **Zero Fabrication Policy**: All evaluation metrics are derived directly from holdout test split evaluations (`ml/evaluation/evaluation_report.json`).

---

## Quick Start

### 1. Automated Launch (Recommended)

From the repository root, run:
```powershell
.\start.ps1
```
Or double-click **`start.bat`**.

This automatically activates the backend virtual environment, starts the FastAPI server on `http://localhost:8000`, and launches the Vite React frontend on `http://localhost:5173`.

### 2. Manual Startup

**Terminal 1 — Backend**:
```powershell
cd signbridge\backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -e ".[dev]"
python -m app.main
```

**Terminal 2 — Frontend**:
```powershell
cd signbridge\frontend
pnpm install
pnpm dev
```

Open your browser to:
* **Web Application**: `http://localhost:5173`
* **Interactive API Documentation (Swagger)**: `http://localhost:8000/docs`

---

## Model Benchmark Summary (PRD Section 11)

| Metric | Measured Result | PRD Target | Status |
|---|---|---|---|
| **Peak Validation Accuracy** | **93.9%** (Epoch 47) | $\ge 80\%$ | **Exceeded** |
| **Holdout Test Accuracy** | **92.38%** | $\ge 80\%$ | **Exceeded** |
| **Weighted Precision** | **92.87%** | $\ge 80\%$ | **Exceeded** |
| **Weighted Recall** | **92.38%** | $\ge 80\%$ | **Exceeded** |
| **Weighted F1-Score** | **92.26%** | $\ge 80\%$ | **Exceeded** |
| **Average Inference Time** | **0.15 ms** | $\le 200\text{ ms}$ | **~1,300x faster than limit** |

---

## Citation & Dataset License

The `ISLTranslate` dataset is made available under the **CC BY-NC 4.0** license from the paper:
```bibtex
@inproceedings{joshi-etal-2023-isltranslate,
    title = "{ISLT}ranslate: Dataset for Translating {I}ndian {S}ign {L}anguage",
    author = "Joshi, Abhinav and Agrawal, Susmit and Modi, Ashutosh",
    booktitle = "Findings of ACL 2023",
    year = "2023",
}
```
