import time
import logging

logger = logging.getLogger("surveillance.suspicious")

class SuspiciousDetector:
    """
    Suspicious Activity Decision Engine.
    Evaluates activity predictions against confidence thresholds, loitering limits, and alert cooldown rules.
    """
    SUSPICIOUS_ACTIVITIES = ["Fighting", "Loitering", "Falling", "Trespassing"]

    def __init__(self, conf_threshold: float = 0.60, alert_cooldown: int = 10):
        self.conf_threshold = conf_threshold
        self.alert_cooldown = alert_cooldown
        self.last_alert_time = 0.0
        self.active_alert_event = None

    def evaluate(self, person_activities: dict, camera_id: str = "CAM-01", location: str = "Main Corridor"):
        """
        Input: person_activities: { '01': { 'activity': 'Fighting', 'confidence': 0.94, 'status': 'SUSPICIOUS' }, ... }
        Returns: tuple (is_suspicious: bool, alert_payload: dict or None)
        """
        current_time = time.time()

        suspicious_persons = []
        primary_activity = None
        max_confidence = 0.0

        for tid, info in person_activities.items():
            activity = info['activity']
            conf = info['confidence']
            status = info['status']

            # Only flag as suspicious if explicitly status == "SUSPICIOUS" and activity is suspicious
            if status == "SUSPICIOUS" and activity in self.SUSPICIOUS_ACTIVITIES:
                if conf >= self.conf_threshold:
                    suspicious_persons.append(tid)
                    if conf > max_confidence:
                        max_confidence = conf
                        primary_activity = activity

        if not suspicious_persons:
            return False, None

        # Format person IDs e.g. "01, 02"
        person_ids_str = ", ".join(sorted(suspicious_persons))
        
        # Check cooldown to prevent event spamming
        can_trigger_new_event = (current_time - self.last_alert_time) >= self.alert_cooldown

        time_str = time.strftime("%H:%M:%S")

        alert_payload = {
            "camera_id": camera_id,
            "activity": primary_activity or "Fighting",
            "status": "SUSPICIOUS",
            "confidence": round(max_confidence, 2),
            "person_ids": person_ids_str,
            "persons_count": len(suspicious_persons),
            "location": location,
            "timestamp": time_str,
            "is_new_event": can_trigger_new_event
        }

        if can_trigger_new_event:
            self.last_alert_time = current_time
            self.active_alert_event = alert_payload

        return True, alert_payload
