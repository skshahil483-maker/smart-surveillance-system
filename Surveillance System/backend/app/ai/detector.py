import cv2
import numpy as np
import logging
import time

logger = logging.getLogger("surveillance.detector")

class YoloDetector:
    def __init__(self, model_name: str = "yolov8s.pt", conf_thresh: float = 0.50):
        self.conf_thresh = conf_thresh
        self.model = None
        self.use_ultralytics = False
        
        try:
            from ultralytics import YOLO
            logger.info(f"Loading Ultralytics YOLO model: {model_name}")
            self.model = YOLO(model_name)
            self.use_ultralytics = True
            logger.info("YOLOv8 initialized successfully.")
        except Exception as e:
            logger.warning(f"Could not load Ultralytics YOLOv8 ({e}). Falling back to Haar/HOG/OpenCV heuristic detector.")
            self.use_ultralytics = False
            self.hog = cv2.HOGDescriptor()
            self.hog.setSVMDetector(cv2.HOGDescriptor_getDefaultPeopleDetector())

    def detect(self, frame: np.ndarray, conf_thresh: float = None):
        """
        Detects persons in the frame.
        Returns list of dicts:
        [{ 'bbox': [x1, y1, x2, y2], 'confidence': float, 'class_id': 0, 'label': 'person' }]
        """
        threshold = conf_thresh if conf_thresh is not None else self.conf_thresh
        detections = []

        if frame is None or frame.size == 0:
            return detections

        h, w = frame.shape[:2]

        if self.use_ultralytics and self.model is not None:
            try:
                results = self.model(frame, verbose=False, conf=threshold)
                for r in results:
                    boxes = r.boxes
                    for box in boxes:
                        cls_id = int(box.cls[0].item())
                        conf = float(box.conf[0].item())
                        
                        # Class 0 in COCO is person
                        if cls_id == 0:
                            xyxy = box.xyxy[0].cpu().numpy().astype(int).tolist()
                            detections.append({
                                "bbox": xyxy,
                                "confidence": round(conf, 2),
                                "class_id": 0,
                                "label": "person"
                            })
                return detections
            except Exception as e:
                logger.error(f"Error during YOLO inference: {e}")

        # Fallback HOG People Detector if YOLO unavailable/failed
        try:
            boxes, weights = self.hog.detectMultiScale(frame, winStride=(8, 8), padding=(4, 4), scale=1.05)
            for i, (x, y, bw, bh) in enumerate(boxes):
                weight = float(weights[i]) if i < len(weights) else 0.70
                if weight >= 0.2:
                    detections.append({
                        "bbox": [int(x), int(y), int(x + bw), int(y + bh)],
                        "confidence": round(min(0.95, weight + 0.5), 2),
                        "class_id": 0,
                        "label": "person"
                    })
        except Exception as e:
            logger.error(f"Fallback detector error: {e}")

        return detections
