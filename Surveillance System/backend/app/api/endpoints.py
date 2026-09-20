from fastapi import APIRouter, Depends, HTTPException, Query, Response
from fastapi.responses import StreamingResponse, Response
from sqlalchemy.orm import Session
from typing import List, Optional

from app.database.session import get_db
from app.models.models import Camera, Event, SystemSetting
from app.schemas.schemas import (
    CameraResponse, CameraCreate,
    EventResponse, SystemSettingResponse, SystemSettingUpdate,
    AnalyticsDistributionResponse, AnalyticsDistributionItem
)
from app.services.camera_service import camera_manager
from app.services.export_service import export_events_to_csv

router = APIRouter()

from sqlalchemy import func

# ----------------- CAMERAS -----------------
@router.get("/cameras", response_model=List[CameraResponse])
def get_cameras(db: Session = Depends(get_db)):
    cameras = db.query(Camera).all()
    if not cameras:
        # Seed default camera
        default_cam = Camera(
            camera_id="CAM-01",
            name="Main Corridor",
            location="Main Corridor",
            source="0",
            status="Online",
            is_active=True
        )
        db.add(default_cam)
        db.commit()
        db.refresh(default_cam)
        return [default_cam]
    return cameras

@router.post("/cameras", response_model=CameraResponse)
def create_camera(cam_in: CameraCreate, db: Session = Depends(get_db)):
    existing = db.query(Camera).filter(Camera.camera_id == cam_in.camera_id).first()
    if existing:
        existing.name = cam_in.name
        existing.location = cam_in.location
        existing.source = cam_in.source
        existing.status = cam_in.status
        db.commit()
        db.refresh(existing)
        return existing
    
    new_cam = Camera(**cam_in.dict())
    db.add(new_cam)
    db.commit()
    db.refresh(new_cam)
    return new_cam

@router.delete("/cameras/{camera_id}")
def delete_camera(camera_id: str, db: Session = Depends(get_db)):
    cam = db.query(Camera).filter(Camera.camera_id == camera_id).first()
    if not cam:
        raise HTTPException(status_code=404, detail="Camera not found")
    db.delete(cam)
    db.commit()
    return {"status": "success", "message": f"Camera {camera_id} deleted"}


# ----------------- EVENTS -----------------
@router.get("/events", response_model=List[EventResponse])
def get_events(
    activity: Optional[str] = None,
    status: Optional[str] = None,
    camera_id: Optional[str] = None,
    event_type: Optional[str] = None,
    search: Optional[str] = None,
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    limit: int = 100,
    offset: int = 0,
    db: Session = Depends(get_db)
):
    query = db.query(Event)

    if activity and activity != "All":
        if activity in ["Weapon Detected", "WEAPON_DETECTED"]:
            query = query.filter((Event.event_type == "WEAPON_DETECTED") | (Event.activity.like("%Detected%")))
        elif activity in ["Knife", "Knife Detected"]:
            query = query.filter((Event.weapon_type == "Knife") | (Event.activity.like("%Knife%")))
        elif activity in ["Gun", "Gun Detected"]:
            query = query.filter((Event.weapon_type == "Gun") | (Event.activity.like("%Gun%")))
        else:
            query = query.filter(Event.activity == activity)

    if event_type and event_type != "All":
        query = query.filter(Event.event_type == event_type)
    if status and status != "All":
        query = query.filter(Event.status == status)
    if camera_id and camera_id != "All":
        query = query.filter(Event.camera_id == camera_id)
    if date:
        query = query.filter(func.date(Event.created_at) == date)
    if start_date:
        query = query.filter(func.date(Event.created_at) >= start_date)
    if end_date:
        query = query.filter(func.date(Event.created_at) <= end_date)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            (Event.event_id.like(search_filter)) | 
            (Event.activity.like(search_filter)) | 
            (Event.location.like(search_filter)) |
            (Event.weapon_type.like(search_filter))
        )

    events = query.order_by(Event.created_at.desc()).offset(offset).limit(limit).all()
    return events

