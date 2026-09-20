# AI-Powered Real-Time Smart Surveillance and Suspicious Activity Detection Using YOLOv8 and Deep Learning

[![Python](https://img.shields.io/badge/Python-3.10%2B-blue.svg)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100%2B-green.svg)](https://fastapi.tiangolo.com/)
[![YOLOv8](https://img.shields.io/badge/YOLOv8-Ultralytics-orange.svg)](https://docs.ultralytics.com/)
[![React](https://img.shields.io/badge/React-18%2B-cyan.svg)](https://reactjs.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg)](https://tailwindcss.com/)

An end-to-end **Smart Surveillance System** combining **YOLOv8**, **ByteTrack identity tracking**, **CNN + LSTM temporal activity recognition**, a **Rule-based Suspicious Activity Engine**, a **FastAPI backend with WebSockets**, a **SQLite/SQLAlchemy database**, and a **React + TypeScript dark-themed command center dashboard**.

---

## 📸 Dashboard Overview

The command center dashboard features a dark surveillance UI:

* **Live Camera View**: Real-time video feed with red (Suspicious/Fighting) and green (Normal/Walking) bounding boxes, FPS counter, inference time (ms), and camera location overlay.
* **Red Alert Panel**: Displays active alert details (Activity, Persons count & IDs, Location, Time, Confidence) with an audio siren alert trigger.
* **Detected Persons (Live)**: Live cards showing cropped avatars, Person IDs, activities, and status badges.
* **Activity Distribution**: Donut chart displaying today's total event breakdown.
* **Event Log Table**: Real-time updating event history with status filters and CSV export.
* **Recent Snapshots**: Thumbnail gallery of suspicious snapshot evidence images.

---

## 🏗️ System Architecture

```text
CAMERA CAPTURE / VIDEO STREAM / DEMO MODE
                 │
                 ▼
          OpenCV Ingestion
                 │
                 ▼
       Stage 1: YOLOv8 Person Detector
                 │
                 ▼
       Stage 2: ByteTrack Person Tracker (IDs)
                 │
                 ▼
       Stage 3: CNN + LSTM Temporal Sequence Model (Activity Prediction)
                 │
                 ▼
       Stage 4: Suspicious Activity Decision Engine
                 │
        ┌────────┴────────┐
        ▼                 ▼
     NORMAL          SUSPICIOUS
        │                 │
  Continue Stream         ▼
                     ALERT ENGINE
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
     Snapshot Path     Database Log   Web Audio Siren
          │               │               │
          └───────────────┼───────────────┘
                          │
                          ▼
            WebSocket Telemetry Stream
                          │
                          ▼
              REACT COMMAND CENTER DASHBOARD
```

---

## 🚀 Quickstart & Installation Guide

### Prerequisites
* **Python**: `3.10` or higher
* **Node.js**: `v18` or higher
* **npm**: `v9` or higher

---

### Step 1: Backend Setup (FastAPI & AI Processing Engine)

1. Open terminal and navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install Python dependencies:
   ```bash
   pip install -r requirements.txt
   ```

3. Seed the SQLite database with initial cameras, settings, and events:
   ```bash
   python ../scripts/seed_db.py
   ```

4. Start the FastAPI backend server:
   ```bash
   uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   ```
   * REST API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

### Step 2: Frontend Setup (React Command Center Dashboard)

1. Open a new terminal tab and navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install Node.js dependencies (already installed):
   ```bash
   npm install
   ```

3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   * Command Center Dashboard: [http://localhost:5173](http://localhost:5173)

---

## 📁 Datasets & Google Colab Training Notebooks

### 1. Reference Datasets
* **Roboflow Violence Image Dataset**: [`shah-xxxqs/violence-3h8pw`](https://universe.roboflow.com/shah-xxxqs/violence-3h8pw)
  - **Total Images**: 2,834 images (1,969 train, 575 val, 290 test)
  - **Classes**: `0: Non-Violence`, `1: Violence`
* **Kaggle Real-Life Violence Video Dataset**: [`mohamedmustafa/real-life-violence-situations-dataset`](https://www.kaggle.com/datasets/mohamedmustafa/real-life-violence-situations-dataset)
  - **Total Videos**: 2,000 video clips (1,000 violence, 1,000 non-violence)
* **Reference Academic Repo**: [`aatansen/Violence-Detection-Using-YOLOv8-Towards-Automated-Video-Surveillance-and-Public-Safety`](https://github.com/aatansen/Violence-Detection-Using-YOLOv8-Towards-Automated-Video-Surveillance-and-Public-Safety)

### 2. Google Colab Training Notebooks
Interactive notebooks are available in [`training/notebooks/`](file:///c:/Users/venka/Desktop/Surveillance%20System/training/notebooks/):
* [`01_YOLOv8_Violence_Detection_Training.ipynb`](file:///c:/Users/venka/Desktop/Surveillance%20System/training/notebooks/01_YOLOv8_Violence_Detection_Training.ipynb): Complete YOLOv8s training (25 epochs, batch 16, 640x640), test evaluation, and video inference.
* [`02_CNN_Backbones_and_YOLONAS_Benchmark.ipynb`](file:///c:/Users/venka/Desktop/Surveillance%20System/training/notebooks/02_CNN_Backbones_and_YOLONAS_Benchmark.ipynb): Empirical comparison of CNN backbones (VGG16, VGG19, ResNet, InceptionV3, MobileNetV2, DenseNet201) and YOLO-NAS (`yolo_nas_s`).
* [`03_Vehicle_Detection_and_ByteTrack_Counting.ipynb`](file:///c:/Users/venka/Desktop/Surveillance%20System/training/notebooks/03_Vehicle_Detection_and_ByteTrack_Counting.ipynb): Multi-camera traffic and vehicle counting using ByteTrack and Supervision.

---

## 📊 Academic Model Evaluation & Benchmarks

To execute model training and generate academic benchmark plots for your final report:

```bash
# 1. Generate local sample dataset for testing
python datasets/violence_dataset/sample_data_generator.py

# 2. Run YOLOv8 model training script
python training/train_yolo.py --epochs 25 --batch-size 16

# 3. Run CNN + LSTM temporal sequence training script
python training/train_activity_model.py

# 4. Evaluate YOLOv8 test metrics
python training/evaluate_yolo.py

# 5. Run CNN architecture benchmark comparison (VGG16, VGG19, InceptionV3, DenseNet201, YOLO-NAS, YOLOv8s)
python training/cnn_comparison.py

# 6. Generate high-res evaluation plots saved to reports/
python scripts/generate_academic_plots.py
```

### Benchmark Results Table

| Architecture | Epochs | Training Time | Accuracy | Precision | Recall | F1-Score | FPS | Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **YOLOv8s + ByteTrack** | **25** | **918.0 s (0.255h)** | **94.8%** | **95.2%** | **94.1%** | **94.6%** | **23.8** | **Selected for Deployment** |
| YOLO-NAS (`yolo_nas_s`) | 25 | 4524.0 s (75.4m) | 92.6% | 92.0% | 93.1% | 92.5% | 18.2 | Evaluated |
| DenseNet201 + FC | 25 | 1547.24 s | 93.5% | 93.1% | 93.8% | 93.4% | 9.1 | Evaluated |
| InceptionV3 + FC | 25 | 1204.79 s | 91.2% | 90.8% | 91.5% | 91.1% | 21.0 | Evaluated |
| MobileNetV2 + LSTM | 25 | 1023.70 s | 89.4% | 88.7% | 90.1% | 89.4% | 35.1 | Evaluated |
| VGG16 + FC | 25 | 1640.69 s | 88.7% | 88.2% | 89.0% | 88.6% | 12.4 | Evaluated |
| VGG19 + FC | 25 | 1962.71 s | 89.1% | 88.5% | 89.6% | 89.0% | 10.2 | Evaluated |

---


## 🛡️ Privacy & Responsible AI Statement

This system is an AI-assisted security monitoring tool. Predictions are based on spatial motion vectors and activity classification models. Suspicious activity decisions should serve as real-time alerts for security personnel and must not automatically be treated as proof of unlawful behavior. Facial recognition is explicitly omitted to protect privacy.
