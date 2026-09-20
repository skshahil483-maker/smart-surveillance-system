import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from app.database.session import Base

class Camera(Base):
    __tablename__ = "cameras"

    id = Column(Integer, primary_key=True, index=True)
    camera_id = Column(String(50), unique=True, index=True, nullable=False)
    name = Column(String(100), nullable=False)
    location = Column(String(100), nullable=False)
    source = Column(String(255), nullable=False, default="0")
    status = Column(String(20), nullable=False, default="Online") # Online, Offline
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    event_id = Column(String(50), unique=True, index=True, nullable=False)
    camera_id = Column(String(50), nullable=False, default="CAM-01")
    event_type = Column(String(50), default="SUSPICIOUS_ACTIVITY") # SUSPICIOUS_ACTIVITY, WEAPON_DETECTED
    activity = Column(String(50), nullable=False) # Fighting, Walking, Running, Loitering, Falling, Trespassing, Knife Detected, Gun Detected
    status = Column(String(20), nullable=False) # SUSPICIOUS, NORMAL
    confidence = Column(Float, nullable=False)
    person_ids = Column(String(100), nullable=False) # e.g. "01, 02"
    weapon_type = Column(String(50), nullable=True) # Knife, Gun
    weapon_confidence = Column(Float, nullable=True)
    location = Column(String(100), nullable=False)
    timestamp = Column(String(30), nullable=False) # Formatted time string
    snapshot_path = Column(String(255), nullable=True)
    video_path = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class PersonTrack(Base):
    __tablename__ = "person_tracks"

    id = Column(Integer, primary_key=True, index=True)
    track_id = Column(String(20), nullable=False) # e.g. "01"
    camera_id = Column(String(50), nullable=False, default="CAM-01")
    activity = Column(String(50), nullable=False)
    status = Column(String(20), nullable=False) # SUSPICIOUS, NORMAL
    confidence = Column(Float, nullable=False)
    first_seen = Column(DateTime, default=datetime.datetime.utcnow)
    last_seen = Column(DateTime, default=datetime.datetime.utcnow)

class SystemSetting(Base):
    __tablename__ = "settings"

    id = Column(Integer, primary_key=True, index=True)
    confidence_threshold = Column(Float, default=0.60)
    alert_cooldown = Column(Integer, default=10) # in seconds
    loitering_threshold = Column(Integer, default=10) # in seconds
    alert_enabled = Column(Boolean, default=True)
    sound_enabled = Column(Boolean, default=True)
    active_camera_id = Column(String(50), default="CAM-01")
    weapon_detection_enabled = Column(Boolean, default=True)
    weapon_confidence_threshold = Column(Float, default=0.60)
    weapon_confirmation_frames = Column(Integer, default=3)
