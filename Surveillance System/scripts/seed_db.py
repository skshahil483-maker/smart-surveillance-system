import sys
import os

# Add backend directory to sys.path
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "backend"))

from app.database.session import SessionLocal, init_db
from app.models.models import Camera, Event, SystemSetting
import cv2
import numpy as np

def create_sample_snapshots(storage_dir):
    snapshots_dir = os.path.join(storage_dir, "snapshots")
    crops_dir = os.path.join(storage_dir, "crops")
    os.makedirs(snapshots_dir, exist_ok=True)
    os.makedirs(crops_dir, exist_ok=True)

    # 1. Fighting Snapshot
    img1 = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img1, (0, 0), (640, 480), (35, 40, 50), -1)
    cv2.rectangle(img1, (200, 100), (380, 420), (44, 44, 239), 3) # Person 01
    cv2.rectangle(img1, (340, 110), (500, 430), (44, 44, 239), 3) # Person 02
    cv2.putText(img1, "Person 01 (Fighting SUSPICIOUS)", (210, 90), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(img1, "SUSPICIOUS ACTIVITY DETECTED", (30, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (68, 68, 239), 2)
    cv2.imwrite(os.path.join(snapshots_dir, "EVT-000001.jpg"), img1)

    # 2. Falling Snapshot
    img2 = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img2, (0, 0), (640, 480), (40, 45, 55), -1)
    cv2.rectangle(img2, (150, 300), (450, 420), (44, 44, 239), 3) # Fallen posture
    cv2.putText(img2, "Person 05 (Falling SUSPICIOUS)", (160, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(img2, "POSSIBLE FALL DETECTED", (30, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (68, 68, 239), 2)
    cv2.imwrite(os.path.join(snapshots_dir, "EVT-000005.jpg"), img2)

    # 3. Trespassing Snapshot
    img3 = np.zeros((480, 640, 3), dtype=np.uint8)
    cv2.rectangle(img3, (0, 0), (640, 480), (30, 35, 45), -1)
    cv2.rectangle(img3, (280, 120), (420, 410), (44, 44, 239), 3)
    cv2.putText(img3, "Person 07 (Trespassing SUSPICIOUS)", (290, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2)
    cv2.putText(img3, "RESTRICTED AREA TRESPASSING", (30, 450), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (68, 68, 239), 2)
    cv2.imwrite(os.path.join(snapshots_dir, "EVT-000007.jpg"), img3)

    # Create sample person crops for track IDs 01, 02, 03, 04
    crop_configs = [
        ("01", (180, 150, 130), (40, 40, 60)),
        ("02", (170, 140, 120), (60, 40, 40)),
        ("03", (190, 160, 140), (40, 60, 40)),
        ("04", (175, 145, 125), (60, 60, 40)),
    ]
    for tid, skin_color, shirt_color in crop_configs:
        crop = np.zeros((160, 160, 3), dtype=np.uint8)
        # Background
        cv2.rectangle(crop, (0, 0), (160, 160), (30, 35, 45), -1)
        # Shirt / Shoulders
        cv2.ellipse(crop, (80, 150), (60, 40), 0, 0, 360, shirt_color, -1)
        # Face / Head
        cv2.circle(crop, (80, 75), 38, skin_color, -1)
        # Eyes
        cv2.circle(crop, (66, 70), 5, (20, 20, 20), -1)
        cv2.circle(crop, (94, 70), 5, (20, 20, 20), -1)
        # Mouth
        cv2.ellipse(crop, (80, 92), (12, 6), 0, 0, 180, (20, 20, 20), 2)
        # Hair
        cv2.ellipse(crop, (80, 50), (40, 25), 0, 180, 360, (20, 20, 20), -1)
        # Label
        cv2.putText(crop, f"ID: {tid}", (10, 150), cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 255, 255), 1)

        cv2.imwrite(os.path.join(crops_dir, f"crop_{tid}.jpg"), crop)

def seed_database():
    print("Initializing Database...")
    init_db()
    db = SessionLocal()

    storage_dir = os.path.join(BASE_DIR, "backend", "storage")
    create_sample_snapshots(storage_dir)

    try:
        # Seed Cameras
        if db.query(Camera).count() == 0:
            cameras = [
                Camera(camera_id="CAM-01", name="Main Corridor", location="Main Corridor", source="0", status="Online"),
                Camera(camera_id="CAM-02", name="Entrance Gate", location="Entrance", source="1", status="Online"),
                Camera(camera_id="CAM-03", name="Parking Lot", location="Parking Area", source="2", status="Offline"),
            ]
            db.add_all(cameras)
            print("Seeded 3 Cameras.")

        # Seed Settings
        if db.query(SystemSetting).count() == 0:
            setting = SystemSetting(
                confidence_threshold=0.60,
                alert_cooldown=10,
                loitering_threshold=10,
                alert_enabled=True,
                sound_enabled=True,
                active_camera_id="CAM-01"
            )
            db.add(setting)
            print("Seeded System Settings.")

        # Seed Events matching reference screenshot log
        if db.query(Event).count() == 0:
            events = [
                Event(
                    event_id="EVT-000001",
                    camera_id="CAM-01",
                    activity="Fighting",
                    status="SUSPICIOUS",
                    confidence=0.94,
                    person_ids="01, 02",
                    location="Main Corridor",
                    timestamp="17:25:32",
                    snapshot_path="/storage/snapshots/EVT-000001.jpg"
                ),
                Event(
                    event_id="EVT-000002",
                    camera_id="CAM-01",
                    activity="Running",
                    status="NORMAL",
                    confidence=0.88,
                    person_ids="04",
                    location="Main Corridor",
                    timestamp="17:18:11",
                    snapshot_path=None
                ),
                Event(
                    event_id="EVT-000003",
                    camera_id="CAM-02",
                    activity="Loitering",
                    status="SUSPICIOUS",
                    confidence=0.85,
                    person_ids="03",
                    location="Entrance",
                    timestamp="17:12:03",
                    snapshot_path=None
                ),
                Event(
                    event_id="EVT-000004",
                    camera_id="CAM-01",
                    activity="Walking",
                    status="NORMAL",
                    confidence=0.95,
                    person_ids="03, 04",
                    location="Main Corridor",
                    timestamp="16:58:41",
                    snapshot_path=None
                ),
                Event(
                    event_id="EVT-000005",
                    camera_id="CAM-03",
                    activity="Falling",
                    status="SUSPICIOUS",
                    confidence=0.89,
                    person_ids="05",
                    location="Parking Area",
                    timestamp="16:45:20",
                    snapshot_path="/storage/snapshots/EVT-000005.jpg"
                ),
                Event(
                    event_id="EVT-000006",
                    camera_id="CAM-02",
                    activity="Walking",
                    status="NORMAL",
                    confidence=0.92,
                    person_ids="06",
                    location="Entrance",
                    timestamp="16:32:11",
                    snapshot_path=None
                ),
                Event(
                    event_id="EVT-000007",
                    camera_id="CAM-01",
                    activity="Trespassing",
                    status="SUSPICIOUS",
                    confidence=0.91,
                    person_ids="07",
                    location="Main Corridor",
                    timestamp="16:21:09",
                    snapshot_path="/storage/snapshots/EVT-000007.jpg"
                ),
                Event(
                    event_id="EVT-000008",
                    camera_id="CAM-03",
                    activity="Standing",
                    status="NORMAL",
                    confidence=0.90,
                    person_ids="08",
                    location="Parking Area",
                    timestamp="16:10:44",
                    snapshot_path=None
                ),
            ]
            db.add_all(events)
            print(f"Seeded {len(events)} Event records.")

        db.commit()
        print("Database seeding completed successfully!")
    except Exception as e:
        print(f"Error seeding database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