@router.get("/events/{event_id}", response_model=EventResponse)
def get_event_detail(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    return event

@router.delete("/events/{event_id}")
def delete_event(event_id: str, db: Session = Depends(get_db)):
    event = db.query(Event).filter(Event.event_id == event_id).first()
    if not event:
        raise HTTPException(status_code=404, detail="Event not found")
    db.delete(event)
    db.commit()
    return {"status": "success", "message": f"Event {event_id} deleted"}

@router.get("/events/export/csv")
def export_csv(db: Session = Depends(get_db)):
    csv_data = export_events_to_csv(db)
    return Response(
        content=csv_data,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=surveillance_events.csv"}
    )


# ----------------- ANALYTICS -----------------
@router.get("/analytics/distribution", response_model=AnalyticsDistributionResponse)
def get_activity_distribution(db: Session = Depends(get_db)):
    events = db.query(Event).all()
    
    counts = {
        "Walking": 0,
        "Running": 0,
        "Fighting": 0,
        "Loitering": 0,
        "Falling": 0,
        "Standing": 0,
        "Knife": 0,
        "Gun": 0,
        "Others": 0
    }

    for e in events:
        act = e.activity
        w_type = e.weapon_type
        if w_type and w_type in counts:
            counts[w_type] += 1
        elif act in counts:
            counts[act] += 1
        elif "Knife" in act:
            counts["Knife"] += 1
        elif "Gun" in act:
            counts["Gun"] += 1
        else:
            counts["Others"] += 1

    color_map = {
        "Walking": "#10B981",   # Emerald Green
        "Running": "#3B82F6",   # Blue
        "Fighting": "#EF4444",  # Red
        "Loitering": "#F59E0B", # Amber
        "Falling": "#8B5CF6",   # Purple
        "Standing": "#06B6D4",  # Cyan
        "Knife": "#DC2626",     # Dark Red
        "Gun": "#B91C1C",       # Deep Red
        "Others": "#6B7280"    # Gray
    }

    distribution = [
        AnalyticsDistributionItem(name=k, value=v, color=color_map.get(k, "#6B7280"))
        for k, v in counts.items() if v > 0 or k in ["Walking", "Running", "Fighting", "Knife", "Gun"]
    ]

    total_events = sum(counts.values())

    return AnalyticsDistributionResponse(
        total_events=total_events,
        distribution=distribution
    )

@router.get("/analytics/weapons")
def get_weapon_analytics(db: Session = Depends(get_db)):
    """Returns real database statistics for weapon alerts."""
    today_str = func.date('now')
    weapon_events = db.query(Event).filter(
        (Event.event_type == "WEAPON_DETECTED") | 
        (Event.weapon_type.isnot(None)) | 
        (Event.activity.like("%Knife%")) | 
        (Event.activity.like("%Gun%"))
    ).all()

    knife_count = sum(1 for e in weapon_events if (e.weapon_type == "Knife" or "Knife" in e.activity))
    gun_count = sum(1 for e in weapon_events if (e.weapon_type == "Gun" or "Gun" in e.activity))
    
    return {
        "total_weapon_alerts": len(weapon_events),
        "knife_count": knife_count,
        "gun_count": gun_count
    }

@router.get("/analytics/snapshots", response_model=List[EventResponse])
def get_recent_snapshots(limit: int = 6, db: Session = Depends(get_db)):
    snapshots = db.query(Event).filter(
        Event.status == "SUSPICIOUS",
        Event.snapshot_path.isnot(None)
    ).order_by(Event.created_at.desc()).limit(limit).all()
    return snapshots


# ----------------- SETTINGS -----------------
@router.get("/settings", response_model=SystemSettingResponse)
def get_settings(db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        setting = SystemSetting(
            confidence_threshold=0.60,
            alert_cooldown=10,
            loitering_threshold=10,
            alert_enabled=True,
            sound_enabled=True,
            active_camera_id="CAM-01",
            weapon_detection_enabled=True,
            weapon_confidence_threshold=0.60,
            weapon_confirmation_frames=3
        )
        db.add(setting)
        db.commit()
        db.refresh(setting)
    return setting

@router.post("/settings", response_model=SystemSettingResponse)
def update_settings(sett_in: SystemSettingUpdate, db: Session = Depends(get_db)):
    setting = db.query(SystemSetting).first()
    if not setting:
        setting = SystemSetting(**sett_in.dict())
        db.add(setting)
    else:
        setting.confidence_threshold = sett_in.confidence_threshold
        setting.alert_cooldown = sett_in.alert_cooldown
        setting.loitering_threshold = sett_in.loitering_threshold
        setting.alert_enabled = sett_in.alert_enabled
        setting.sound_enabled = sett_in.sound_enabled
        setting.active_camera_id = sett_in.active_camera_id
        setting.weapon_detection_enabled = sett_in.weapon_detection_enabled
        setting.weapon_confidence_threshold = sett_in.weapon_confidence_threshold
        setting.weapon_confirmation_frames = sett_in.weapon_confirmation_frames

    db.commit()
    db.refresh(setting)

    # Apply settings to the live AI pipeline immediately
    camera_manager.apply_settings(
        confidence_threshold=setting.confidence_threshold,
        alert_cooldown=setting.alert_cooldown,
        loitering_threshold=setting.loitering_threshold,
        weapon_detection_enabled=setting.weapon_detection_enabled,
        weapon_confidence_threshold=setting.weapon_confidence_threshold,
        weapon_confirmation_frames=setting.weapon_confirmation_frames
    )

    return setting


# ----------------- LIVE VIDEO STREAM -----------------
@router.get("/stream/video_feed")
def video_feed(source: Optional[str] = Query("0")):
    feed_source = source if source and source != "" else "0"
    return StreamingResponse(
        camera_manager.generate_mjpeg_stream(source=feed_source),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
