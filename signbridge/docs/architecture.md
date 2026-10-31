# SignBridge Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                         BROWSER (React)                             │
│                                                                     │
│  ┌─────────────────┐   ┌──────────────────┐   ┌─────────────────┐  │
│  │   CameraPanel   │   │  SentenceBuilder │   │ NonSignerPanel  │  │
│  │   useCamera()   │   │  usePrediction() │   │  useSTT()       │  │
│  └────────┬────────┘   └────────┬─────────┘   └────────┬────────┘  │
│           │ base64 frames        │                      │ text/voice │
│           └──────────────────────┘                      │           │
│                       api.ts ← services                 │           │
│                          │                              │           │
│                     Web Speech API ←──────────── useTTS() ─────────┘
└──────────────────────────┬──────────────────────────────────────────┘
                           │ HTTP POST /api/predict/base64
                           │ WebSocket /ws/predict
                           ↓
┌──────────────────────────────────────────────────────────────────────┐
│                      FastAPI Backend                                 │
│                                                                      │
│   main.py → lifespan → InferenceService(singleton)                  │
│                                                                      │
│   GET  /api/health          ← health check                          │
│   GET  /api/model           ← model info                            │
│   POST /api/predict/base64  ← base64 frame inference                │
│   POST /api/predict         ← multipart frame inference             │
│   POST /api/conversation    ← message echo                          │
│   WS   /ws/predict          ← real-time streaming inference         │
│                                                                      │
└──────────────────────────┬───────────────────────────────────────────┘
                           │
              ┌────────────┴────────────┐
              ↓                         ↓
   ┌──────────────────┐      ┌──────────────────────┐
   │  MediaPipe       │      │  PoseClassifier       │
   │  Holistic        │      │  (PyTorch FC Network) │
   │                  │      │                       │
   │  Left Hand kp    │      │  Input: 258-dim vec   │
   │  Right Hand kp ──┼─────►│  Hidden: 512→256→128  │
   │  Pose kp         │      │  Output: num_classes  │
   └──────────────────┘      └──────────────────────┘
                                        │
                              ┌─────────┴──────────┐
                              ↓                    ↓
                    ┌─────────────────┐   ┌─────────────────┐
                    │  class_mapping  │   │  Temporal        │
                    │  .json          │   │  Smoothing       │
                    │  (100 classes)  │   │  (window=5)      │
                    └─────────────────┘   └─────────────────┘
```

## Keypoint Feature Vector

MediaPipe Holistic extracts:

| Source | Landmarks | Dimensions | Total |
|---|---|---|---|
| Left hand | 21 | × 3 (x, y, z) | 63 |
| Right hand | 21 | × 3 (x, y, z) | 63 |
| Pose | 33 | × 4 (x, y, z, visibility) | 132 |
| **Total** | | | **258** |

## Confidence Pipeline

```
Frame → MediaPipe → 258-dim keypoints → PoseClassifier
                                              ↓
                                     Softmax probabilities
                                              ↓
                                   Confidence >= 0.80?
                                    /              \
                                  Yes               No
                                   ↓                ↓
                          Temporal window       "Low confidence"
                         (5 frames, 3 agree?)    message
                                   ↓
                          Emit final prediction
```

## Dataset Strategy

The **ISLTranslate dataset** provides sentence-level video translations.
For the MVP, the vocabulary (100 most frequent words) is extracted from
the CSV and used as the target classes for the pose-keypoint classifier.

Future work: Use the actual video files with a sequence model for
continuous ISL sentence translation.

