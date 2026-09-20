import os
import cv2
import numpy as np
import logging
from typing import List, Dict, Any

logger = logging.getLogger("surveillance.weapon_detector")

class WeaponDetector:
    """
    YOLOv8 Weapon & Knife Detector.
    Detects firearms ('guns') and knives ('knife') in video frames.
    """
    def __init__(self, model_path: str = None, conf_thresh: float = 0.50):
        self.conf_thresh = conf_thresh
        self.model = None
        self.is_loaded = False

        if model_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
            model_path = os.path.join(base_dir, "models", "weapon", "weapon_model.pt")

        self.model_path = model_path
        self._load_model()

    def _load_model(self):
        if not os.path.exists(self.model_path):
            logger.warning(f"Weapon model weights file not found at {self.model_path}")
            self.is_loaded = False
            return

        try:
            from ultralytics import YOLO
            logger.info(f"Loading YOLOv8 Weapon Detector from: {self.model_path}")
            self.model = YOLO(self.model_path)
            self.is_loaded = True
            logger.info(f"Weapon Detector initialized successfully with classes: {self.model.names}")
        except Exception as e:
            logger.error(f"Failed to load weapon detector model: {e}")
            self.is_loaded = False

    def detect(self, frame: np.ndarray, conf_thresh: float = None, enable_knives: bool = False) -> List[Dict[str, Any]]:
        """
        Runs inference on video frame.
        Returns list of detection dicts for firearms ('Gun'). Knife mode is disabled by default.
        """
        threshold = conf_thresh if conf_thresh is not None else self.conf_thresh
        detections = []

        if not self.is_loaded or self.model is None or frame is None or frame.size == 0:
            return detections

        try:
            results = self.model(frame, verbose=False, conf=threshold)
            for r in results:
                boxes = r.boxes
                for box in boxes:
                    cls_id = int(box.cls[0].item())
                    conf = float(box.conf[0].item())
                    xyxy = box.xyxy[0].cpu().numpy().astype(int).tolist()
                    
                    class_name = self.model.names.get(cls_id, "weapon")
                    # Normalize class names to standard labels: 'Gun' and 'Knife'
                    if "gun" in class_name.lower():
                        norm_class = "Gun"
                    elif "knife" in class_name.lower():
                        if not enable_knives:
                            continue # Knife mode removed as requested
                        norm_class = "Knife"
                    else:
                        norm_class = class_name.capitalize()

                    detections.append({
                        "class_name": norm_class,
                        "raw_class": class_name,
                        "confidence": round(conf, 2),
                        "bbox": xyxy
                    })
            return detections
        except Exception as e:
            logger.error(f"Error during weapon detection inference: {e}")
            return []
