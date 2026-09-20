import cv2
import numpy as np
import time
import os
import uuid
import math
import logging
import asyncio
from sqlalchemy.orm import Session

from app.ai.detector import YoloDetector
from app.ai.tracker import PersonTracker
from app.ai.activity_recognizer import ActivityRecognizer
from app.ai.suspicious_detector import SuspiciousDetector
from app.ai.weapon_detector import WeaponDetector
from app.models.models import Event, PersonTrack, SystemSetting, Camera
from app.database.session import SessionLocal

logger = logging.getLogger("surveillance.pipeline")

class SurveillancePipeline:
    def __init__(self, camera_id: str = "CAM-01"):
        self.camera_id = camera_id
        self.detector = YoloDetector(conf_thresh=0.50)
        self.tracker = PersonTracker(max_age=30)
        self.activity_recognizer = ActivityRecognizer()
        self.suspicious_engine = SuspiciousDetector(conf_threshold=0.60, alert_cooldown=10)
        self.weapon_detector = WeaponDetector(conf_thresh=0.60)
        
        self.weapon_history = [] # History buffer for temporal confirmation (last 6 frames)
        self.weapon_detection_enabled = True
        self.weapon_confidence_threshold = 0.78  # High threshold (78%) to eliminate background tube light false positives
        self.weapon_confirmation_frames = 4

        self.demo_mode = False
        self.video_source = "0"
        self.cap = None
        self.fps = 24.0
        self.last_frame_time = time.time()
        self.is_running = False

        # Directory for snapshot images and person crops
        self.base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
        self.snapshots_dir = os.path.join(self.base_dir, "storage", "snapshots")
        self.crops_dir = os.path.join(self.base_dir, "storage", "crops")
        os.makedirs(self.snapshots_dir, exist_ok=True)
        os.makedirs(self.crops_dir, exist_ok=True)

    def set_source(self, source: str, is_demo: bool = False):
        self.video_source = source
        self.demo_mode = is_demo
        if self.cap is not None:
            self.cap.release()
            self.cap = None

    def _init_capture(self):
        if self.cap is not None and self.cap.isOpened():
            return True

        if self.demo_mode or not self.video_source or self.video_source == "demo":
            return True # Handled in synthetic generator

        source_val = 0 if self.video_source == "0" else self.video_source
        self.cap = cv2.VideoCapture(source_val)
        
        if not self.cap.isOpened():
            logger.warning(f"Unable to open video source {self.video_source}. Falling back to Demo Mode.")
            self.demo_mode = True
            return True
        return True

    def process_frame(self, frame: np.ndarray, db: Session = None):
        """
        Processes a single video frame through all AI layers:
        Person Detection -> Person Tracking -> Activity Recognition -> Weapon Detection -> Weapon+Person Association -> Suspicious Engine.
        """
        start_time = time.time()

        if frame is None or frame.size == 0:
            return None, {}

        h, w = frame.shape[:2]

        # 1. Person Detection (YOLOv8)
        detections = self.detector.detect(frame)

        # 2. Identity Tracking (ByteTrack / SORT)
        tracked_persons = self.tracker.update(detections)

        # 3. Activity Recognition
        activities = self.activity_recognizer.predict_activities(tracked_persons, start_time)

        # 4. Weapon Detection & Person Association
        detected_weapons = []
        if self.weapon_detection_enabled and self.weapon_detector.is_loaded and tracked_persons:
            raw_weapon_dets = self.weapon_detector.detect(frame, conf_thresh=self.weapon_confidence_threshold)
            for w_det in raw_weapon_dets:
                w_bbox = w_det["bbox"]
                w_center = [(w_bbox[0]+w_bbox[2])/2.0, (w_bbox[1]+w_bbox[3])/2.0]

                # A weapon MUST be associated with a person's upper body / arm region (hands)
                best_person_id = None
                min_dist = float('inf')
                for person in tracked_persons:
                    p_bbox = person['bbox']
                    # Person upper body / torso region (top of head to waist + 30px margin)
                    px1, py1 = p_bbox[0] - 30, p_bbox[1] - 30
                    px2 = p_bbox[2] + 30
                    py2 = p_bbox[1] + (p_bbox[3] - p_bbox[1]) * 0.70 + 30  # upper 70% of body
                    
                    if px1 <= w_center[0] <= px2 and py1 <= w_center[1] <= py2:
                        p_center = [(p_bbox[0]+p_bbox[2])/2.0, (p_bbox[1]+p_bbox[3])/2.0]
                        dist = math.sqrt((w_center[0]-p_center[0])**2 + (w_center[1]-p_center[1])**2)
                        if dist < min_dist:
                            min_dist = dist
                            best_person_id = person['track_id']

                # Reject candidate weapons that are unassigned background artifacts (ceiling lights, wall molding)
                if best_person_id is not None:
                    w_det["associated_person_id"] = best_person_id
                    detected_weapons.append(w_det)

        # 5. Temporal Confirmation for Weapon Alert
        has_weapon_this_frame = len(detected_weapons) > 0
        self.weapon_history.append(has_weapon_this_frame)
        if len(self.weapon_history) > 6:
            self.weapon_history.pop(0)

        confirmed_weapon_count = sum(1 for h_flag in self.weapon_history if h_flag)
        is_weapon_confirmed = (confirmed_weapon_count >= self.weapon_confirmation_frames) and has_weapon_this_frame

        # 6. Save live person crops
        detected_persons_payload = []
        for p in tracked_persons:
            tid = p["track_id"]
            bbox = p["bbox"]
            x1, y1, x2, y2 = bbox
            x1, y1 = max(0, x1), max(0, y1)
            x2, y2 = min(w, x2), min(h, y2)

            crop_filename = f"crop_{tid}.jpg"
            if x2 > x1 and y2 > y1:
                crop_img = frame[y1:y2, x1:x2]
                if crop_img.size > 0:
                    crop_path = os.path.join(self.crops_dir, crop_filename)
                    cv2.imwrite(crop_path, crop_img)

            act_data = activities.get(tid, {})
            detected_persons_payload.append({
                "track_id": tid,
                "activity": act_data.get("activity", "Walking"),
                "status": act_data.get("status", "NORMAL"),
                "confidence": act_data.get("confidence", 0.90),
                "crop_url": f"/storage/crops/{crop_filename}"
            })

        # 7. Suspicious Engine & Alert Evaluation
        is_suspicious, alert_payload = self.suspicious_engine.evaluate(activities, self.camera_id)

        # Override alert payload if a weapon detection is confirmed
        if is_weapon_confirmed and detected_weapons:
            primary_weapon = detected_weapons[0]
            weapon_class = primary_weapon["class_name"] # "Knife" or "Gun"
            weapon_conf = primary_weapon["confidence"]
            assoc_pid = primary_weapon["associated_person_id"]

            can_trigger_new_event = (time.time() - self.suspicious_engine.last_alert_time) >= self.suspicious_engine.alert_cooldown
            time_str = time.strftime("%H:%M:%S")

            alert_payload = {
                "camera_id": self.camera_id,
                "event_type": "WEAPON_DETECTED",
                "activity": f"{weapon_class} Detected",
                "status": "SUSPICIOUS",
                "confidence": weapon_conf,
                "person_ids": f"{assoc_pid}" if assoc_pid else "Unassigned",
                "persons_count": 1 if assoc_pid else 0,
                "weapon_type": weapon_class,
                "weapon_confidence": weapon_conf,
                "location": "Main Corridor",
                "timestamp": time_str,
                "is_new_event": can_trigger_new_event
            }

            if can_trigger_new_event:
                self.suspicious_engine.last_alert_time = time.time()
                self.suspicious_engine.active_alert_event = alert_payload

            is_suspicious = True

        # 8. Annotate Frame with Bounding Boxes
        annotated_frame = self._annotate_frame(frame, tracked_persons, activities, detected_weapons, is_suspicious)

        # 9. Save Snapshot & Database Event if alert triggered
        snapshot_filename = None
        if is_suspicious and alert_payload and alert_payload.get("is_new_event"):
            snapshot_filename = self._save_snapshot_and_db_event(annotated_frame, alert_payload, db)
            if snapshot_filename:
                alert_payload["snapshot_path"] = f"/storage/snapshots/{snapshot_filename}"

        inference_ms = round((time.time() - start_time) * 1000.0, 1)

        # Build telemetry state
        telemetry = {
            "camera_id": self.camera_id,
            "persons_count": len(tracked_persons),
            "activity": alert_payload["activity"] if (is_suspicious and alert_payload) else self._get_overall_activity(activities),
            "status": "SUSPICIOUS" if is_suspicious else "NORMAL",
            "fps": round(self.fps, 1),
            "inference_ms": inference_ms,
            "timestamp": time.strftime("%H:%M:%S"),
            "active_alert": alert_payload if is_suspicious else None,
            "detected_persons": detected_persons_payload,
            "detected_weapons": detected_weapons
        }

        return annotated_frame, telemetry

    def _get_overall_activity(self, activities: dict) -> str:
        if not activities:
            return "Walking"
        act_list = [v["activity"] for v in activities.values()]
        if "Fighting" in act_list:
            return "Fighting"
        if "Falling" in act_list:
            return "Falling"
        if "Loitering" in act_list:
            return "Loitering"
        if "Running" in act_list:
            return "Running"
        return "Walking"

    def _annotate_frame(self, frame: np.ndarray, tracked_persons: list, activities: dict, detected_weapons: list, is_suspicious_global: bool):
        annotated = frame.copy()
        
        # Draw Person Bounding Boxes
        for person in tracked_persons:
            tid = person['track_id']
            x1, y1, x2, y2 = person['bbox']
            
            act_info = activities.get(tid, {'activity': 'Walking', 'status': 'NORMAL', 'confidence': 0.90})
            act_name = act_info['activity']
            status = act_info['status']

            is_suspicious = (status == "SUSPICIOUS" or act_name in ["Fighting", "Falling", "Loitering"])

            # Color scheme: Red (#EF4444) for Suspicious, Emerald Green (#10B981) for Normal
            box_color = (68, 68, 239) if is_suspicious else (129, 185, 16) # BGR
            bg_color = (68, 68, 239) if is_suspicious else (129, 185, 16)

            cv2.rectangle(annotated, (x1, y1), (x2, y2), box_color, 3)

            id_text = f"Person {tid}"
            (w_id, h_id), _ = cv2.getTextSize(id_text, cv2.FONT_HERSHEY_SIMPLEX, 0.6, 2)
            cv2.rectangle(annotated, (x1, max(0, y1 - 30)), (x1 + w_id + 12, max(0, y1)), bg_color, -1)
            cv2.putText(annotated, id_text, (x1 + 6, max(18, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

            status_text = f"{act_name} {status}"
            (w_st, h_st), _ = cv2.getTextSize(status_text, cv2.FONT_HERSHEY_SIMPLEX, 0.65, 2)
            
            label_y = y2 + 25 if y2 + 35 < annotated.shape[0] else y2 - 10
            cv2.rectangle(annotated, (x1, label_y - 22), (x1 + w_st + 16, label_y + 6), bg_color, -1)
            cv2.putText(annotated, status_text, (x1 + 8, label_y - 4), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2)

        # Draw Weapon Bounding Boxes (Bright Red / Orange)
        for w_det in detected_weapons:
            wx1, wy1, wx2, wy2 = w_det["bbox"]
            w_class = w_det["class_name"]
            w_conf = int(w_det["confidence"] * 100)
            assoc_pid = w_det.get("associated_person_id")

            w_color = (0, 0, 255) # Bright Red BGR
            cv2.rectangle(annotated, (wx1, wy1), (wx2, wy2), w_color, 4)

            w_label = f"ALERT: {w_class.upper()} {w_conf}%" + (f" (Person {assoc_pid})" if assoc_pid else "")
            (ww, wh), _ = cv2.getTextSize(w_label, cv2.FONT_HERSHEY_SIMPLEX, 0.7, 2)
            cv2.rectangle(annotated, (wx1, max(0, wy1 - 35)), (wx1 + ww + 16, max(0, wy1)), (0, 0, 255), -1)
            cv2.putText(annotated, w_label, (wx1 + 8, max(22, wy1 - 10)), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2)

        # Overlay System Header on Frame
        cv2.rectangle(annotated, (10, 10), (160, 42), (0, 0, 0), -1)
        cv2.circle(annotated, (25, 26), 6, (0, 0, 255) if is_suspicious_global else (0, 255, 0), -1)
        cv2.putText(annotated, "● LIVE", (38, 31), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2)

        cam_text = f"{self.camera_id} - Main Corridor"
        cv2.putText(annotated, cam_text, (15, annotated.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        time_text = time.strftime("%d-%m-%Y %H:%M:%S")
        cv2.putText(annotated, time_text, (annotated.shape[1] - 240, annotated.shape[0] - 15), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)

        return annotated

    def _save_snapshot_and_db_event(self, frame: np.ndarray, alert_payload: dict, db: Session = None):
        """
        Saves snapshot JPEG file to disk and logs Event record to SQLite database.
        """
        evt_uuid = f"EVT-{uuid.uuid4().hex[:6].upper()}"
        alert_payload["event_id"] = evt_uuid

        filename = f"{evt_uuid}.jpg"
        filepath = os.path.join(self.snapshots_dir, filename)

        # Annotate snapshot frame
        annotated_snapshot = frame.copy()
        alert_title = alert_payload.get("activity", "ALERT")
        cv2.putText(annotated_snapshot, f"ALERT: {alert_title}", (20, 50), cv2.FONT_HERSHEY_SIMPLEX, 1.0, (0, 0, 255), 3)
        cv2.putText(annotated_snapshot, f"TIME: {alert_payload['timestamp']}", (20, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.imwrite(filepath, annotated_snapshot)

        # Save to database
        close_db = False
        if db is None:
            db = SessionLocal()
            close_db = True

        try:
            db_event = Event(
                event_id=evt_uuid,
                camera_id=alert_payload["camera_id"],
                event_type=alert_payload.get("event_type", "SUSPICIOUS_ACTIVITY"),
                activity=alert_payload["activity"],
                status="SUSPICIOUS",
                confidence=alert_payload["confidence"],
                person_ids=alert_payload["person_ids"],
                weapon_type=alert_payload.get("weapon_type"),
                weapon_confidence=alert_payload.get("weapon_confidence"),
                location=alert_payload["location"],
                timestamp=alert_payload["timestamp"],
                snapshot_path=f"/storage/snapshots/{filename}"
            )
            db.add(db_event)
            db.commit()
            logger.info(f"Logged event {evt_uuid} ({alert_payload['activity']}) to database.")
        except Exception as e:
            logger.error(f"Error saving event to database: {e}")
            if db:
                db.rollback()
        finally:
            if close_db:
                db.close()

        return filename

    def _get_mock_crop_avatar(self, track_id: str, activity: str) -> str:
        return f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80"

    def generate_synthetic_frame(self):
        """
        Generates realistic synthetic video frames showing normal corridor activity (walking/standing)
        for clean, smooth Demo Mode operation without fake alert spamming.
        """
        img = np.zeros((720, 1280, 3), dtype=np.uint8)
        
        # Corridor background design
        cv2.rectangle(img, (0, 0), (1280, 720), (30, 35, 45), -1)
        cv2.line(img, (0, 500), (1280, 500), (60, 65, 75), 3)
        cv2.line(img, (400, 500), (200, 720), (50, 55, 65), 2)
        cv2.line(img, (880, 500), (1080, 720), (50, 55, 65), 2)
        
        # Title header
        cv2.putText(img, "SMART SURVEILLANCE CORRIDOR (DEMO MODE)", (40, 60), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (180, 190, 200), 2)

        t = time.time()

        # Person 01 (Smooth walking along left side of corridor - NORMAL)
        p1_x = int(300 + math.sin(t * 0.8) * 80)
        cv2.rectangle(img, (p1_x, 220), (p1_x + 110, 550), (45, 55, 65), -1)
        cv2.circle(img, (p1_x + 55, 260), 28, (180, 150, 130), -1) # Head
        cv2.line(img, (p1_x + 55, 288), (p1_x + 55, 430), (30, 30, 30), 10) # Torso

        # Person 02 (Smooth walking along right side of corridor - NORMAL)
        p2_x = int(820 - math.sin(t * 0.8) * 80)
        cv2.rectangle(img, (p2_x, 230), (p2_x + 110, 560), (55, 65, 75), -1)
        cv2.circle(img, (p2_x + 55, 270), 28, (170, 140, 120), -1)
        cv2.line(img, (p2_x + 55, 298), (p2_x + 55, 440), (40, 40, 40), 10)

        # Person 03 (Background standing/sitting quietly - NORMAL)
        p3_x = 180
        cv2.rectangle(img, (p3_x, 280), (p3_x + 90, 520), (40, 50, 60), -1)
        cv2.circle(img, (p3_x + 45, 310), 22, (180, 150, 130), -1)

        return img
