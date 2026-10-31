# SignBridge 🤟

> **Real-Time Two-Way Indian Sign Language Communication Platform**
>
> Breaking the communication barrier between ISL users and non-signers through real-time AI-powered communication.

---

## Dataset

This project uses the **ISLTranslate** dataset — a translation corpus for continuous Indian Sign Language, containing **31,222 ISL-English sentence pairs** across **2,575 unique videos**.

| Field | Value |
|---|---|
| Source | [Exploration-Lab/iSign](https://huggingface.co/datasets/Exploration-Lab/iSign) |
| Paper | [ISLTranslate: ACL 2023](https://aclanthology.org/2023.findings-acl.665) |
| License | CC-BY-NC 4.0 |
| Local CSV | `c:\ISL\ISLTranslate\data\ISLTranslate.csv` |

> **Important:** The ISLTranslate dataset provides *video-to-text translations*, not isolated-sign image classifications. The SignBridge MVP implements **isolated sign recognition using MediaPipe pose keypoints** extracted from live webcam, with the ISLTranslate vocabulary used to define the supported sign classes.

---

## Architecture

```
Frontend (React + Vite + TypeScript + Tailwind)
        ↕ HTTP / WebSocket
Backend (Python + FastAPI + uvicorn)
        ↕
MediaPipe Holistic → PoseClassifier (PyTorch)
        ↕
ISLTranslate class_mapping.json (100 supported classes)
```

---

## Project Structure

```
c:\ISL\signbridge\
├── frontend/           React + Vite TypeScript app
│   ├── src/
│   │   ├── components/ CameraPanel, SentenceBuilder, NonSignerPanel, etc.
│   │   ├── hooks/      useCamera, usePrediction, useSpeech
│   │   ├── services/   api.ts (HTTP + WebSocket client)
│   │   └── types/      TypeScript type definitions
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── main.py          FastAPI app + lifespan
│   │   ├── config.py        pydantic-settings config
│   │   ├── api/
│   │   │   ├── routes.py    REST endpoints
│   │   │   └── websocket.py WS /ws/predict
│   │   ├── services/
│   │   │   └── inference.py MediaPipe + PoseClassifier inference
│   │   └── schemas/         Pydantic request/response models
│   ├── pyproject.toml       ← replaces requirements.txt
│   └── .env.example
│
├── ml/
│   ├── dataset/analyzer.py  Dataset statistics & class mapping generator
│   ├── preprocessing/       Augmentation & splitting utilities
│   ├── training/train.py    Training pipeline
│   ├── evaluation/          Evaluation & confusion matrix
│   └── models/              Trained model checkpoints
│
├── data/
│   └── class_mapping.json   100 ISL sign classes from ISLTranslate
│
└── tests/
    ├── backend/test_api.py
    └── ml/test_pipeline.py
```

---

## Quick Start

### 1. Backend

```powershell
cd c:\ISL\signbridge\backend

# Create virtual environment
python -m venv .venv
.venv\Scripts\Activate.ps1

# Install dependencies (defined in pyproject.toml)
pip install -e ".[dev]"

# Copy env file
Copy-Item .env.example .env

# Start server
python -m app.main
```

The API is available at **http://localhost:8000**  
API docs at **http://localhost:8000/docs**

### 2. Frontend

```powershell
cd c:\ISL\signbridge\frontend
pnpm install
pnpm dev
```

Open **http://localhost:5173**

---

## API Reference

| Method | Path | Description |
|---|---|---|
| GET | `/api/health` | Health check |
| GET | `/api/model` | Model info + class count |
| POST | `/api/predict/base64` | Predict from base64 frame |
| POST | `/api/predict` | Predict from multipart upload |
| POST | `/api/conversation` | Echo conversation message |
| WS | `/ws/predict` | Real-time WebSocket inference |

---

## ML Pipeline

### Step 1 – Dataset Analysis

```powershell
cd c:\ISL\signbridge
.venv\Scripts\python ml\dataset\analyzer.py
```

### Step 2 – Extract Keypoints (requires videos)

When ISL videos are available locally, extract MediaPipe pose keypoints:

```powershell
# Each video → MediaPipe Holistic → .npy keypoint file
# See ml/inference/ for the extraction script
```

### Step 3 – Train

```powershell
.venv\Scripts\python -m ml.training.train `
  --data_dir ml/data/keypoints `
  --class_mapping data/class_mapping.json `
  --epochs 50 `
  --device cpu
```

### Step 4 – Evaluate

```powershell
.venv\Scripts\python ml/evaluation/evaluate.py `
  --model_path ml/models/signbridge_model.pt `
  --test_data_dir ml/data/keypoints/test `
  --class_mapping data/class_mapping.json
```

Outputs:
- `ml/evaluation/evaluation_report.json` — accuracy, F1, latency
- `ml/evaluation/confusion_matrix.png` — visual confusion matrix

---

## Configuration

All settings are in `backend/.env` (copy from `.env.example`):

| Variable | Default | Description |
|---|---|---|
| `MODEL_PATH` | `../ml/models/signbridge_model.pt` | Path to trained model |
| `CLASS_MAPPING_PATH` | `../data/class_mapping.json` | Class mapping |
| `CONFIDENCE_THRESHOLD` | `0.80` | Min confidence to accept prediction |
| `INFERENCE_FPS` | `8` | Frames per second sent for inference |
| `WINDOW_SIZE` | `5` | Temporal smoothing window |
| `MIN_OCCURRENCES` | `3` | Occurrences needed to confirm sign |

---

## Features

### ISL User → Non-Signer
- ✅ Live webcam capture
- ✅ MediaPipe Holistic pose extraction
- ✅ Real-time sign inference (REST + WebSocket)
- ✅ Confidence threshold gating (default 80%)
- ✅ Temporal smoothing (rolling window)
- ✅ Sentence buffer (add / undo / clear / confirm)
- ✅ Text-to-Speech (Web Speech API)
- ✅ Conversation history

### Non-Signer → ISL User
- ✅ Text input with send
- ✅ Voice input (Web Speech API STT)
- ✅ Response displayed in conversation

### System
- ✅ Demo Mode (pre-recorded simulation, clearly labeled)
- ✅ Live Mode toggle
- ✅ Backend availability indicator
- ✅ Dark accessible UI (Tailwind CSS)
- ✅ Responsive layout
- ✅ Error state handling (camera, backend, low confidence)

---

## Supported Vocabulary

The supported signs are derived from the 100 most frequent words in the ISLTranslate dataset.
See `data/class_mapping.json` for the complete list.

> **Limitation:** This MVP implements *isolated sign word recognition*, not continuous ISL sentence translation.
> The ISLTranslate dataset contains sentence-level video translations; a full continuous ISL translation system would require sequence models (e.g., Transformer over video frames) trained on the actual videos.

---

## Tests

```powershell
cd c:\ISL\signbridge\backend
.venv\Scripts\pip install pytest pytest-asyncio httpx
.venv\Scripts\pytest ..\tests\ -v
```

---

## Citation

```bibtex
@inproceedings{joshi-etal-2023-isltranslate,
    title = "{ISLT}ranslate: Dataset for Translating {I}ndian {S}ign {L}anguage",
    author = "Joshi, Abhinav and Agrawal, Susmit and Modi, Ashutosh",
    booktitle = "Findings of ACL 2023",
    year = "2023",
}
```

