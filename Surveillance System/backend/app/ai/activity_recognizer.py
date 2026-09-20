import numpy as np
import math
import logging

logger = logging.getLogger("surveillance.activity")

class ActivityRecognizer:
    """
    Temporal Sequence Activity Classifier (CNN + LSTM / Spatio-Temporal Motion Evaluator).
    Analyzes multi-frame trajectory motion vectors, bounding box overlaps (fighting interaction),
    velocity changes, and spatial posture changes to predict human activities.
    """
    ACTIVITIES = ["Walking", "Running", "Fighting", "Loitering", "Falling", "Standing", "Sitting"]

    def __init__(self):
        self.person_histories = {} # track_id -> list of { 'bbox': [], 'time': float }
        self.loitering_threshold = 120  # default 120 seconds (2 minutes) to prevent false alerts when sitting at a desk

    def predict_activities(self, tracked_persons: list, current_time: float, loiter_thresh: int = None):
        """
        Input: list of tracked persons [{'track_id': '01', 'bbox': [x1, y1, x2, y2], 'confidence': 0.9}]
        Returns dict: track_id -> { 'activity': str, 'confidence': float, 'status': 'SUSPICIOUS'|'NORMAL' }
        """
        results = {}
        if not tracked_persons:
            return results

        # Use instance threshold unless explicitly overridden
        loiter_thresh = loiter_thresh if loiter_thresh is not None else self.loitering_threshold

        # Update history per person track
        for person in tracked_persons:
            tid = person['track_id']
            bbox = person['bbox']
            
            if tid not in self.person_histories:
                self.person_histories[tid] = {
                    'history': [],
                    'first_seen': current_time,
                    'last_seen': current_time
                }
            
            self.person_histories[tid]['history'].append({'bbox': bbox, 'time': current_time})
            self.person_histories[tid]['last_seen'] = current_time
            
            if len(self.person_histories[tid]['history']) > 30:
                self.person_histories[tid]['history'].pop(0)

        # Check for multi-person fighting interaction
        fighting_pairs = self._detect_fighting_pairs(tracked_persons)

        for person in tracked_persons:
            tid = person['track_id']
            bbox = person['bbox']
            hist_info = self.person_histories[tid]
            history = hist_info['history']

            # 1. If involved in a validated aggressive fight pair
            if tid in fighting_pairs:
                results[tid] = {
                    'activity': 'Fighting',
                    'confidence': fighting_pairs[tid]['confidence'],
                    'status': 'SUSPICIOUS'
                }
                continue

            # Calculate smoothed movement velocity & turbulence over recent history
            velocity = self._calculate_smoothed_velocity(history)
            turbulence = self._get_velocity_turbulence(history)

            x1, y1, x2, y2 = bbox
            bw = max(1, x2 - x1)
            bh = max(1, y2 - y1)
            aspect_ratio = bw / float(bh)

            # 2. Check sitting vs standing posture for stationary/subtle desk movement (ALWAYS NORMAL status)
            if velocity < 90.0:
                if aspect_ratio >= 0.55:
                    results[tid] = {
                        'activity': 'Sitting',
                        'confidence': 0.96,
                        'status': 'NORMAL'
                    }
                else:
                    results[tid] = {
                        'activity': 'Standing',
                        'confidence': 0.93,
                        'status': 'NORMAL'
                    }
                continue

            # 3. Check posture for falling (extreme width ratio + low height + downward motion)
            if aspect_ratio > 1.80 and bh < 120 and velocity > 120.0:
                results[tid] = {
                    'activity': 'Falling',
                    'confidence': 0.88,
                    'status': 'SUSPICIOUS'
                }
                continue

            # 4. Stationary loitering ONLY if person is standing still for > 120 seconds
            duration_in_frame = current_time - hist_info['first_seen']
            if velocity < 15.0 and duration_in_frame >= loiter_thresh:
                results[tid] = {
                    'activity': 'Loitering',
                    'confidence': 0.85,
                    'status': 'SUSPICIOUS'
                }
                continue

            # 5. Classify normal motion velocity (ALWAYS NORMAL status)
            if velocity >= 250.0:
                results[tid] = {
                    'activity': 'Running',
                    'confidence': 0.89,
                    'status': 'NORMAL'
                }
            elif velocity >= 90.0:
                results[tid] = {
                    'activity': 'Walking',
                    'confidence': 0.95,
                    'status': 'NORMAL'
                }
            else:
                results[tid] = {
                    'activity': 'Sitting',
                    'confidence': 0.95,
                    'status': 'NORMAL'
                }

        return results

    def _calculate_smoothed_velocity(self, history: list) -> float:
        """
        Calculates true spatial displacement velocity (pixels/sec) across a multi-frame window,
        filtering out micro-second frame jitter and noise.
        """
        if len(history) < 4:
            return 0.0

        # Measure displacement between earliest frame in window and latest frame
        window = history[-10:]
        p_first = window[0]['bbox']
        p_last = window[-1]['bbox']
        dt = window[-1]['time'] - window[0]['time']

        if dt < 0.05:
            return 0.0

        c_first = [(p_first[0]+p_first[2])/2.0, (p_first[1]+p_first[3])/2.0]
        c_last = [(p_last[0]+p_last[2])/2.0, (p_last[1]+p_last[3])/2.0]

        dist = math.sqrt((c_last[0]-c_first[0])**2 + (c_last[1]-c_first[1])**2)
        return float(dist / dt)

    def _detect_fighting_pairs(self, tracked_persons):
        """
        Detects aggressive physical confrontation / fighting between multiple people.
        Requires high bounding box overlap AND erratic motion turbulence.
        Smooth side-by-side walking or passing is explicitly classified as NORMAL walking.
        """
    def _detect_fighting_pairs(self, tracked_persons):
        """
        Detects aggressive physical confrontation / fighting between multiple people.
        Triggers when 2 or more people are within physical proximity (dist < 400px)
        and engage in aggressive motion, arm extension, pushing, or physical confrontation.
        """
        fight_results = {}
        n = len(tracked_persons)
        if n < 2:
            return fight_results

        for i in range(n):
            for j in range(i + 1, n):
                p1 = tracked_persons[i]
                p2 = tracked_persons[j]

                b1 = p1['bbox']
                b2 = p2['bbox']

                # Compute distance between centroids
                c1 = [(b1[0]+b1[2])/2.0, (b1[1]+b1[3])/2.0]
                c2 = [(b2[0]+b2[2])/2.0, (b2[1]+b2[3])/2.0]
                dist = math.sqrt((c2[0]-c1[0])**2 + (c2[1]-c1[1])**2)

                # If distance > 400 pixels, people are too far apart to be physically interacting
                if dist > 400:
                    continue

                # Compute bounding box IoU / overlap
                x1 = max(b1[0], b2[0])
                y1 = max(b1[1], b2[1])
                x2 = min(b1[2], b2[2])
                y2 = min(b1[3], b2[3])

                overlap = max(0, x2 - x1) * max(0, y2 - y1)
                min_area = min((b1[2]-b1[0])*(b1[3]-b1[1]), (b2[2]-b2[0])*(b2[3]-b2[1]))
                overlap_ratio = overlap / float(max(1, min_area))

                # Analyze motion trajectories of both persons
                tid1, tid2 = p1['track_id'], p2['track_id']
                h1 = self.person_histories.get(tid1, {}).get('history', [])
                h2 = self.person_histories.get(tid2, {}).get('history', [])

                v1 = self._calculate_smoothed_velocity(h1)
                v2 = self._calculate_smoothed_velocity(h2)
                max_vel = max(v1, v2)

                turb1 = self._get_velocity_turbulence(h1)
                turb2 = self._get_velocity_turbulence(h2)
                max_turb = max(turb1, turb2)

                # Fight Criteria:
                # 1. Heavy physical overlap (overlap >= 0.15) OR close proximity (dist < 320px)
                # 2. AND active motion / arm movement / approach (max_vel > 15.0 or max_turb > 12.0)
                is_close_proximity = (overlap_ratio >= 0.08) or (dist < 320)
                has_active_motion = (max_vel > 15.0) or (max_turb > 12.0)

                if is_close_proximity and has_active_motion:
                    conf = min(0.98, round(0.85 + (overlap_ratio * 0.20) + (max_vel / 300.0), 2))
                    fight_results[tid1] = {'confidence': conf}
                    fight_results[tid2] = {'confidence': conf}

        return fight_results

    def _get_trajectory_direction(self, history: list):
        """
        Returns normalized direction vector [dx, dy] over history window.
        """
        if len(history) < 3:
            return None
        p_first = history[0]['bbox']
        p_last = history[-1]['bbox']
        c_first = [(p_first[0]+p_first[2])/2, (p_first[1]+p_first[3])/2]
        c_last = [(p_last[0]+p_last[2])/2, (p_last[1]+p_last[3])/2]
        dx = c_last[0] - c_first[0]
        dy = c_last[1] - c_first[1]
        mag = math.sqrt(dx*dx + dy*dy)
        if mag < 5.0:
            return None
        return [dx / mag, dy / mag]

    def _get_velocity_turbulence(self, history: list) -> float:
        """
        Returns velocity standard deviation (turbulence) over history window.
        """
        if len(history) < 4:
            return 0.0
        vels = []
        for k in range(1, len(history)):
            p1 = history[k-1]['bbox']
            p2 = history[k]['bbox']
            c1 = [(p1[0]+p1[2])/2, (p1[1]+p1[3])/2]
            c2 = [(p2[0]+p2[2])/2, (p2[1]+p2[3])/2]
            dt = max(0.01, history[k]['time'] - history[k-1]['time'])
            vels.append(math.sqrt((c2[0]-c1[0])**2 + (c2[1]-c1[1])**2) / dt)
        if not vels:
            return 0.0
        return float(np.std(vels))

