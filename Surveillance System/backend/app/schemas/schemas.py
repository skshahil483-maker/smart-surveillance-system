from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class CameraBase(BaseModel):
    camera_id: str
    name: str
    location: str
    source: str = "0"
    status: str = "Online"
    is_active: bool = True

class CameraCreate(CameraBase):
    pass

class CameraResponse(CameraBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class EventBase(BaseModel):
    event_id: str
    camera_id: str
    event_type: Optional[str] = "SUSPICIOUS_ACTIVITY"
    activity: str
    status: str
    confidence: float
    person_ids: str
    weapon_type: Optional[str] = None
    weapon_confidence: Optional[float] = None
    location: str
    timestamp: str
    snapshot_path: Optional[str] = None
    video_path: Optional[str] = None

class EventCreate(EventBase):
    pass

class EventResponse(EventBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class SystemSettingBase(BaseModel):
    confidence_threshold: float = 0.60
    alert_cooldown: int = 10
    loitering_threshold: int = 10
    alert_enabled: bool = True
    sound_enabled: bool = True
    active_camera_id: str = "CAM-01"
    weapon_detection_enabled: bool = True
    weapon_confidence_threshold: float = 0.60
    weapon_confirmation_frames: int = 3

class SystemSettingUpdate(SystemSettingBase):
    pass

class SystemSettingResponse(SystemSettingBase):
    id: int

    class Config:
        from_attributes = True

class AnalyticsDistributionItem(BaseModel):
    name: str
    value: int
    color: str

class AnalyticsDistributionResponse(BaseModel):
    total_events: int
    distribution: List[AnalyticsDistributionItem]

class TelemetryPayload(BaseModel):
    type: str
    camera_id: str
    persons_count: int
    activity: str
    status: str
    fps: float
    inference_ms: float
    timestamp: str
    active_alert: Optional[dict] = None
    detected_persons: List[dict] = []
