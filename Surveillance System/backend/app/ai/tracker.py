import numpy as np
import time

def calculate_iou(box1, box2):
    """
    Computes Intersection over Union (IoU) between box1 and box2: [x1, y1, x2, y2]
    """
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])

    inter_area = max(0, x2 - x1) * max(0, y2 - y1)
    box1_area = (box1[2] - box1[0]) * (box1[3] - box1[1])
    box2_area = (box2[2] - box2[0]) * (box2[3] - box2[1])

    union_area = box1_area + box2_area - inter_area
    if union_area == 0:
        return 0.0
    return inter_area / float(union_area)

class PersonTracker:
    """
    Lightweight identity tracker (ByteTrack/SORT compatible IO-based tracker).
    Maintains persistent track IDs ('01', '02', '03') for detected persons across frames.
    """
    def __init__(self, max_age: int = 30, iou_threshold: float = 0.30):
        self.max_age = max_age
        self.iou_threshold = iou_threshold
        self.next_id = 1
        self.tracks = {} # track_id -> { 'bbox': [], 'last_seen': float, 'history': [] }

    def update(self, detections):
        """
        Input: list of detections [{'bbox': [x1, y1, x2, y2], 'confidence': conf, ...}]
        Output: list of tracked persons [{'track_id': '01', 'bbox': [...], 'confidence': conf}]
        """
        current_time = time.time()
        updated_tracks = []

        # Purge old tracks
        dead_tracks = [tid for tid, tinfo in self.tracks.items() if current_time - tinfo['last_seen'] > self.max_age]
        for tid in dead_tracks:
            del self.tracks[tid]

        if not detections:
            return []

        matched_det_indices = set()
        matched_track_ids = set()

        # Match existing tracks to new detections via max IoU
        for track_id, tinfo in list(self.tracks.items()):
            last_box = tinfo['bbox']
            best_iou = 0.0
            best_det_idx = -1

            for idx, det in enumerate(detections):
                if idx in matched_det_indices:
                    continue
                iou = calculate_iou(last_box, det['bbox'])
                if iou > best_iou:
                    best_iou = iou
                    best_det_idx = idx

            if best_iou >= self.iou_threshold and best_det_idx != -1:
                matched_det_indices.add(best_det_idx)
                matched_track_ids.add(track_id)
                det = detections[best_det_idx]
                
                # Update track
                self.tracks[track_id]['bbox'] = det['bbox']
                self.tracks[track_id]['confidence'] = det['confidence']
                self.tracks[track_id]['last_seen'] = current_time
                self.tracks[track_id]['history'].append(det['bbox'])
                if len(self.tracks[track_id]['history']) > 30:
                    self.tracks[track_id]['history'].pop(0)

                updated_tracks.append({
                    "track_id": f"{int(track_id):02d}",
                    "bbox": det['bbox'],
                    "confidence": det['confidence']
                })

        # Unmatched detections get new IDs
        for idx, det in enumerate(detections):
            if idx not in matched_det_indices:
                new_track_id = self.next_id
                self.next_id += 1
                self.tracks[new_track_id] = {
                    "bbox": det['bbox'],
                    "confidence": det['confidence'],
                    "last_seen": current_time,
                    "first_seen": current_time,
                    "history": [det['bbox']]
                }
                updated_tracks.append({
                    "track_id": f"{new_track_id:02d}",
                    "bbox": det['bbox'],
                    "confidence": det['confidence']
                })

        return updated_tracks
