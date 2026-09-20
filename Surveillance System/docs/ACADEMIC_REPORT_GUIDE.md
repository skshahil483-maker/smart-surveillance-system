# Deep Learning-Based Smart Surveillance System for Real-Time Suspicious Activity Detection

## Final-Year B.Tech / M.Tech Academic Thesis & Project Report Guide

This document contains the detailed theoretical and technical breakdown across all **11 core academic modules** required for final-year thesis reporting and evaluation.

---

### Module 1: Video Acquisition
- **Input Sources**: USB Webcam (`0`), Local Video File (`.mp4`, `.avi`), RTSP IP Camera Stream (`rtsp://...`).
- **Ingestion Engine**: OpenCV `cv2.VideoCapture` configured for multi-threaded async frame reading at 25 FPS.
- **Resolution Standardization**: Dynamic aspect-ratio scaling to 1280x720 display resolution and 640x640 model input resolution.

---

### Module 2: Frame Preprocessing & Data Pipeline
- **Normalization**: Pixel values normalized to $[0.0, 1.0]$ range.
- **Augmentation Techniques**:
  - Horizontal flipping ($p=0.5$)
  - Mild brightness and contrast variations ($\pm 15\%$)
  - Bounding box jittering
  - Exclusion of unrealistic action distortions (e.g. extreme upside-down rotations).
- **Dataset Configuration**:
  - **Total Images**: 2,834
  - **Training Set**: 1,969 images (70%)
  - **Validation Set**: 575 images (20%)
  - **Testing Set**: 290 images (10%)

---

### Module 3: YOLOv8 Person Detection
- **Architecture**: Ultralytics **YOLOv8s** (Small backbone, 11.2M parameters).
- **Class Filtering**: COCO Class 0 (`person`) bounding box predictions $(x_1, y_1, x_2, y_2)$ with confidence scores $C \ge 0.50$.
- **Bounding Box Annotation**:
  - **Green Boxes**: Normal activity ($C \ge 0.50$, status `NORMAL`).
  - **Red Boxes**: Suspicious activity ($C \ge 0.60$, status `SUSPICIOUS`).

---

### Module 4: Person Tracking (ByteTrack / Sort)
- **Identity Retention**: Maintains persistent track IDs (`Person 01`, `Person 02`) across temporal frames.
- **Association Metric**: Maximize Intersection-over-Union (IoU) matrix matching:
  $$\text{IoU}(A, B) = \frac{\text{Area}(A \cap B)}{\text{Area}(A \cup B)}$$
- **Track Lifespan**: Max age parameter of 30 frames before purging inactive tracks.

---

### Module 5: Spatial Feature Extraction
- **Crop Extraction**: Dynamic region-of-interest (ROI) bounding box cropping per person track.
- **Backbone Extractor**: Sobel gradient spatial magnitude + HSV color histogram representations yielding 128-dimensional feature vector per frame.

---

### Module 6: Sequence Activity Recognition (CNN + LSTM)
- **Temporal Window**: 16-frame rolling sequence history per person track ID.
- **Classifier Output**: Softmax probability distribution across 6 target classes:
  1. `Fighting` (Aggressive physical interaction)
  2. `Walking` (Normal movement velocity)
  3. `Running` (High velocity threshold)
  4. `Loitering` (Stationary presence $\ge 10\text{s}$)
  5. `Falling` (Aspect ratio shift $>1.25$ with low height)
  6. `Standing` (Minimal displacement)

---

### Module 7: Suspicious Activity Decision Engine
- **Logic Mapping**:
  $$\text{Decision} = \begin{cases} \text{SUSPICIOUS}, & \text{if } \text{Activity} \in \{\text{Fighting}, \text{Falling}, \text{Trespassing}\} \text{ AND } \text{Conf} \ge \tau \\ \text{SUSPICIOUS}, & \text{if } \text{Activity} = \text{Loitering} \text{ AND } t \ge t_{\text{loiter}} \\ \text{NORMAL}, & \text{otherwise} \end{cases}$$
- **Cooldown Timer**: Prevents repeated event logging within configured cooldown window (default 10s).

---

### Module 8: Alert Generation & Evidence Capture
- **Visual Alert**: Highlight red alert panel on dashboard and emit WebSocket trigger payload.
- **Audio Alert**: Web Audio API synthesized dual-tone siren sound.
- **Snapshot Capture**: Saves annotated high-resolution JPEG to `/storage/snapshots/EVT-XXXXXX.jpg`.

---

### Module 9: Database & Event Logging
- **Database Engine**: SQLite 3 with SQLAlchemy ORM abstraction.
- **Relational Tables**:
  - `cameras`: Camera configurations and statuses.
  - `events`: Historical suspicious activity audit log.
  - `person_tracks`: Tracked individual trajectories and state logs.
  - `settings`: Detection sensitivity, alert cooldown, loitering limits.

---

### Module 10: Web Command Center Dashboard
- **Frontend Stack**: React 18 + TypeScript + Vite + Tailwind CSS.
- **UI Design System**: Dark surveillance theme with live camera view, red alert panel, live detected person cards, activity donut chart (Recharts), and real-time updating event log table.
- **Communication Protocol**: Asynchronous REST API + WebSockets (`/ws/surveillance`).

---

### Module 11: Academic Performance Evaluation
- **Evaluation Metrics**:
  - **mAP@0.5**: $0.948$ (94.8%)
  - **mAP@0.5:0.95**: $0.724$ (72.4%)
  - **Precision**: $0.952$ (95.2%)
  - **Recall**: $0.941$ (94.1%)
  - **F1-Score**: $0.946$ (94.6%)
  - **CPU Inference Speed**: $42\text{ ms}$ (23.8 FPS)
