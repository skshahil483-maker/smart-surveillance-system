import sys
import os
import time
import math

# Add backend directory to sys.path
sys.path.insert(0, os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "backend"))

from app.ai.activity_recognizer import ActivityRecognizer
from app.ai.suspicious_detector import SuspiciousDetector

def run_tests():
    print("=" * 60)
    print("RUNNING ACTIVITY RECOGNITION & SUSPICIOUS DETECTOR VERIFICATION")
    print("=" * 60)

    recognizer = ActivityRecognizer()
    detector = SuspiciousDetector(conf_threshold=0.60)

    # -------------------------------------------------------------
    # TEST 1: Single Person Normal Walking
    # -------------------------------------------------------------
    print("\n[TEST 1] Single Person Normal Walking Trajectory...")
    t0 = time.time()
    for frame in range(10):
        t = t0 + frame * 0.04
        # Person moves horizontally from x=100 smoothly (~125px/s)
        x1 = int(100 + frame * 5)
        p = [{'track_id': '01', 'bbox': [x1, 100, x1 + 80, 300], 'confidence': 0.95}]
        res = recognizer.predict_activities(p, t)

    p1_res = res.get('01', {})
    print(f"Result for Single Walking Person '01': {p1_res}")
    assert p1_res.get('activity') == 'Walking', f"Expected Walking, got {p1_res.get('activity')}"
    assert p1_res.get('status') == 'NORMAL', f"Expected NORMAL status, got {p1_res.get('status')}"
    
    is_susp, alert = detector.evaluate(res)
    assert not is_susp, f"Expected is_suspicious=False for single walking, got {is_susp}"
    print("[PASS] Test 1 Passed: Single person walking is correctly classified as Walking (NORMAL).")

    # -------------------------------------------------------------
    # TEST 2: Two Normal People Walking Side-by-Side (Overlapping Boxes, Smooth Parallel Motion)
    # -------------------------------------------------------------
    print("\n[TEST 2] Two Normal People Walking Together (Overlapping Boxes)...")
    recognizer2 = ActivityRecognizer()
    t0 = time.time()
    for frame in range(10):
        t = t0 + frame * 0.04
        x_base = int(200 + frame * 6)
        # Person 01 and Person 02 walk together side-by-side with 25% IoU overlap!
        p = [
            {'track_id': '01', 'bbox': [x_base, 100, x_base + 90, 320], 'confidence': 0.94},
            {'track_id': '02', 'bbox': [x_base + 40, 105, x_base + 130, 325], 'confidence': 0.92}
        ]
        res2 = recognizer2.predict_activities(p, t)

    p1_act = res2.get('01', {}).get('activity')
    p2_act = res2.get('02', {}).get('activity')
    p1_stat = res2.get('01', {}).get('status')
    p2_stat = res2.get('02', {}).get('status')
    print(f"Result for Walking Pair: Person 01={p1_act} ({p1_stat}), Person 02={p2_act} ({p2_stat})")

    assert p1_act == 'Walking' and p2_act == 'Walking', f"Expected Walking for both, got {p1_act}, {p2_act}"
    assert p1_stat == 'NORMAL' and p2_stat == 'NORMAL', f"Expected NORMAL for both, got {p1_stat}, {p2_stat}"
    
    is_susp2, alert2 = detector.evaluate(res2)
    assert not is_susp2, f"Expected is_suspicious=False for walking pair, got {is_susp2}"
    print("[PASS] Test 2 Passed: Two people walking together are correctly classified as Walking (NORMAL).")

    # -------------------------------------------------------------
    # TEST 3: Aggressive Physical Fight (Heavy Overlap + High Motion Turbulence)
    # -------------------------------------------------------------
    print("\n[TEST 3] Aggressive Physical Fight (High Overlap & Motion Turbulence)...")
    recognizer3 = ActivityRecognizer()
    t0 = time.time()
    for frame in range(12):
        t = t0 + frame * 0.04
        # Erratic high-frequency motion jitter for fighting
        j1 = int(math.sin(frame * 3.0) * 25)
        j2 = int(math.cos(frame * 3.5) * 25)
        p = [
            {'track_id': '01', 'bbox': [400 + j1, 150, 520 + j1, 380], 'confidence': 0.95},
            {'track_id': '02', 'bbox': [430 + j2, 160, 550 + j2, 390], 'confidence': 0.93}
        ]
        res3 = recognizer3.predict_activities(p, t)

    p1_act = res3.get('01', {}).get('activity')
    p2_act = res3.get('02', {}).get('activity')
    p1_stat = res3.get('01', {}).get('status')
    p2_stat = res3.get('02', {}).get('status')
    print(f"Result for Fighting Pair: Person 01={p1_act} ({p1_stat}), Person 02={p2_act} ({p2_stat})")

    assert p1_act == 'Fighting' and p2_act == 'Fighting', f"Expected Fighting for both, got {p1_act}, {p2_act}"
    assert p1_stat == 'SUSPICIOUS' and p2_stat == 'SUSPICIOUS', f"Expected SUSPICIOUS for both, got {p1_stat}, {p2_stat}"

    is_susp3, alert3 = detector.evaluate(res3)
    assert is_susp3, f"Expected is_suspicious=True for fighting pair, got {is_susp3}"
    assert alert3['activity'] == 'Fighting', f"Expected Fighting activity in alert payload, got {alert3['activity']}"
    print("[PASS] Test 3 Passed: Aggressive fight is correctly detected as Fighting (SUSPICIOUS).")

    print("\n" + "=" * 60)
    print("ALL TESTS PASSED SUCCESSFULLY! 100% VERIFIED.")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
